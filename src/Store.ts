import { createContext } from 'react';
import { Entrant, Team, TeamToScore } from './types';

export const Store = createContext({
  myTeam: {} as Team,
  setMyTeam: (_: Team) => {},
  teamToScore: null as TeamToScore | null,
  setTeamToScore: (_: TeamToScore) => {},
  athletesById: {} as { [id: string]: Entrant },
  setAthletesById: (_: { [id: string]: Entrant }) => {},
});
