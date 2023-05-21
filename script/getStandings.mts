import { STANDINGS_PATH, getLbPath } from './const.mjs';
import { DLMeet, LBEntry, LBType, StandingElement, Standings } from './types.mjs';
import fs from 'fs';

const meets: { meet: DLMeet; date: string }[] = [
  { meet: 'doha23', date: 'May 5, 2023' },
  { meet: 'rabat23', date: 'May 28, 2023' },
  { meet: 'florence23', date: 'June 2, 2023' },
  { meet: 'paris23', date: 'June 9, 2023' },
  { meet: 'oslo23', date: 'June 15, 2023' },
  { meet: 'lausanne23', date: 'June 30, 2023' },
  { meet: 'stockholm23', date: 'July 2, 2023' },
  { meet: 'silesia23', date: 'July 16, 2023' },
  { meet: 'monaco23', date: 'July 21, 2023' },
  { meet: 'london23', date: 'July 23, 2023' },
  { meet: 'zurich23', date: 'August 31, 2023' },
  { meet: 'shenzhen23', date: 'September 2, 2023' },
  { meet: 'brussels23', date: 'September 8, 2023' },
  { meet: 'eugene23', date: 'September 16-17, 2023' },
];
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
    url: cutoffEntry ? `https://hpr.github.io/${meet}/#/scoring` : '',
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
      users: leaderboard[meet]!.filter((leader) => leader.score <= cutoffEntry.score).map(({ userid, name }) => ({ id: userid, name })),
    };
  standings.push(meetStanding);
}
fs.writeFileSync(STANDINGS_PATH, JSON.stringify(standings));
