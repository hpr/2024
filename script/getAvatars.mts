import fs from 'fs';
import { Entrant, Entries } from './types.mjs';
import google, { image, search } from 'googlethis';
import { JSDOM } from 'jsdom';
import gm from 'gm';
import { getDomain } from './const.mjs';
import WBK, { EntityId, SimplifiedItem } from 'wikibase-sdk';

//    .-.
//   (0.0)
// '=.|m|.='
// .='`"``=.

const PIXELME_API = 'https://pixel-me-api-gateway-cj34o73d6a-an.a.run.app/api/v1';
const key = 'AIzaSyB1icoMXVbxjiAzwBTI_4FufkzTnX78U0s';
const AVATAR_CACHE = './script/avatarCache.json';
const P_WA_ATHLETE_ID = 'P1146';
const P_USATF_ATHLETE_ID = 'P10634';
const P_OLYMPEDIA_ID = 'P8286';
const P_DESCRIBED_AT_URL = 'P973';

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

const avatarCache: { urls: { [k: string]: string } } = JSON.parse(fs.readFileSync(AVATAR_CACHE, 'utf-8'));

const entries: Entries = JSON.parse(fs.readFileSync('./public/entries.json', 'utf-8'));
const entrants: Entrant[] = Object.values(entries).flatMap((meet) => Object.values(meet).flatMap(({ entrants }) => entrants));

type PixelMeImage = { image: string; label: string };

