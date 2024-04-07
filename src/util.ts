import { codeToDiscipline } from './const';
import { SparqlResponse } from './types';

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
}

export const codeToEvt = (evt: string) => {
  return (evt[0] === 'M' ? "Men's " : "Women's ") + codeToDiscipline[evt.slice(1)];
};

export const evtSort = (a: string, b: string) => {
  const DIGITS = '0123456789';
  const normalize = (s: string) => s.replace('Mile', '1609').replace('MILE', '1609');
  const firstNumericWord = (s: string) => s.split(' ').find((w) => DIGITS.includes(w[0])) ?? s.slice(1);
  const gender = (s: string) => s.match(/(Men|Women)/)?.[0] ?? s[0];
  a = normalize(a);
  b = normalize(b);
  if (gender(a) !== gender(b)) return a.localeCompare(b);
  return Number.parseInt(firstNumericWord(a)) - Number.parseInt(firstNumericWord(b));
};

export const getSitelink = async (id: string): Promise<SparqlResponse> => {
  const query = `SELECT ?item ?itemLabel ?enWikiSiteLink WHERE {
    ?item wdt:P1146 "${id}".
    OPTIONAL { ?enWikiSiteLink schema:about ?item;
               schema:isPartOf <https://en.wikipedia.org/>. }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
  }`;
  return await (
    await fetch('https://query.wikidata.org/sparql?' + new URLSearchParams({ query }), { headers: { accept: 'application/sparql-results+json' } })
  ).json();
};

export const normalize = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
