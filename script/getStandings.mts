import { STANDINGS_PATH, getLbPath, standingsMeets } from './const.mjs';
import { LBEntry, LBType, StandingElement, Standings } from './types.mjs';
import fs from 'fs';

const meets = standingsMeets;
const standings: Standings = [];
const TRACKBOT_USERID = 302;

for (const meetInfo of meets) {
  const { meet, date } = meetInfo;
  const idx = meets.indexOf(meetInfo);
  let leaderboard: LBType = [] as LBType;
  try {
    leaderboard = JSON.parse(fs.readFileSync(getLbPath(meet), 'utf-8'));
  } catch {}
  const cutoffEntry: LBEntry | undefined = leaderboard[meet]?.find((entry) => +entry.userid === TRACKBOT_USERID);
  const meetStanding: StandingElement = {
    meet,
    date,
    url: cutoffEntry ? `https://hpr.github.io/${meet}/#/leaderboard` : '',
    leaders:
      leaderboard[meet]
        ?.filter((leader) => leader.score > (cutoffEntry?.score ?? 0))
        .map(({ userid, name, score }) => {
          const place = leaderboard[meet]?.findIndex((entry) => entry.score === score)! + 1;
          const prevPlace = standings[idx - 1]?.leaders?.find((leader) => leader.userid === userid)?.place ?? 0;
          return {
            userid,
            name,
            place,
            delta: place - prevPlace,
            cumPlace: standings[idx - 1]?.leaders?.find((leader) => leader.userid === userid)?.cumPlace ?? place,
          };
        }) ?? [],
  };
  if (cutoffEntry)
    meetStanding.cutoff = {
      place: leaderboard[meet]?.findIndex((leader) => leader.score === cutoffEntry.score)! + 1,
      users: leaderboard[meet]!.filter((leader) => +leader.userid !== TRACKBOT_USERID && leader.score <= cutoffEntry.score).map(({ userid, name }) => ({
        id: userid,
        name,
      })),
    };
  standings.push(meetStanding);
}
fs.writeFileSync(STANDINGS_PATH, JSON.stringify(standings));
