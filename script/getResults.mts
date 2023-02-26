import { AthleticsEvent, MeetCache, DLMeet, Entries } from './types.mjs';
import fs from 'fs';
import { CACHE_PATH, ENTRIES_PATH, runningEvents } from './const.mjs';

const resultsLinks: { [k in DLMeet]: string } = {
  doha: 'https://web.archive.org/web/20220512074007/https://doha.diamondleague.com/programme-results-doha/',
  birminghamIndoor:
    'https://results-json.microplustimingservices.com/export/WAITF2023/ScheduleByDate_1.JSON',
};

const cache: MeetCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));

for (const key in resultsLinks) {
  const meet = key as DLMeet;
  if (meet !== 'birminghamIndoor') continue;
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