const getIcons = async (avatarBuffer: ArrayBuffer) => {
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
  if (rest.detail === 'No face detected.' || rest.detail === 'Invalid input image.') {
    return [];
  }
  const { image } = detectData;
  const { data: faceData } = await (
    await fetch(`${PIXELME_API}/convert/face?${new URLSearchParams({ key })}`, {
      headers: { 'content-type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ image }),
      method: 'POST',
    })
  ).json();
  if (!faceData) {
    console.log('no faceData');
    return [];
  }
  const { images }: { images: PixelMeImage[] } = faceData;
  return images;
};

const getProfilePic = async (
  url: string,
  { firstName, lastName }: { firstName: string; lastName: string }
): Promise<{ imgUrl?: string; avatarBuffer?: ArrayBuffer }> => {
  let imgUrl: string | undefined;
  const { document, window } = new JSDOM(await (await fetch(url)).text()).window;
  const ogImages = document.querySelectorAll('meta[name="og:image"]');
  if (ogImages.length === 1 && !ogImages[0].getAttribute('content')?.includes('/amt-media/') && !ogImages[0].getAttribute('content')?.endsWith('site.png'))
    imgUrl = ogImages[0].getAttribute('content')!;
  const nots = `:not([src*=dummy-data])`;
  imgUrl ??= (document.querySelector('.player__hero img' + nots)?.getAttribute('src') ??
    document.querySelector(`img.block[alt="${firstName} ${lastName}"]` + nots)?.getAttribute('src') ??
    document.querySelector(`img.block[alt="${firstName} ${lastName} Headshot"]`)?.getAttribute('src') ??
    document.querySelector('.player__photo > img' + nots)?.getAttribute('src') ??
    document.querySelector('.bordeaux_bio__profile_picture > img' + nots)?.getAttribute('src') ??
    document.querySelector('.avatar > img' + nots)?.getAttribute('src') ??
    document.querySelector('.bio__aside > img' + nots)?.getAttribute('data-src') ??
    document.querySelector('.bio-info > img' + nots)?.getAttribute('src') ??
    document.querySelector('.c-rosterbio__player__image img' + nots)?.getAttribute('src') ??
    document.querySelector('.info-profile-image > img' + nots)?.getAttribute('src') ??
    document.querySelector('.photo > img' + nots)?.getAttribute('src') ??
    document.querySelector('.profile__header > img' + nots)?.getAttribute('src') ??
    document.querySelector('.bio-card_info_photo > div')?.getAttribute('data-bg') ??
    document.querySelector('.player_bio__photo img' + nots)?.getAttribute('src') ??
    document.querySelector('.s-person-card__header__image')?.getAttribute('src') ??
    document.querySelector('img.seminoles-bio-single--photo')?.getAttribute('src'))!;
  if (!imgUrl) {
    const matches = [...document.querySelectorAll('script')]
      .at(-1)
      ?.innerHTML.match(new RegExp(`images\\\\u002F\\d+\\\\u002F\\d+\\\\u002F\\d+\\\\u002F${firstName}_${lastName}.jpg`, 'i')) ?? [''];
    const relative = decodeURIComponent(JSON.parse('"' + matches[0].replace(/\"/g, '\\"') + '"'));
    if (relative) imgUrl = '/' + relative;
  }
  if (imgUrl?.startsWith('/')) imgUrl = getDomain(url) + imgUrl;
  if ((imgUrl ?? '').toLowerCase().split('/').at(-1)?.includes('logo')) {
    imgUrl = window.getComputedStyle(document.querySelector('.sidearm-roster-player-image-historical')!, null).backgroundImage.slice(4, -1).replace(/"/g, '');
  }
  console.log(imgUrl);
  if (!imgUrl) return {};
  const imgArrBuf = await (await fetch(imgUrl!)).arrayBuffer();
  const size: gm.Dimensions = await new Promise((res) => gm(Buffer.from(imgArrBuf), 'image.jpg').size((_, size) => res(size)));
  if (!size) return {};
  if (size.width > size.height * 1.5) return {};
  return {
    imgUrl,
    avatarBuffer:
      size.width > 512
        ? await new Promise((res) =>
            gm(Buffer.from(imgArrBuf), 'image.jpg')
              .resize(512)
              .toBuffer('PNG', (_, buf) => res(buf))
          )
        : imgArrBuf,
  };
};

let changedEntrants = false;
let i = 0;
for (const entrant of entrants) {
  const { id, firstName, lastName, team, pb } = entrant;
  console.log(id, firstName, lastName, team, i++, entrants.length);
  const file128 = `./public/img/avatars/${id}_128x128.png`;
  if (fs.existsSync(file128)) {
    if (fs.lstatSync(file128).isSymbolicLink()) {
      console.log('REMOVING SYMLINK', file128);
      fs.unlinkSync(file128);
    } else {
      entrant.hasAvy = true;
      changedEntrants = true;
      continue;
    }
  }
  let imageUrl = `https://media.aws.iaaf.org/athletes/${id}.jpg`;
  let avatarResp = await fetch(imageUrl);
  if (avatarResp.status !== 403) console.log(imageUrl);
  let avatarBuffer: ArrayBuffer | undefined;
  let images: PixelMeImage[] = [];
  if (avatarResp.status === 403) {
    if (avatarCache.urls[id]) {
      avatarResp = await fetch(avatarCache.urls[id]);
    }
    if (fs.existsSync(`./public/img/avatars/${id}.png`)) {
      avatarBuffer = fs.readFileSync(`./public/img/avatars/${id}.png`);
    } else if (team) {
      let imgUrl: string | undefined;
      const prevDomains: string[] = [];
      for (const { searchQuery, allowDupes } of [
        { searchQuery: `${firstName} ${lastName} ${team} track and field roster` },
        {
          searchQuery: `${firstName} ${lastName} ${new Date().getFullYear() - 1} track and field roster`,
        },
        {
          searchQuery: `${firstName} ${lastName} ${new Date().getFullYear() - 1} cross country roster`,
          allowDupes: true,
        },
      ]) {
        const { results } = await google.search(searchQuery);
        const { url } =
          results.find(({ url, is_sponsored }) => {
            if (is_sponsored) return false;
            if (!allowDupes && prevDomains.includes(getDomain(url))) return false;
            if (url.includes('tfrrs.org')) return false;
            if (url.includes('athletic.net')) return false;
            if (url.includes('worldathletics.org')) return false;
            if (url.endsWith('/roster/')) return false;
            return true;
          })! ?? {};
        if (!url) console.log(results);
        prevDomains.push(getDomain(url));
        console.log(searchQuery, url);
        ({ imgUrl, avatarBuffer } = await getProfilePic(url, { firstName, lastName }));
        if (!avatarBuffer) continue;
        images = await getIcons(avatarBuffer);
        if (images.length) break;
      }
      if (!images.length) {
        // fs.symlinkSync('./default_128x128.png', file128);
        continue;
      }
      avatarCache.urls[id] = imgUrl!;
      fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
    } else {
      const qid: EntityId = wbk.parse.pagesTitles(
        await (await fetch(wbk.cirrusSearchPages({ haswbstatement: `${P_WA_ATHLETE_ID}=${id}` }))).json()
      )[0] as `Q${number}`;
      if (qid) {
        const athObj = wbk.simplify.entity((await (await fetch(wbk.getEntities({ ids: qid }))).json()).entities[qid]) as SimplifiedItem;
        const usatfId = athObj.claims?.[P_USATF_ATHLETE_ID]?.[0];
        const olympediaId = athObj.claims?.[P_OLYMPEDIA_ID]?.[0];
        const describedAtUrl = athObj.claims?.[P_DESCRIBED_AT_URL]?.[0];
        if (usatfId) {
          const url = `https://www.usatf.org/athlete-bios/${usatfId}`;
          const { document } = new JSDOM(await (await fetch(url)).text()).window;
          let imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
          if (imageUrl?.startsWith('/')) imageUrl = getDomain(url) + imageUrl;
          avatarResp = await fetch(imageUrl!);
        } else if (olympediaId) {
          const imageUrl = `https://d2a3o6pzho379u.cloudfront.net/${olympediaId}.jpg`;
          avatarResp = await fetch(imageUrl);
        } else if (describedAtUrl) {
          const { document } = new JSDOM(await (await fetch(describedAtUrl as string)).text()).window;
          let imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
          if (imageUrl?.startsWith('/')) imageUrl = getDomain(describedAtUrl as string) + imageUrl;
          avatarResp = await fetch(imageUrl!);
        }
      }
    }
  }
  if (avatarResp.status === 403 && !avatarBuffer) continue;
  avatarBuffer ??= await avatarResp.arrayBuffer();
  const size: gm.Dimensions = await new Promise((res) => gm(Buffer.from(avatarBuffer!), 'image.jpg').size((_, size) => res(size)));
  if (size.width > 1024)
    avatarBuffer = await new Promise((res) =>
      gm(Buffer.from(avatarBuffer!), 'image.jpg')
        .resize(512)
        .toBuffer('PNG', (_, buf) => res(buf))
    );

  if (!images.length) images = await getIcons(avatarBuffer!);
  if (!images.length) {
    // fs.symlinkSync('./default_128x128.png', file128);
  } else {
    for (const { label, image } of images) {
      fs.writeFileSync(`./public/img/avatars/${id}_${label}.png`, Buffer.from(image, 'base64'));
    }
  }
  avatarCache.urls[id] ??= imageUrl;
  fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
}
if (changedEntrants) {
  fs.writeFileSync('./public/entries.json', JSON.stringify(entries));
}
