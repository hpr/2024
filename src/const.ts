import { AthleticsEvent } from './types';

export const scoring = [140, 120, 110, 100, 90, 80, 70, 60];

export const SERVER_URL = 'https://habs.sdf.org/fantasy1500-server/server.cgi';

export const PICKS_PER_EVT = 3;

export const GRAPHQL_ENDPOINT =
  'https://4usfq7rw2jf3bbrvf5jolayrxq.appsync-api.eu-west-1.amazonaws.com/graphql';
export const GRAPHQL_API_KEY = 'da2-erlx4oraybbjrlxorsdgmemgua';
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
