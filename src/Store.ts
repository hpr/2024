import { createContext } from 'react';
import { Team } from './types';

export const Store = createContext({
  myTeam: {} as Team,
  setMyTeam: (_: Team) => {},
});
