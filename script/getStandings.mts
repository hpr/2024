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
    url: cutoffEntry ? `/#/${meet}/leaderboard` : '',
    leaders:
      leaderboard[meet]
        ?.filter((leader) => leader.score > (cutoffEntry?.score ?? 0))
        .map(({ userid, name, score }) => {
          const place = leaderboard[meet]?.findIndex((entry) => entry.score === score)! + 1;
          const prevPlace = standings[idx - 1]?.leaders?.find((leader) => +leader.userid === +userid)?.place ?? 0;
          return {
            userid,
            name,
            place,
            delta: place - prevPlace,
            cumPlace: place,
          };
        }) ?? [],
  };
  if (cutoffEntry) {
    const prevCutoff = standings[idx - 1]?.cutoff;
    const place = leaderboard[meet]?.findIndex((leader) => leader.score === cutoffEntry.score)! + 1;
    meetStanding.cutoff = {
      place,
      cumPlace: (prevCutoff?.cumPlace ?? 0) + place,
      users: leaderboard[meet]!.filter((leader) => +leader.userid !== TRACKBOT_USERID && leader.score <= cutoffEntry.score).map(({ userid, name }) => ({
        id: userid,
        name,
      })),
    };
    for (const prevCutoffUser of prevCutoff?.users ?? []) {
      if (
        !meetStanding.cutoff.users.find((user) => +user.id === +prevCutoffUser.id) &&
        !meetStanding.leaders.find((user) => +user.userid === +prevCutoffUser.id)
      )
        meetStanding.cutoff.users.push(prevCutoffUser);
    }
    const prevLeaders = standings[idx - 1]?.leaders ?? [];
    for (const prevLeader of prevLeaders) {
      const matchingLeader = meetStanding.leaders.find((leader) => +leader.userid === +prevLeader.userid);
      if (matchingLeader) matchingLeader.cumPlace += prevLeader.cumPlace;
      else {
        const place = meetStanding.cutoff?.place ?? meetStanding.leaders.length;
        meetStanding.leaders.push({
          ...prevLeader,
          place,
          cumPlace: prevLeader.cumPlace + place,
        });
      }
    }
    for (const leader of meetStanding.leaders) {
      if (leader.cumPlace === leader.place) leader.cumPlace += prevCutoff?.cumPlace ?? 0;
    }
  }
  meetStanding.leaders.sort((a, b) => a.cumPlace - b.cumPlace);

  standings.push(meetStanding);
}
fs.writeFileSync(STANDINGS_PATH, JSON.stringify(standings));
