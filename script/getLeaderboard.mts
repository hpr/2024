// ssh habs@ma.sdf.org "sqlite3 -header -csv ~/db/fantasy1500.db 'select * from picks where meet = \"doha23\";'" > picks.csv
// ssh habs@ma.sdf.org 'sqlite3 -header -csv ~/db/fantasy1500.db "select * from users;"' > users.csv

import { MeetCache, DLMeet, Entries, LBType, AthleticsEvent, ResultEntrant, MeetTeam, LBPicks } from './types.mjs';
import fs from 'fs';
import { backupNotes, CACHE_PATH, disciplineCodes, distanceEvents, ENTRIES_PATH, LB_PATH, SCORE, sprintEvents } from './const.mjs';
import { parse } from 'csv-parse/sync';

const cache: MeetCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
const leaderboard: LBType = JSON.parse(fs.readFileSync(LB_PATH, 'utf-8'));

const rows: { picksJson: string; userid: number }[] = parse(fs.readFileSync('./picks.csv', 'utf-8'), {
  columns: true,
});
const users: { id: number; name: string }[] = parse(fs.readFileSync('./users.csv', 'utf-8'), {
  columns: true,
});

const getScore = (meet: DLMeet, team: MeetTeam, evt: AthleticsEvent): { score: number; scorers: { [id: string]: number } } => {
  let score = 0;
  const backup = team[evt]?.at(-1)!;
  const backupResult = (entries[meet]![evt]!.results ?? []).find((res) => res.entrant?.id === backup?.id) ?? { notes: 'DNS' };
  let doneBackup = false;
  if (backupNotes.some((note) => backupResult.notes.includes(note))) doneBackup = true;
  const scorers: { [id: string]: number } = {};
  for (const pick of team[evt]!.slice(0, -1)) {
    console.log(entries, meet, evt, Object.keys(entries[meet]![evt]!));
    let matchingResult = (entries[meet]![evt]!.results! ?? []).find((res) => res.entrant?.id === pick?.id);
    if (backupNotes.some((note) => matchingResult?.notes.includes(note)) && !doneBackup) {
      matchingResult = backupResult as ResultEntrant;
      doneBackup = true;
    }
    const isCaptain = pick === team[evt]![0];
    const pickScore = SCORE[matchingResult!?.place - 1] * (isCaptain ? 2 : 1) || 0;
    console.log(evt, pick.firstName, pick.lastName, matchingResult?.place, pickScore);
    scorers[matchingResult?.entrant!.id!] = pickScore;
    score += pickScore;
  }
  if (Number.isNaN(score)) process.exit();
  return { score, scorers };
};

const fixIds = (picks: MeetTeam) => {
  for (const key in picks) {
    const evt = key as AthleticsEvent;
    for (const pick of picks[evt]!) {
      pick.id = (() => {
        const pj = JSON.parse(
          [...rows].reverse().find(({ picksJson }) => {
            const pj = JSON.parse(picksJson);
            delete pj.tiebreaker;
            return (pj as MeetTeam)[evt]?.find((ath) => `${ath.firstName} ${ath.lastName}` === `${pick.firstName} ${pick.lastName}`);
          })?.picksJson!
        );
        delete pj.tiebreaker;
        return pj as MeetTeam;
      })()[evt]!.find((ath) => `${ath.firstName} ${ath.lastName}` === `${pick.firstName} ${pick.lastName}`)!.id;
    }
  }
};

const evtToGenderedCode = (evt: string): AthleticsEvent => {
  const words = evt.split(' ');
  const genderWordIdx = words.findIndex((word) => word.toLowerCase().includes('men'));
  const [genderWord] = words.splice(genderWordIdx, 1);
  return (genderWord[0].toUpperCase() + disciplineCodes[words.join(' ')]) as AthleticsEvent;
};

for (const meet of ['doha23'] as DLMeet[]) {
  leaderboard[meet] = [];
  for (const { picksJson, userid } of rows) {
    const picks: MeetTeam = JSON.parse(picksJson);
    delete (picks as any).tiebreaker;
    // fixIds(picks); // TODO remove in future

    const name = users.find(({ id }) => id === userid)!.name;

    const userPicks = Object.keys(picks!).reduce((acc, evt) => {
      const evtCode = evtToGenderedCode(evt);
      console.log(evtCode, evt);
      acc[evtCode as AthleticsEvent] = { team: picks![evt as AthleticsEvent]!.map(({ id }) => id) };
      return acc;
    }, {} as LBPicks);

    let distanceScore = 0;
    let sprintScore = 0;
    let eventsScored = 0;
    for (const key in picks) {
      const evt = key as AthleticsEvent;
      if (!entries[meet]![evt]!.results) continue;
      const { score: evtScore, scorers } = getScore(meet, picks, evt);
      userPicks[evtToGenderedCode(evt)]!.scorers = scorers;
      if (distanceEvents.includes(evt)) distanceScore += evtScore;
      if (sprintEvents.includes(evt)) sprintScore += evtScore;
      eventsScored++;
    }
    let score = distanceScore + sprintScore;
    if (name === 'Matty G' && meet === 'doha23') score += 0.5;

    leaderboard[meet]!.push({
      userid,
      name,
      picks: userPicks,
      distanceScore,
      sprintScore,
      eventsScored,
      score,
    });
    console.log(leaderboard[meet]!.at(-1));
  }
  leaderboard[meet]?.sort((a, b) => b.score - a.score);
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
fs.writeFileSync(LB_PATH, JSON.stringify(leaderboard));
