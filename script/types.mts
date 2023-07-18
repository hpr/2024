import { CreateChatCompletionResponse } from 'openai';

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
  | 'shenzhen23'
  | 'brussels23'
  | 'eugene23';

export type AthleticsEvent =
  | '100m Women'
  | '100m Men'
  | '100m H Women'
  | '100m Hurdles Women'
  | '110m H Men'
  | '110m Hurdles Men'
  | '200m Women'
  | '200m Men'
  | '400m Women'
  | '400m Men'
  | '400m H Women'
  | '400m H Men'
  | '400m Hurdles Men'
  | '400m Hurdles Women'
  | '800m Women'
  | '800m Men'
  | '1500m Women'
  | '1500m Men'
  | '3000m Women'
  | '3000m Men'
  | '3000m SC Women'
  | '3000m SC Men'
  | '3000m Steeplechase Men'
  | '3000m Steeplechase Women'
  | '3000m Steeple Women'
  | '3000m Steeple Men'
  | '5000m Women'
  | '5000m Men'
  | "Women's 60 m"
  | "Men's 60 m"
  | "Men's 60 m Hurdles"
  | "Men's 400 m"
  | "Women's 800 m"
  | "Women's 1000 m"
  | "Men's 1500 m"
  | "Women's 3000 m"
  | "Men's 60 Meters"
  | "Men's 60 Hurdles"
  | "Men's 200 Meters"
  | "Men's 400 Meters"
  | "Men's 800 Meters"
  | "Men's Mile"
  | "Men's 1 Mile"
  | "Women's 1 Mile"
  | "Men's 3000 Meters"
  | "Men's 5000 Meters"
  | "Women's 60 Meters"
  | "Women's 60 Hurdles"
  | "Women's 200 Meters"
  | "Women's 400 Meters"
  | "Women's 800 Meters"
  | "Women's Mile"
  | "Women's 3000 Meters"
  | "Women's 5000 Meters"
  | "Men's Marathon"
  | "Women's Marathon";

export type WAEventCode =
  | '50'
  | '55'
  | '60'
  | '100'
  | '100y'
  | '150'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '800'
  | '1000'
  | '1500'
  | 'MILE'
  | '2000'
  | '3000'
  | '2MLS'
  | '5000'
  | '5RR'
  | '8RR'
  | '5MR'
  | '10K'
  | '10RR'
  | '12RR'
  | '15K'
  | '15RR'
  | '1MR'
  | '10MR'
  | '20K'
  | '20RR'
  | 'HOUR'
  | 'HMAR'
  | '25K'
  | '25RR'
  | '30K'
  | '30RR'
  | 'MAR'
  | '50RR'
  | '100K'
  | '24H'
  | '2KSC'
  | '2KSC84'
  | '3KSC'
  | '50H'
  | '55H'
  | '60H'
  | '60HY'
  | '60HJ'
  | '60HYG'
  | '80H'
  | '100H'
  | '110HJ'
  | '100HY'
  | '110H'
  | '110HY'
  | '200H'
  | '300HY'
  | '300H'
  | '400HY'
  | '400H'
  | 'HJ'
  | 'PV'
  | 'LJ'
  | 'TJ'
  | 'SP'
  | 'SPJ'
  | 'SPY'
  | 'SPYG'
  | 'SPYG4'
  | 'DT'
  | 'DTJ'
  | 'DTY'
  | 'HT'
  | 'HTJ'
  | 'HTY'
  | 'HTYG'
  | 'JT'
  | 'JTo'
  | 'JTY'
  | 'JTYG'
  | 'PEN'
  | 'PENG'
  | 'HEP'
  | 'HEPJ'
  | 'HEPY'
  | 'HEPG'
  | 'HEPB'
  | 'OCTY'
  | 'DEC'
  | 'DEC6284'
  | 'DECJ'
  | 'DECY'
  | 'MILEW'
  | '3KW'
  | '5KW'
  | '5KR'
  | '10KW'
  | '10KR'
  | '15KR'
  | '20KW'
  | '20KR'
  | '2HW'
  | '30KW'
  | '30KR'
  | '35KR'
  | '50KW'
  | '35KW'
  | '50KR'
  | '4X1'
  | '4X2'
  | '4X4'
  | '4X4'
  | '2X2X4'
  | 'SHUTHUR'
  | 'MIXSHH'
  | '4X8'
  | '4X15'
  | 'MEAD'
  | '8X1'
  | 'EKID'
  | 'DISMEAD'
  | 'MIXREL'
  | '1HW'
  | 'XSE'
  | 'XC'
  | 'XJ'
  | 'XU23'
  | 'XCS'
  | 'XS'
  | 'W20'
  | 'W35'
  | 'XC4KM'
  | '100B'
  | '200B'
  | '400B'
  | '100W'
  | '200W'
  | '1500W'
  | '800W'
  | 'JTW'
  | '200A'
  | '100A'
  | '400CP'
  | '200VI'
  | '400T53'
  | '800T54'
  | '400MA'
  | '800MA';

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
      entrants: Entrant[];
      targetTime?: string;
      date: string;
      results?: ResultEntrant[];
      isClosed?: boolean;
      blurb?: string;
    };
  };
};

export type MeetCache = {
  [k in DLMeet]: {
    schedule: { m?: string; f?: string; combined?: string };
    resultsSchedule?: string;
    events: {
      [k in AthleticsEvent]?: {
        startlist?: string;
        results?: string;
      };
    };
    ids: { [name: string]: { country: string; id: string } | undefined };
  };
};

export type LBPicks = {
  [k in AthleticsEvent]?: { team: string[]; scorers?: { [id: string]: number } };
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

export type Team = {
  [k in DLMeet]?: {
    [k in AthleticsEvent]?: Entrant[];
  };
};

export type MeetTeam = Exclude<Team[DLMeet], undefined>;

export type ResultsByYearResult = {
  discipline?: string;
  indoor?: boolean;

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

export type BlurbCache = { [k in DLMeet]: { blurbs: { [k in AthleticsEvent]?: CreateChatCompletionResponse }; athletes: { [k: string]: Competitor } } };

export type SportResultSchedule = {
  content: {
    full: {
      ListEvent: {
        [id: string]: {
          Code: string;
          Name: string;
        };
      };
      Units: {
        [id: string]: {
          EventName: string;
          Rsc: {
            ValueUnit: string;
          };
          Stats: {
            DiamondId?: string;
            DiamondType?: string;
            CompetitionName?: string; // for non-DL events
          };
        };
      };
    };
  };
};

export type SportResultTiming = {
  content: {
    full: {
      CompetitorDetails: {
        [id: string]: {
          Result?: string;
          Rank?: string;
          IRM?: 'Participant-DNF-ATH' | 'Participant-DNS-ATH';
          FirstName: string;
          Name: string; // last name uppercase
          AthleteId: string; // ?
          FedCode?: string; // iaaf id
        };
      };
    };
  };
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
