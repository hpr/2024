import { PAGES } from './const';

export type DLMeet =
  | 'doha'
  | 'birminghamIndoor'
  | 'ncaai23'
  | 'boston23'
  | 'doha23'
  | 'rabat23'
  | 'florence23'
  | 'paris23'
  | 'oslo23'
  | 'lausanne23'
  | 'stockholm23'
  | 'silesia23'
  | 'monaco23'
  | 'london23'
  | 'zurich23'
  | 'xiamen23'
  | 'brussels23'
  | 'eugene23'
  | 'eugene23'
  | 'xiamen24'
  | 'shanghai24'
  | 'doha24'
  | 'rabat24'
  | 'eugene24'
  | 'oslo24'
  | 'stockholm24'
  | 'paris24'
  | 'monaco24'
  | 'london24'
  | 'lausanne24'
  | 'silesia24'
  | 'rome24'
  | 'zurich24'
  | 'brussels24';

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
  hasAvy?: boolean;
  blurb?: string;
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
      deadline?: string;
      tiebreaker?: string;
      entrants: Entrant[];
      url?: string;
      targetTime?: string;
      blurb?: string;
      date: string;
      results?: ResultEntrant[];
      isClosed?: boolean;
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
  [k in AthleticsEvent]?: { team: string[]; scorers?: { [id: string]: number } };
};

export type LBEntry = {
  userid: number;
  tb?: string; // tiebreaker
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

export type MeetTeam = Exclude<Team[DLMeet], undefined>;

export type TeamToScore = {
  name: string;
  lbpicks: LBPicks;
};

export type StandingElement = {
  meet: DLMeet;
  url: string;
  date: string;
  leaders: {
    name: string;
    userid: number;
    cumPlace: number;
    place: number;
    delta: number;
  }[];
  cutoff?: {
    place: number;
    cumPlace: number;
    users: { id: number; name: string }[];
  };
};
export type Standings = StandingElement[];

export type SparqlResponse = {
  results: {
    bindings: {
      item: {
        type: 'uri';
        value: string;
      };
      enWikiSiteLink?: {
        type: 'uri';
        value: string;
      }
    }[];
  };
};
