export const scoring = [140, 120, 110, 100, 90, 80, 70, 60];

export const SERVER_URL = 'https://habs.sdf.org:8080/fantasy';

export const PICKS_PER_EVT: number = 3;
export const NUM_SCORING: number = 2;
export const scoreTable = [
  [20, 12, 8, 6, 5, 4],
  [10, 8, 6, 4, 3, 2],
  [6, 5, 4, 3, 2, 1],
];

export const GRAPHQL_ENDPOINT = 'https://tppcjbjqljd4tj7my77t466hn4.appsync-api.eu-west-1.amazonaws.com/graphql';
export const GRAPHQL_API_KEY = 'da2-fulcgci74bbslidixnmkcr6sxu';
export const GRAPHQL_QUERY = `
query GetCompetitorBasicInfo($id: Int, $urlSlug: String) {
  competitor: getSingleCompetitor(id: $id, urlSlug: $urlSlug) {
    basicData {
      firstName lastName birthDate iaafId aaId
    }
    personalBests {
      results {
        indoor discipline mark notLegal venue date resultScore
      }
    }
    resultsByYear {
      activeYears
      resultsByEvent {
        indoor discipline
        results { date venue place mark wind notLegal }
      }
    }
  }
}
`;

export const mantineGray = 'rgb(55, 58, 64)';

export const DIVIDER = 'divider' as 'divider';

export const PAGES = ['events', 'scoring', 'submissions', 'leaderboard', 'standings'] as ['events', 'scoring', 'submissions', 'leaderboard', 'standings'];

