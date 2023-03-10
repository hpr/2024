import { PAGES } from './const';

export type DLMeet = 'doha' | 'birminghamIndoor' | 'ncaai23';

export type AuthPage = 'register' | 'addPicks';

export type AthleticsEvent =
  | '100m Women'
  | '100m Men'
  | '100m H Women'
  | '110m H Men'
  | '200m Women'
  | '200m Men'
  | '400m Women'
  | '400m Men'
  | '400m H Women'
  | '400m H Men'
  | '800m Women'
  | '800m Men'
  | '1500m Women'
  | '1500m Men'
  | '3000m Women'
  | '3000m Men'
  | '3000m SC Women'
  | '3000m SC Men'
  | '5000m Women'
  | '5000m Men';

export type Entrant = {
  firstName: string;
  lastName: string;
  id: string;
  pb: string | null;
  sb: string | null;
  nat: string;
  team?: string;
};

export type ResultEntrant = {
  mark: string;
  place: number;
  notes: string;
  entrant: Entrant;
};

export type Entries = {
  [k in DLMeet]?: {
    [k in AthleticsEvent]?: {
      entrants: Entrant[];
      date: string;
      results?: ResultEntrant[];
    };
  };
};

export type Team = {
  [k in DLMeet]?: {
    [k in AthleticsEvent]?: Entrant[];
  };
};

export type ResultsByYearResult = {
  date: string;
  venue: string;
  place: string;
  mark: string;
  wind: string;
  notLegal: boolean;
};

export type Competitor = {
  basicData: {
    firstName: string;
    lastName: string;
    birthDate: string;
    iaafId: string;
    aaId: string;
  };
  personalBests: {
    results: {
      indoor: boolean;
      discipline: string;
      mark: string;
      notLegal: boolean;
      venue: string;
      date: string;
      resultScore: number;
    }[];
  };
  resultsByYear: {
    activeYears: string[];
    resultsByEvent: {
      indoor: boolean;
      discipline: string;
      results: ResultsByYearResult[];
    }[];
  };
};

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type Page = ArrayElement<typeof PAGES>;

export type LBPicks = {
  [k in AthleticsEvent]?: string[];
};

export type LBEntry = {
  userid: number;
  name: string;
  picks: LBPicks;
  score: number;
  distanceScore: number;
  sprintScore: number;
  eventsScored: number;
};

export type LBType = {
  [k in DLMeet]?: LBEntry[];
};
