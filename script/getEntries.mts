import { JSDOM } from 'jsdom';
import fs from 'fs';
import { nameFixer } from 'name-fixer';
import { AthleticsEvent, DLMeet, Entrant, Entries } from './types.mjs';

const CACHE_PATH = './script/cache.json';

const runningEvents: AthleticsEvent[] = [
  '100m Women',
  '100m Men',
  '100m H Women',
  '110m H Men',
  '200m Women',
  '200m Men',
  '400m Women',
  '400m Men',
  '400m H Women',
  '400m H Men',
  '800m Women',
  '800m Men',
  '1500m Women',
  '1500m Men',
  '3000m Women',
  '3000m Men',
  '3000m SC Women',
  '3000m SC Men',
  '5000m Women',
  '5000m Men',
];

const cache: { [k in DLMeet]: { schedule: string; events: { [k: string]: string } } } = JSON.parse(
  fs.readFileSync(CACHE_PATH, 'utf-8')
);

const schedules: { [k in DLMeet]: string } = {
  doha: 'https://web.archive.org/web/20220512074007/https://doha.diamondleague.com/programme-results-doha/',
};

const getDomain = (url: string) => url.match(/(^https?:\/\/.+?)\//)![1]!;
const entries: Entries = {};

for (const key in schedules) {
  const meet = key as DLMeet;
  entries[meet] = {};
  if (!cache[meet].schedule) {
    cache[meet].schedule = await (await fetch(schedules[meet])).text();
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }
  const { document } = new JSDOM(cache[meet].schedule).window;
  const events = [...document.querySelectorAll('.competition.DR')]
    .map((elem) => ({
      name: elem.querySelector('.name')!.textContent!,
      url: elem.querySelector('.links a')!.getAttribute('href')!,
    }))
    .filter(({ name }) => runningEvents.includes(name as AthleticsEvent));
  for (const { name, url } of events) {
    if (!cache[meet].events[name]) {
      cache[meet].events[name] = await (await fetch(getDomain(schedules[meet]) + url)).text();
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
    const { document } = new JSDOM(cache[meet].events[name]).window;
    console.log(name);
    const entrants: Entrant[] = [...document.querySelectorAll('.tableBody .row')].map((elem) => {
      const [lastName, firstName] = elem
        .querySelector('.column.name')!
        .textContent!.split(' ')
        .map((word) => word.trim())
        .filter((word) => word)
        .join(' ')
        .split(', ');
      return {
        firstName,
        lastName: nameFixer(lastName),
        id: elem
          .querySelector('.column.name a')!
          .getAttribute('href')!
          .match(/\/(\d+)\.html$/)![1]!,
        pb: elem.querySelector('.column.pb')?.textContent || null,
        sb: elem.querySelector('.column.sb')?.textContent || null,
      };
    });
    console.log(entrants);
    entries[meet][name as AthleticsEvent] = entrants;
  }
}

fs.writeFileSync('./public/entries.json', JSON.stringify(entries, null, 2));
