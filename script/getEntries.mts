import { JSDOM } from 'jsdom';
import fs from 'fs';
import { nameFixer } from 'name-fixer';
import { AthleticsEvent, DLMeet, Entrant, Entries } from './types.mjs';

import PDFParser, { Output } from 'pdf2json';

const CACHE_PATH = './script/cache.json';

const runningEvents: AthleticsEvent[][] = [
  ["Women's 60 m"],
  ["Men's 60 m"],
  ["Men's 60 m Hurdles"],
  ['100m Women'],
  ['100m Men'],
  ['100m H Women'],
  ['110m H Men'],
  ['200m Women'],
  ['200m Men'],
  ['400m Women'],
  ['400m Men', "Men's 400 m"],
  ['400m H Women'],
  ['400m H Men'],
  ['800m Women', "Women's 800 m"],
  ['800m Men'],
  ["Women's 1000 m"],
  ['1500m Women'],
  ['1500m Men', "Men's 1500 m"],
  ['3000m Women', "Women's 3000 m"],
  ['3000m Men'],
  ['3000m SC Women'],
  ['3000m SC Men'],
  ['5000m Women'],
  ['5000m Men'],
];

const cache: {
  [k in DLMeet]: {
    schedule: string;
    events: { [k: string]: string };
    ids: { [name: string]: string };
  };
} = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));

const schedules: { [k in DLMeet]: string } = {
  doha: 'https://web.archive.org/web/20220512074007/https://doha.diamondleague.com/programme-results-doha/',
  birminghamIndoor: './script/files/EntryList.PDF',
};

const getDomain = (url: string) => url.match(/(^https?:\/\/.+?)\//)![1]!;
const entrantSortFunc = (a: Entrant, b: Entrant) => {
  if (!a.pb && !b.pb) return 0;
  if (!a.pb) return 1;
  if (!b.pb) return -1;
  return a.pb.localeCompare(b.pb);
};
const entries: Entries = {};

for (const key in schedules) {
  const meet = key as DLMeet;
  if (meet !== 'birminghamIndoor') continue;
  entries[meet] = {};
  if (schedules[meet].endsWith('.PDF')) {
    const pdfParser = new PDFParser();
    const pdfData: Output = await new Promise((res, rej) => {
      pdfParser.loadPDF(schedules[meet]);
      pdfParser.on('pdfParser_dataReady', res);
      pdfParser.on('pdfParser_dataError', rej);
    });
    for (const page of pdfData.Pages) {
      const texts = page.Texts.map((t) => t.R[0].T);
      const evt = decodeURIComponent(texts[1]) as AthleticsEvent;
      if (!runningEvents.flat().includes(evt)) continue;
      if (evt === "Men's 60 m") continue; // not world indoor tour
      const athStringArrs = texts
        .slice(43, -11)
        .reduce(
          ({ num, arr, lastNumIdx }, str, i) => {
            if (+str === num + 1 && i > lastNumIdx + 1) return { num: ++num, arr, lastNumIdx: i };
            arr[num] ??= [];
            if (str === 'PAC') delete arr[num]; // pacer
            else arr[num].push(str);
            return { num, arr, lastNumIdx };
          },
          { num: 0, arr: [] as string[][], lastNumIdx: -Infinity }
        )
        .arr.filter((x) => x);
      // console.log(athStringArrs);
      const athletes: Entrant[] = await Promise.all(
        athStringArrs.map(async (arr) => {
          const nameWords = decodeURIComponent(arr[2]).split(' ');
          const firstNameStartIdx = nameWords.findIndex((word) => word.toUpperCase() !== word);
          const lastName = nameWords.slice(0, firstNameStartIdx).join(' ');
          const firstName = nameWords.slice(firstNameStartIdx).join(' ');
          let pb = '';
          let sb = '';

          const birthYear = arr[4];

          let id: string;
          if (cache?.[meet]?.ids[`${firstName} ${lastName}`])
            id = cache?.[meet]?.ids[`${firstName} ${lastName}`];
          else {
            const { data } = await (
              await fetch(
                'https://4usfq7rw2jf3bbrvf5jolayrxq.appsync-api.eu-west-1.amazonaws.com/graphql',
                {
                  headers: { 'x-api-key': 'da2-erlx4oraybbjrlxorsdgmemgua' },
                  body: JSON.stringify({
                    operationName: 'SearchCompetitors',
                    variables: { query: `${firstName} ${lastName}` },
                    query: `
                    query SearchCompetitors($query: String, $gender: GenderType, $disciplineCode: String, $environment: String, $countryCode: String) {
                      searchCompetitors(query: $query, gender: $gender, disciplineCode: $disciplineCode, environment: $environment, countryCode: $countryCode) {
                        aaAthleteId
                        birthDate
                      }
                    }`,
                  }),
                  method: 'POST',
                }
              )
            ).json();
            id = data.searchCompetitors.find(
              (ath: { birthDate: string }) =>
                !ath.birthDate || ath.birthDate.slice(-4) === birthYear
            ).aaAthleteId;
            cache[meet] ??= { schedule: '', events: {}, ids: {} };
            cache[meet].ids[`${firstName} ${lastName}`] = id;
            fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
          }

          if (arr.length === 6) {
            pb = arr[5];
          }
          if (arr.length === 7) {
            sb = arr[5];
            pb = arr[6];
          }
          return {
            firstName,
            lastName: nameFixer(lastName),
            nat: arr[3],
            id,
            sb: decodeURIComponent(sb),
            pb: decodeURIComponent(pb),
          };
        })
      );
      entries[meet]![evt] = {
        date: '2023-02-25',
        entrants: athletes.sort(entrantSortFunc),
      };
    }
    continue;
  }
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
    .filter(({ name }) => runningEvents.flat().includes(name as AthleticsEvent));
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
        nat: elem.querySelector('.column.nat')!.textContent!.trim(),
      };
    });
    console.log(entrants);
    const [day, month, year] = document.querySelector('.date')!.textContent!.trim().split('-');
    entries[meet]![name as AthleticsEvent] = {
      date: `${year}-${month}-${day}T${document
        .querySelector('.time')!
        .getAttribute('data-starttime')}`,
      entrants: entrants.sort(entrantSortFunc),
    };
  }
}

fs.writeFileSync('./public/entries.json', JSON.stringify(entries, null, 2));
