import fs from 'fs';
import { BLURBCACHE_PATH, ENTRIES_PATH, GRAPHQL_API_KEY, GRAPHQL_ENDPOINT, GRAPHQL_QUERY, MEET, standingsMeets } from './const.mjs';
import { AthleticsEvent, DLMeet, Entries, Competitor, ResultsByYearResult, BlurbCache } from './types.mjs';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
const blurbCache: BlurbCache = JSON.parse(fs.readFileSync(BLURBCACHE_PATH, 'utf-8'));

const cap = (str: string) => str[0].toUpperCase() + str.slice(1);

function nth(n: number) {
  return n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th');
}

function getAge(birthday: Date) {
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

async function getBlurbs() {
  // const api = new ChatGPTAPI({
  //   apiKey: process.env.OPENAI_API_KEY!,
  //   completionParams: {
  //     model: 'gpt-4',
  //   },
  // });

  blurbCache[MEET] ??= { blurbs: {}, athletes: {} };
  const meetName = MEET[0].toUpperCase() + MEET.slice(1, -2);
  for (const key in entries[MEET]) {
    const evt = key as AthleticsEvent;
    const gender = evt.toLowerCase().includes('women') ? 'Women' : 'Men';
    const targetTime = entries[MEET][evt]?.targetTime;
    const ungenderedEvt = evt
      .split(' ') .filter((w) => 
      !w.toLowerCase().includes('men')).join(' ').replace('m', ' Metres').replace(/Steeple$/, 'Steeplechase');
    fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache));
    fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries));
    if (!blurbCache[MEET].blurbs[evt]) {
      console.log(evt);
      const resp = (await (await fetch('https://habs.sdf.org:8080/match', {
        method: 'POST',
        body: JSON.stringify({
          discipline: ungenderedEvt,
          gender,
          athletes: entries[MEET][evt].entrants.map(e => ({ id: e.id, year: '2023' })),
        }),
      })).json());
      console.log(resp);
      blurbCache[MEET].blurbs[evt] = resp.response;
      fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache));
    }
  }
}

await getBlurbs();
