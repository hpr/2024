import { createContext } from 'react';
import { Team, TeamToScore } from './types';

export const Store = createContext({
  myTeam: {} as Team,
  setMyTeam: (_: Team) => {},
  teamToScore: null as TeamToScore | null,
  setTeamToScore: (_: TeamToScore) => {},
});
