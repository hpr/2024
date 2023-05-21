import { STANDINGS_PATH, getLbPath } from './const.mjs';
import { DLMeet, LBEntry, LBType, StandingElement, Standings } from './types.mjs';
import fs from 'fs';

const meets: { meet: DLMeet; date: string }[] = [{ meet: 'doha23', date: 'May 5, 2023' }];
const standings: Standings = [];
const TRACKBOT_USERID = 302;

for (const meetInfo of meets) {
  const { meet, date } = meetInfo;
  const idx = meets.indexOf(meetInfo);
  const leaderboard: LBType = JSON.parse(fs.readFileSync(getLbPath(meet), 'utf-8'));
  const cutoffEntry: LBEntry = leaderboard[meet]?.find((entry) => +entry.userid === TRACKBOT_USERID)!;
  const meetStanding: StandingElement = {
    meet,
    date,
    url: `https://hpr.github.io/${meet}/`,
    leaders: leaderboard[meet]!.filter((leader) => leader.score > cutoffEntry.score).map(({ userid, name, score }) => {
      const place = leaderboard[meet]?.findIndex((entry) => entry.score === score)! + 1;
      const prevPlace = standings[idx - 1]?.leaders?.find((leader) => leader.userid === userid)?.place ?? 0;
      return {
        userid,
        name,
        place,
        delta: place - prevPlace,
        cumPlace: standings[idx - 1]?.leaders?.find((leader) => leader.userid === userid)?.cumPlace ?? place,
      };
    }),
    cutoff: {
      place: leaderboard[meet]?.findIndex((leader) => leader.score === cutoffEntry.score)! + 1,
      users: leaderboard[meet]!.filter((leader) => leader.score <= cutoffEntry.score).map(({ userid, name }) => ({ id: userid, name })),
    },
  };
  standings.push(meetStanding);
}
fs.writeFileSync(STANDINGS_PATH, JSON.stringify(standings));
