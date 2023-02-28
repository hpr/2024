import { JSDOM } from 'jsdom';
import fs from 'fs';
import { nameFixer } from 'name-fixer';
import { AthleticsEvent, DLMeet, Entrant, Entries, MeetCache } from './types.mjs';

import PDFParser, { Output } from 'pdf2json';
import { CACHE_PATH, ENTRIES_PATH, runningEvents } from './const.mjs';

const cache: MeetCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));

const schedules: { [k in DLMeet]: string } = {
  doha: 'https://web.archive.org/web/20220512074007/https://doha.diamondleague.com/programme-results-doha/',
  birminghamIndoor: './script/files/EntryList.PDF',
  ncaai23:
    'https://www.tfrrs.org/list_data/3901?other_lists=https%3A%2F%2Ftf.tfrrs.org%2Flists%2F3901%2F2022_2023_NCAA_Division_I_Indoor_Qualifying_List&limit=16&event_type=&year=&gender=m',
};

const getDomain = (url: string) => url.match(/(^https?:\/\/.+?)\//)![1]!;
const entrantSortFunc = (a: Entrant, b: Entrant) => {
  if (!a.pb && !b.pb) return 0;
  if (!a.pb) return 1;
  if (!b.pb) return -1;
  return a.pb.localeCompare(b.pb);
};
const getWaId = async (
  firstName: string,
  lastName: string,
  {
    birthYear = '',
    college = false,
    indoors,
    gender,
  }: { birthYear?: string; college?: boolean; indoors?: boolean; gender?: string }
) => {
  const { data } = await (
    await fetch('https://4usfq7rw2jf3bbrvf5jolayrxq.appsync-api.eu-west-1.amazonaws.com/graphql', {
      headers: { 'x-api-key': 'da2-erlx4oraybbjrlxorsdgmemgua' },
      body: JSON.stringify({
        operationName: 'SearchCompetitors',
        variables: {
          query: `${firstName} ${lastName}`,
          environment: indoors ? 'indoor' : undefined,
          gender,
        },
        query: `
        query SearchCompetitors($query: String, $gender: GenderType, $disciplineCode: String, $environment: String, $countryCode: String) {
          searchCompetitors(query: $query, gender: $gender, disciplineCode: $disciplineCode, environment: $environment, countryCode: $countryCode) {
            aaAthleteId
            birthDate
            country
            givenName
            familyName
          }
        }`,
      }),
      method: 'POST',
    })
  ).json();
  const { aaAthleteId, country } = data.searchCompetitors.find(
    (ath: { birthDate: string, givenName: string, familyName: string }) => {
      if (
        firstName.toLowerCase() !== ath.givenName.toLowerCase() ||
        lastName.toLowerCase() !== ath.familyName.toLowerCase()
      )
        return false;
      if (!ath.birthDate) return true;
      if (birthYear) return ath.birthDate.slice(-4) === birthYear;
      if (college) return +ath.birthDate.slice(-4) > 1997;
    }
  );
  return { id: aaAthleteId, country };
};

const entries: Entries = {};

const getEntries = async () => {
  for (const key in schedules) {
    const meet = key as DLMeet;
    if (meet !== 'ncaai23') continue;
    entries[meet] = {};
    if (schedules[meet].startsWith('https://www.tfrrs.org')) {
      cache[meet] ??= { events: {}, ids: {} };
      cache[meet].schedule ??= await (await fetch(schedules[meet])).text();
      const { document } = new JSDOM(cache[meet].schedule).window;
      const eventDivs = document.querySelectorAll('.gender_m');
      for (const eventDiv of eventDivs) {
        const evt = `Men's ${eventDiv
          .querySelector('.custom-table-title > h3')
          ?.textContent?.trim()}` as AthleticsEvent;
        if (!runningEvents.flat().includes(evt)) continue;
        const athletes: Entrant[] = [];
        for (const row of eventDiv.querySelectorAll('.allRows')) {
          const [lastName, firstName] = row
            .querySelector('.tablesaw-priority-1')!
            .textContent!.trim()
            .split(', ')
            .map((name) => name.trim());
          const fullName = `${firstName} ${lastName}`;
          const { id, country } = (cache[meet].ids[fullName] ??= await getWaId(
            firstName,
            lastName,
            {
              college: true,
              indoors: true,
              gender: 'male',
            }
          ));
          const sbAnchor = [
            ...row.querySelectorAll('a[href^="https://www.tfrrs.org/results/"]'),
          ].find((a) =>
            a.getAttribute('href')?.match(/^https:\/\/www.tfrrs.org\/results\/\d+\/\d+\/.+?\/.+/)
          );
          const sb =
            sbAnchor?.parentElement?.tagName === 'SPAN'
              ? sbAnchor.parentElement.getAttribute('title')?.match(/([\d.:]+)/)![1]
              : sbAnchor?.textContent?.trim();
          athletes.push({
            id,
            team: row.querySelector('a[href^="https://www.tfrrs.org/teams/"]')?.textContent?.trim(),
            nat: country,
            pb: '',
            sb: sb!,
            firstName,
            lastName,
          });
          console.log(athletes.at(-1));
        }
        entries[meet] ??= {};
        entries[meet]![evt] = {
          date: '',
          entrants: athletes.sort(entrantSortFunc),
        };
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      }
      continue;
    } else if (schedules[meet].endsWith('.PDF')) {
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
              id = cache?.[meet]?.ids[`${firstName} ${lastName}`].id;
            else {
              cache[meet] ??= { schedule: '', events: {}, ids: {} };
              cache[meet].ids[`${firstName} ${lastName}`] = await getWaId(firstName, lastName, {
                birthYear,
              });
              id = cache[meet].ids[`${firstName} ${lastName}`].id;
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
    for (const { name: origName, url } of events) {
      const name = origName as AthleticsEvent;
      if (!cache[meet].events[name]?.startlist) {
        cache[meet].events[name] ??= {};
        cache[meet].events[name]!.startlist = await (
          await fetch(getDomain(schedules[meet]) + url)
        ).text();
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      }
      const { document } = new JSDOM(cache[meet].events[name]!.startlist).window;
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
  fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
};

getEntries();
