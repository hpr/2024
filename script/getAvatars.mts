import fs from 'fs';
import { Entrant, Entries } from './types.mjs';
import google from 'googlethis';
import { DOMWindow, JSDOM } from 'jsdom';
import gm from 'gm';
import { getDomain } from './const.mjs';
import WBK, { EntityId, SimplifiedItem } from 'wikibase-sdk';
import dotenv from 'dotenv';
dotenv.config();

//    .-.
//   (0.0)
// '=.|m|.='
// .='`"``=.

const tfrrsMode = false;

const PIXELME_API = 'https://pixel-me-api-gateway-cj34o73d6a-an.a.run.app/api/v1';
const key = 'AIzaSyB1icoMXVbxjiAzwBTI_4FufkzTnX78U0s'; // intentionally public
const AVATAR_CACHE = './script/avatarCache.json';
const P_TFRRS_ATHLETE_ID = 'P5120';
const P_WA_ATHLETE_ID = 'P1146';
const P_USATF_ATHLETE_ID = 'P10634';
const P_OLYMPEDIA_ID = 'P8286';
const P_DESCRIBED_AT_URL = 'P973';
const P_MOROCCAN_OLYMPIC_ID = 'P11019';
const P_PZLA_ATHLETE_ID = 'P5075';
const P_STRAVA_ID = 'P5283';
const P_EUROPEAN_ATHLETICS_ID = 'P3766';
const P_MEMBER_OF_SPORTS_TEAM = 'P54';
const P_INSTANCE_OF = 'P31';
const Q_UNIVERSITY_SPORTS_CLUB = 'Q2367225';

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

const avatarCache: { tfrrsUrls: { [k: string]: string }, urls: { [k: string]: string } } = JSON.parse(fs.readFileSync(AVATAR_CACHE, 'utf-8'));
const avatarCacheKey = tfrrsMode ? 'tfrrsUrls' : 'urls';

