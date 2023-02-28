import fs from 'fs';
import { Entrant, Entries } from './types.mjs';
import google from 'googlethis';
import { JSDOM } from 'jsdom';
import gm from 'gm';

const PIXELME_API = 'https://pixel-me-api-gateway-cj34o73d6a-an.a.run.app/api/v1';
const key = 'AIzaSyB1icoMXVbxjiAzwBTI_4FufkzTnX78U0s';
const AVATAR_CACHE = './script/avatarCache.json';

const avatarCache: { urls: { [k: string]: string } } = JSON.parse(
  fs.readFileSync(AVATAR_CACHE, 'utf-8')
);

const getDomain = (url: string) => url.match(/(^https?:\/\/.+?)\//)![1]!;
const entries: Entries = JSON.parse(fs.readFileSync('./public/entries.json', 'utf-8'));
const entrants: Entrant[] = Object.values(entries).flatMap((meet) =>
  Object.values(meet).flatMap(({ entrants }) => entrants)
);

let i = 0;
for (const { id, firstName, lastName, team } of entrants) {
  console.log(id, firstName, lastName, i++, entrants.length);
  const file128 = `./public/img/avatars/${id}_128x128.png`;
  if (fs.existsSync(file128)) continue;
  const avatarResp = await fetch(`https://media.aws.iaaf.org/athletes/${id}.jpg`);
  let avatarBuffer: ArrayBuffer;
  if (avatarResp.status === 403) {
    if (team) {
      let imgUrl: string;
      if (avatarCache.urls[id]) imgUrl = avatarCache.urls[id];
      else {
        const { results } = await google.search(
          `${firstName} ${lastName} ${team} track and field roster`
        );
        const { url } =
          results.find(({ url, is_sponsored }) => {
            if (is_sponsored) return false;
            if (url.includes('tfrrs.org')) return false;
            if (url.includes('athletic.net')) return false;
            if (url.includes('worldathletics.org')) return false;
            return true;
          })! ?? {};
        if (!url) console.log(results);
        console.log(firstName, lastName, url);
        const { document } = new JSDOM(await (await fetch(url)).text()).window;
        imgUrl = (document.querySelector('meta[name="og:image"]')?.getAttribute('content') ??
          document
            .querySelector(`img.block[alt="${firstName} ${lastName}"]`)
            ?.getAttribute('src') ??
          document
            .querySelector(`img.block[alt="${firstName} ${lastName} Headshot"]`)
            ?.getAttribute('src') ??
          document.querySelector('.player__photo > img')?.getAttribute('src') ??
          document.querySelector('.bordeaux_bio__profile_picture > img')?.getAttribute('src') ??
          document.querySelector('.avatar > img')?.getAttribute('src') ??
          document.querySelector('.bio__aside > img')?.getAttribute('data-src') ??
          document.querySelector('.bio-info > img')?.getAttribute('src') ??
          document.querySelector('.c-rosterbio__player__image img')?.getAttribute('src') ??
          document.querySelector('.info-profile-image > img')?.getAttribute('src') ??
          document.querySelector('.photo > img')?.getAttribute('src') ??
          document.querySelector('img.seminoles-bio-single--photo')?.getAttribute('src'))!;
        if (imgUrl?.startsWith('/')) imgUrl = getDomain(url) + imgUrl;
        avatarCache.urls[id] = imgUrl!;
        fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
      }
      console.log(imgUrl);
      const imgArrBuf = await (await fetch(imgUrl!)).arrayBuffer();
      const size: gm.Dimensions = await new Promise((res) =>
        gm(Buffer.from(imgArrBuf), 'image.jpg').size((_, size) => res(size))
      );
      if (!size) {
        fs.symlinkSync('./default_128x128.png', file128);
        continue;
      }
      if (size.width > 512)
        avatarBuffer = await new Promise((res) =>
          gm(Buffer.from(imgArrBuf), 'image.jpg')
            .resize(512)
            .toBuffer('PNG', (_, buf) => res(buf))
        );
      else avatarBuffer = imgArrBuf;
    } else {
      fs.symlinkSync('./default_128x128.png', file128);
      continue;
    }
  }
  avatarBuffer ??= await avatarResp.arrayBuffer();
  const b64 = Buffer.from(avatarBuffer).toString('base64');
  const { data: detectData, ...rest } = await (
    await fetch(`${PIXELME_API}/detect?${new URLSearchParams({ key })}`, {
      headers: { 'content-type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({
        image: b64, // Buffer.from(fs.readFileSync('./script/kerley.jpg')).toString('base64'),
      }),
      method: 'POST',
    })
  ).json();
  if (Object.keys(rest).length) console.log(rest);
  if (rest.detail === 'No face detected.') {
    fs.symlinkSync('./default_128x128.png', file128);
    continue;
  }
  const { image } = detectData;
  const { data: faceData } = await (
    await fetch(`${PIXELME_API}/convert/face?${new URLSearchParams({ key })}`, {
      headers: { 'content-type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ image }),
      method: 'POST',
    })
  ).json();
  const { images }: { images: { label: string; image: string }[] } = faceData;
  for (const { label, image } of images) {
    fs.writeFileSync(`./public/img/avatars/${id}_${label}.png`, Buffer.from(image, 'base64'));
  }
}
