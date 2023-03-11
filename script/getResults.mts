import { AthleticsEvent, MeetCache, DLMeet, Entries, Entrant, ResultEntrant } from './types.mjs';
import fs from 'fs';
import { CACHE_PATH, ENTRIES_PATH, getDomainAndPath, runningEvents } from './const.mjs';
import { JSDOM } from 'jsdom';

const resultsLinks: { [k in DLMeet]: string } = {
  doha: 'https://web.archive.org/web/20220512074007/https://doha.diamondleague.com/programme-results-doha/',
  birminghamIndoor:
    'https://results-json.microplustimingservices.com/export/WAITF2023/ScheduleByDate_1.JSON',
  ncaai23: 'https://flashresults.ncaa.com/Indoor/2023/index.htm',
};

const cache: MeetCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));

const findMatchingEvt = (meetEntries: Entries['ncaai23'], evt: AthleticsEvent) => {
  return Object.keys(meetEntries!).find((entriesEvt) =>
    runningEvents.find((group) => group.includes(entriesEvt))!.includes(evt)
  )!;
};

for (const key in resultsLinks) {
  const meet = key as DLMeet;
  if (meet !== 'ncaai23') continue;
  cache[meet] ??= { schedule: {}, events: {}, ids: {} };
  if (resultsLinks[meet].includes('flashresults')) {
    cache[meet].resultsSchedule ??= await (await fetch(resultsLinks[meet])).text();
    const { document } = new JSDOM(cache[meet].resultsSchedule).window;
    const rows = document.querySelectorAll('tbody > tr');
    const runningFinals: { evt: AthleticsEvent; link: string }[] = [...rows]
      .filter(
        (tr) =>
          runningEvents.flat().includes(tr.querySelector('td.fixed-column')?.textContent!) &&
          tr.querySelectorAll('td')[4].textContent?.startsWith('Final')
      )
      .map((tr) => ({
        evt: findMatchingEvt(
          entries[meet],
          tr.querySelector('td.fixed-column')?.textContent! as AthleticsEvent
        ) as AthleticsEvent,
        link:
          getDomainAndPath(resultsLinks[meet]) +
          [...tr.querySelectorAll('td')]
            .find((td) => td.textContent?.trim() === 'Result')! // TODO change to 'Result'
            .querySelector('a')?.href,
      }));
    for (const { evt, link } of runningFinals) {
      console.log(evt, link);
      const { document } = new JSDOM(await (await fetch(link)).text()).window;
      const resultRows = document.querySelectorAll('table.table-striped > tbody > tr');
      const results: ResultEntrant[] = [...resultRows]
        .map((tr) => ({
          entrant: entries[meet]![evt]?.entrants.find(
            (ent: Entrant) =>
              `${ent.firstName} ${ent.lastName.toUpperCase()}` ===
              tr.querySelectorAll('td')[2].querySelector('a')!.textContent?.trim()
          )!,
          place: +tr.querySelectorAll('td')[0].textContent?.trim()!,
          mark: tr.querySelectorAll('td')[3].textContent?.trim()!.split(' ')[0]!,
          notes: [...tr.querySelectorAll('td')].at(-1)?.textContent?.trim() ?? '',
        }))
        .filter((res) => !(!res.mark && !res.notes));
      if (results.length) entries[meet]![evt]!.results = results;
      else entries[meet]![evt]!.results = undefined;
    }
    continue;
  }

  const meetCode = resultsLinks[meet].match(
    /^https:\/\/results-json\.microplustimingservices\.com\/export\/(.*)\//
  )![1];
  cache[meet].resultsSchedule ??= await (await fetch(resultsLinks[meet])).text();
  const resultsSchedule = JSON.parse(cache[meet].resultsSchedule!);
  for (const { c0, c1, c2, c3, tab, d1_en, d3_en, d_en } of resultsSchedule.e) {
    const evt = `${d3_en}'s ${d_en}` as AthleticsEvent;
    if (!entries[meet]![evt]) continue;
    if (d1_en !== 'Final') continue;
    const resultCode = tab.find((t: { p_en: string }) => t.p_en === 'Result')?.nf;
    cache[meet].events[evt] ??= {};
    cache[meet].events[evt]!.results ??= await (
      await fetch(
        `https://results-json.microplustimingservices.com/export/${meetCode}/AT${c0}${c1}${resultCode}${String(
          +c2
        ).padStart(2, '0')}%20${c3}.JSON`
      )
    ).text();
    const evtResults = JSON.parse(cache[meet].events[evt]!.results!);
    entries[meet]![evt]!.results = evtResults.data.map(
      (dat: {
        MemPrest: string;
        PlaCls: string;
        MemNote: string;
        PlaName: string;
        PlaSurname: string;
      }) => {
        return {
          mark: dat.MemPrest,
          place: +dat.PlaCls,
          notes: dat.MemNote,
          entrant: entries[meet]![evt]?.entrants.find(
            (ent) =>
              `${ent.firstName} ${ent.lastName.toUpperCase()}` ===
              `${dat.PlaName} ${dat.PlaSurname}`
          ),
        };
      }
    );
  }
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