const entries: Entries = JSON.parse(fs.readFileSync('./public/entries.json', 'utf-8'));
const entrants: Entrant[] = tfrrsMode ? JSON.parse(fs.readFileSync('./script/tfrrsAthletes.json', 'utf-8')).map((te: any) => ({
  firstName: te.name.split(' ')[0],
  lastName: te.name.split(' ').slice(1).join(' '),
  team: te.team,
  id: te.id,
  pb: null,
  sb: null,
  nat: '',
})) : Object.values(entries).flatMap((meet) => Object.values(meet).flatMap(({ entrants }) => entrants));

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
  let document: Document, window: DOMWindow;
  try {
    ({ document, window } = new JSDOM(await (await fetch(url)).text()).window);
  } catch (e) {
    return { imgUrl: undefined, avatarBuffer: undefined };
  }
  const ogImages = document.querySelectorAll('meta[name="og:image"]');
  if (ogImages.length === 1 && !ogImages[0].getAttribute('content')?.includes('/amt-media/') && !ogImages[0].getAttribute('content')?.endsWith('site.png'))
    imgUrl = ogImages[0].getAttribute('content')!;
  const nots = `:not([src*=dummy-data])`;
  imgUrl ??= (document.querySelector('.player__hero img' + nots)?.getAttribute('src') ??
    document.querySelector('img.roster-bio-photo__image')?.getAttribute('url') ??
    document.querySelector('.sidearm-roster-player-image img')?.getAttribute('src') ??
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
    const elt = document.querySelector('.sidearm-roster-player-image-historical');
    if (elt) imgUrl = window.getComputedStyle(elt, null).backgroundImage.slice(4, -1).replace(/"/g, '');
  }
  console.log(imgUrl);
  if (!imgUrl) return {};
  let imgArrBuf: ArrayBuffer;
  try {
    imgArrBuf = await (await fetch(imgUrl!)).arrayBuffer();
  } catch (e) {
    return { imgUrl: undefined, avatarBuffer: undefined };
  }
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
  const { id, firstName, lastName, pb } = entrant;
  let team = entrant.team;
  console.log(id, firstName, lastName, team, i++, entrants.length);
  const file128 = `./public/img/${tfrrsMode ? 'tfrrsAvatars' : 'avatars'}/${id}_128x128.png`;
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
  let avatarResp = tfrrsMode ? new Response(null, { status: 403 }) : await fetch(imageUrl);
  if (avatarResp.status !== 403) console.log(imageUrl);
  let avatarBuffer: ArrayBuffer | undefined;
  let images: PixelMeImage[] = [];
  if (avatarResp.status === 403) {
    const qid: EntityId = wbk.parse.pagesTitles(
      await (await fetch(wbk.cirrusSearchPages({ haswbstatement: `${tfrrsMode ? P_TFRRS_ATHLETE_ID : P_WA_ATHLETE_ID}=${id}` }))).json()
    )[0] as `Q${number}`;
    let athObj: SimplifiedItem | undefined = undefined;
    if (qid) {
      athObj = wbk.simplify.entity((await (await fetch(wbk.getEntities({ ids: qid }))).json()).entities[qid]) as SimplifiedItem;
      const qSportsTeam = athObj.claims?.[P_MEMBER_OF_SPORTS_TEAM]?.[0] as `Q${number}`;
      if (qSportsTeam) {
        const sportsTeamObj = wbk.simplify.entity((await (await fetch(wbk.getEntities({ ids: qSportsTeam }))).json()).entities[qSportsTeam]) as SimplifiedItem;
        if (sportsTeamObj.claims?.[P_INSTANCE_OF]?.some((claim) => claim === Q_UNIVERSITY_SPORTS_CLUB)) team = sportsTeamObj.labels?.en;
      }
    }
    if (avatarCache[avatarCacheKey][id]) {
      if (avatarCache[avatarCacheKey][id] === 'skip') {  (entrant as any).skipped = true; continue; }
      avatarResp = await fetch(avatarCache[avatarCacheKey][id]);
    } else {
      if (fs.existsSync(`./public/img/${tfrrsMode ? 'tfrrsAvatars' : 'avatars'}/${id}.png`)) {
        avatarBuffer = fs.readFileSync(`./public/img/${tfrrsMode ? 'tfrrsAvatars' : 'avatars'}/${id}.png`);
      } else if (team) { // comment out block until googlethis is fixed
        let imgUrl: string | undefined;
        const prevDomains: string[] = [];
        for (const { searchQuery, allowDupes } of [
          { searchQuery: `"${firstName} ${lastName}" ${team} track and field roster` },
          {
            searchQuery: `"${firstName} ${lastName}" ${new Date().getFullYear() - 1} track and field roster`,
          },
          {
            searchQuery: `"${firstName} ${lastName}" ${new Date().getFullYear() - 1} cross country roster`,
            allowDupes: true,
          },
        ]) {
          // const { results } = await google.search(searchQuery);
          // const { url } =
          //   results.find(({ url, is_sponsored }) => {
          //     if (is_sponsored) return false;
          //     if (!allowDupes && prevDomains.includes(getDomain(url))) return false;
          //     if (url.includes('tfrrs.org')) return false;
          //     if (url.includes('athletic.net')) return false;
          //     if (url.includes('worldathletics.org')) return false;
          //     if (url.endsWith('/roster/')) return false;
          //     return true;
          //   })! ?? {};
          const results = await (await fetch(`https://content-customsearch.googleapis.com/customsearch/v1?${new URLSearchParams({
            q: searchQuery,
            cx: process.env.GOOGLE_CX!,
            key: process.env.GOOGLE_KEY!,
          })}`)).json();
          results.items ??= [];
          console.log(results.items[0]?.link);
          const { link } = results.items.find(({ link }) => {
            if (!allowDupes && prevDomains.includes(getDomain(link))) return false;
            if (link.includes('tfrrs.org')) return false;
            if (link.includes('athletic.net')) return false;
            if (link.includes('worldathletics.org')) return false;
            if (link.includes('baseball')) return false;
            if (link.includes('swimming')) return false;
            if (link.endsWith('/roster/') || link.endsWith('/roster')) return false;
            if (link.endsWith('.pdf')) return false;
            return true;
          }) ?? {};
          if (!link) continue;
          prevDomains.push(getDomain(link));
          console.log(searchQuery, link);
          ({ imgUrl, avatarBuffer } = await getProfilePic(link, { firstName, lastName }));
          if (!avatarBuffer) continue;
          images = await getIcons(avatarBuffer);
          if (images.length) break;
        }
        if (!images.length) {
          console.log('Skipping');
          avatarCache[avatarCacheKey][id] = 'skip';
          (entrant as any).skipped = true;
          fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
          // fs.symlinkSync('./default_128x128.png', file128);
          continue;
        }
        avatarCache[avatarCacheKey][id] = imgUrl!;
        fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
      } else {
        if (qid && athObj) {
          const usatfId = athObj.claims?.[P_USATF_ATHLETE_ID]?.[0];
          const olympediaId = athObj.claims?.[P_OLYMPEDIA_ID]?.[0];
          const moroccanId = athObj.claims?.[P_MOROCCAN_OLYMPIC_ID]?.[0];
          const pzlaId = athObj.claims?.[P_PZLA_ATHLETE_ID]?.[0];
          const stravaId = athObj.claims?.[P_STRAVA_ID]?.[0];
          const europeanAthleticsId = athObj.claims?.[P_EUROPEAN_ATHLETICS_ID]?.[0];
          const describedAtUrl = athObj.claims?.[P_DESCRIBED_AT_URL]?.[0];
          console.log(describedAtUrl)
          if (usatfId) {
            const url = `https://www.usatf.org/athlete-bios/${usatfId}`;
            const { document } = new JSDOM(await (await fetch(url)).text()).window;
            let imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
            if (imageUrl?.startsWith('/')) imageUrl = getDomain(url) + imageUrl;
            avatarResp = await fetch(imageUrl!);
          } else if (moroccanId) {
            const url = `https://www.cnom.org.ma/fr/athlete/${moroccanId}`;
            const { document } = new JSDOM(await (await fetch(url)).text()).window;
            let imageUrl = document.querySelector('.profile-box img')?.getAttribute('src');
            if (imageUrl?.startsWith('/')) imageUrl = getDomain(url) + imageUrl;
            avatarResp = await fetch(imageUrl!);
          } else if (pzlaId) {
            const url = `https://statystyka.pzla.pl/personal.php?page=profile&nr_zaw=${pzlaId}`;
            const { document } = new JSDOM(await (await fetch(url)).text()).window;
            let imageUrl = document.querySelector('td[align=center] img')?.getAttribute('src');
            if (!imageUrl?.startsWith('/')) imageUrl = 'https://statystyka.pzla.pl/' + imageUrl;
            avatarResp = await fetch(imageUrl!);
          } else if (stravaId) {
            const url = `https://www.strava.com/pros/${stravaId}`;
            const { document } = new JSDOM(await (await fetch(url)).text()).window;
            const imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
            avatarResp = await fetch(imageUrl!);
          } else if (olympediaId) {
            const imageUrl = `https://d2a3o6pzho379u.cloudfront.net/${olympediaId}.jpg`;
            avatarResp = await fetch(imageUrl);
          } else if (europeanAthleticsId) {
            const imageUrl = `https://res.cloudinary.com/european-athletics/d_default.png/athletes-profile-pictures/${europeanAthleticsId}`;
            avatarResp = await fetch(imageUrl);
          } else if (describedAtUrl) {
            let imgUrl: string | undefined;
            ({ imgUrl, avatarBuffer } = await getProfilePic(describedAtUrl as string, { firstName, lastName }));
            avatarCache[avatarCacheKey][id] = imgUrl!;
            fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
            if (!avatarBuffer) continue;
            // if (images.length) break;
            // const { document } = new JSDOM(await (await fetch(describedAtUrl as string)).text()).window;
            // let imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
            // if (imageUrl?.startsWith('/')) imageUrl = getDomain(describedAtUrl as string) + imageUrl;
            // avatarResp = await fetch(imageUrl!);
          }
        }
      }
    }
  }
  if (avatarResp.status === 403 && !avatarBuffer) continue;
  avatarBuffer ??= await avatarResp.arrayBuffer();
  const size: gm.Dimensions = await new Promise((res) => gm(Buffer.from(avatarBuffer!), 'image.jpg').size((_, size) => res(size)));
  if (size.width > 1024 || (size.height > 1024 && size.width > 800))
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
      fs.writeFileSync(`./public/img/${tfrrsMode ? 'tfrrsAvatars' : 'avatars'}/${id}_${label}.png`, Buffer.from(image, 'base64'));
    }
  }
  avatarCache[avatarCacheKey][id] ??= imageUrl;
  fs.writeFileSync(AVATAR_CACHE, JSON.stringify(avatarCache, null, 2));
}
if (changedEntrants && !tfrrsMode) {
  fs.writeFileSync('./public/entries.json', JSON.stringify(entries));
}
if (tfrrsMode) {
  fs.writeFileSync('./script/tfrrsAthletes.json', JSON.stringify(entrants, null, 2));
}
