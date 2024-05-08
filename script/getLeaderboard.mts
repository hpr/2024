// ssh habs@ma.sdf.org "sqlite3 -header -csv ~/db/fantasy1500.db 'select * from picks where meet = \"shanghai24\";'" > picks.csv && ssh habs@ma.sdf.org 'sqlite3 -header -csv ~/db/fantasy1500.db "select * from users;"' > users.csv

// ssh habs@ma.sdf.org 'sqlite3 -header -csv ~/db/fantasy1500.db "select id,name,email from users where id > 598;"' > emails.csv

import { MeetCache, DLMeet, Entries, LBType, AthleticsEvent, ResultEntrant, MeetTeam, LBPicks } from './types.mjs';
import fs from 'fs';
import { backupNotes, CACHE_PATH, disciplineCodes, distanceEvents, ENTRIES_PATH, getLbPath, MEET, NUM_SCORING, SCORE, sprintEvents } from './const.mjs';
import { parse } from 'csv-parse/sync';

const cache: MeetCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
const leaderboard: LBType = {};

const rows: { picksJson: string; userid: number }[] = parse(fs.readFileSync('./picks.csv', 'utf-8'), {
  columns: true,
});
const users: { id: number; name: string }[] = parse(fs.readFileSync('./users.csv', 'utf-8'), {
  columns: true,
});

const getScore = (meet: DLMeet, team: MeetTeam, evt: AthleticsEvent): { score: number; scorers: { [id: string]: number } } => {
  let score = 0;
  const scorers: { [id: string]: number } = {};
  team[evt] = team[evt]?.filter((pick) => {
    const matchingResult = (entries[meet]![evt]!.results! ?? []).find((res) => res.entrant?.id === pick?.id);
    return !!matchingResult?.place;
  });

  for (const pick of team[evt] ?? []) {
    // console.log(entries, meet, evt, Object.keys(entries[meet]![evt]!));
    let matchingResult = (entries[meet]![evt]!.results! ?? []).find((res) => res.entrant?.id === pick?.id);
    const pickIdx = (team[evt] ?? []).indexOf(pick);
    const pickScore = matchingResult!?.place ? SCORE[pickIdx][matchingResult!?.place - 1] ?? 0 : -1;
    console.log(evt, pick.firstName, pick.lastName, matchingResult?.place, pickScore);
    scorers[matchingResult?.entrant!.id!] = pickScore;
    score += pickScore;
  }
  const lowestScorerId = Object.keys(scorers).sort((a, b) => scorers[a] - scorers[b])[0];
  if (Object.keys(scorers).length > NUM_SCORING) {
    score -= scorers[lowestScorerId];
    delete scorers[lowestScorerId];
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

for (const meet of [MEET] as DLMeet[]) {
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
      distanceScore += evtScore; // FIXME when we want to have King of the Distance again
      // if (distanceEvents.includes(evt)) distanceScore += evtScore;
      // if (sprintEvents.includes(evt)) sprintScore += evtScore;
      eventsScored++;
    }
    let score = distanceScore + sprintScore;
    if (name === 'Matty G' && meet === 'doha23') score += 0.5;

    leaderboard[meet]!.push({
      userid: +userid,
      name,
      picks: userPicks,
      distanceScore,
      sprintScore,
      eventsScored,
      score,
    });
    // console.log(leaderboard[meet]!.at(-1));
  }
  leaderboard[meet]?.sort((a, b) => b.score - a.score);
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
fs.writeFileSync(getLbPath(MEET), JSON.stringify(leaderboard));