export const disciplineCodes: { [k: string]: string } = {
  '50 Meters': '50',
  '55 Meters': '55',
  '60 Meters': '60',
  '100 Meters': '100',
  '100m': '100',
  '100 Yards': '100y',
  '150 Meters': '150',
  '200 Meters': '200',
  '200m': '200',
  '300 Meters': '300',
  '400 Meters': '400',
  '400m': '400',
  '500 Meters': '500',
  '600 Meters': '600',
  '800 Meters': '800',
  '800m': '800',
  '1000 Meters': '1000',
  '1500 Meters': '1500',
  '1500m': '1500',
  'One Mile': 'MILE',
  '1 Mile': 'MILE',
  Mile: 'MILE',
  '2000 Meters': '2000',
  '3000 Meters': '3000',
  '3000m': '3000',
  'Two Miles': '2MLS',
  '5000 Meters': '5000',
  '5000m': '5000',
  '5 Kilometres': '5RR',
  '8 Kilometres': '8RR',
  '5 Miles Road': '5MR',
  '10,000 Meters': '10K',
  '10 Kilometres': '10RR',
  '12 Kilometres': '12RR',
  '15,000 Meters': '15K',
  '15 Kilometres': '15RR',
  'One Mile Road': '1MR',
  '10 Miles Road': '10MR',
  '20,000 Meters': '20K',
  '20 Kilometres': '20RR',
  'One Hour': 'HOUR',
  'Half Marathon': 'HMAR',
  '25,000 Meters': '25K',
  '25 Kilometres': '25RR',
  '30,000 Meters': '30K',
  '30 Kilometres': '30RR',
  Marathon: 'MAR',
  '50 Kilometres': '50RR',
  '100 Kilometres': '100K',
  '24 Hours': '24H',
  '2000 Metres Steeplechase': '2KSC',
  '2000 Metres Steeplechase (84)': '2KSC84',
  '3000 Metres Steeplechase': '3KSC',
  '3000m Steeplechase': '3KSC',
  '3000m SC': '3KSC',
  '50 Metres Hurdles': '50H',
  '55 Metres Hurdles': '55H',
  '60 Metres Hurdles': '60H',
  '60 Hurdles': '60H',
  '60m Hurdles (91.4cm)': '60HY',
  '60m Hurdles (99.0cm)': '60HJ',
  '60m Hurdles (76.2cm)': '60HYG',
  '80 Metres Hurdles': '80H',
  '100 Metres Hurdles': '100H',
  '100m Hurdles': '100H',
  '110m Hurdles (99.0cm)': '110HJ',
  '100m Hurdles (76.2cm)': '100HY',
  '110 Metres Hurdles': '110H',
  '110m Hurdles': '110H',
  '110m Hurdles (91.4cm)': '110HY',
  '200 Metres Hurdles': '200H',
  '300m Hurdles (84.0cm)': '300HY',
  '300 Metres Hurdles': '300H',
  '400m hurdles (84.0cm)': '400HY',
  '400 Metres Hurdles': '400H',
  '400m Hurdles': '400H',
  'High Jump': 'HJ',
  'Pole Vault': 'PV',
  'Long Jump': 'LJ',
  'Triple Jump': 'TJ',
  'Shot Put': 'SP',
  'Shot Put (6kg)': 'SPJ',
  'Shot Put (5kg)': 'SPY',
  'Shot Put (3kg)': 'SPYG',
  'Shot Put (4kg)': 'SPYG4',
  'Discus Throw': 'DT',
  'Discus Throw (1.750kg)': 'DTJ',
  'Discus Throw (1.500kg)': 'DTY',
  'Hammer Throw': 'HT',
  'Hammer Throw (6kg)': 'HTJ',
  'Hammer Throw (5kg)': 'HTY',
  'Hammer Throw (3kg)': 'HTYG',
  'Javelin Throw': 'JT',
  'Javelin Throw (old)': 'JTo',
  'Javelin Throw (700g)': 'JTY',
  'Javelin Throw (500g)': 'JTYG',
  Pentathlon: 'PEN',
  'Pentathlon Girls': 'PENG',
  Heptathlon: 'HEP',
  'Heptathlon U20': 'HEPJ',
  'Heptathlon-100mH 76.2cm': 'HEPY',
  'Heptathlon Girls': 'HEPG',
  'Heptathlon Boys': 'HEPB',
  'Octathlon Boys': 'OCTY',
  Decathlon: 'DEC',
  'Decathlon (62-84)': 'DEC6284',
  'Decathlon U20': 'DECJ',
  'Decathlon Boys': 'DECY',
  'One Mile Race Walk': 'MILEW',
  '3000 Metres Race Walk': '3KW',
  '5000 Metres Race Walk': '5KW',
  '5 Kilometres Race Walk': '5KR',
  '10,000 Metres Race Walk': '10KW',
  '10 Kilometres Race Walk': '10KR',
  '15 Kilometers Race Walk': '15KR',
  '20,000 Metres Race Walk': '20KW',
  '20 Kilometres Race Walk': '20KR',
  '2 Hours Race Walk': '2HW',
  '30,000 Metres Race Walk': '30KW',
  '30 Kilometres Race Walk': '30KR',
  '35 Kilometres Race Walk': '35KR',
  '50,000 Metres Race Walk': '50KW',
  '35,000 Metres Race Walk': '35KW',
  '50 Kilometres Race Walk': '50KR',
  '4x100 Metres Relay': '4X1',
  '4x200 Metres Relay': '4X2',
  '4x400 Metres Relay': '4X4',
  '4x400 Metres Relay Mixed': '4X4',
  'Mixed 2x2x400m Relay': '2X2X4',
  'Shuttle Hurdles Relay': 'SHUTHUR',
  'Mixed Shuttle Hurdles Relay': 'MIXSHH',
  '4x800 Metres Relay': '4X8',
  '4x1500 Metres Relay': '4X15',
  'Medley Relay': 'MEAD',
  '8x100 Metres Relay': '8X1',
  'Road Relay': 'EKID',
  'Distance Medley Relay': 'DISMEAD',
  'Mixed Relay': 'MIXREL',
  'One Hour Walk': '1HW',
  'Senior Race': 'XSE',
  'Cross Country': 'XC',
  'U20 Race': 'XJ',
  'U23 Race': 'XU23',
  'Short Race': 'XCS',
  'Long Race': 'XS',
  '20libs Weight': 'W20',
  '35libs Weight': 'W35',
  'Cross Country 4000m': 'XC4KM',
  '100m Blind': '100B',
  '200m Blind': '200B',
  '400m Blind': '400B',
  '100m Wheelchair': '100W',
  '200m Wheelchair': '200W',
  '1500m Wheelchair': '1500W',
  '800m Wheelchair': '800W',
  'Javelin Throw Wheelchair': 'JTW',
  '200m Amputee': '200A',
  '100m Amputee': '100A',
  '400m Cereb. Palsy': '400CP',
  '200m Visually Impaired': '200VI',
  '400 Metres T53': '400T53',
  '800 Metres T54': '800T54',
  '400m Masters': '400MA',
  '800m Masters': '800MA',
};

export const codeToDiscipline = Object.entries(disciplineCodes).reduce((acc, [key, val]) => {
  acc[val] = key;
  return acc;
}, {} as { [k: string]: string });
