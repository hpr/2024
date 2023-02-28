import { AthleticsEvent } from './types.mjs';

export const runningEvents: AthleticsEvent[][] = [
  ["Women's 60 m"],
  ["Men's 60 m", "Men's 60 Meters"],
  ["Men's 60 m Hurdles", "Men's 60 Hurdles"],
  ['100m Women'],
  ['100m Men'],
  ['100m H Women'],
  ['110m H Men'],
  ['200m Women'],
  ['200m Men', "Men's 200 Meters"],
  ['400m Women'],
  ['400m Men', "Men's 400 m", "Men's 400 Meters"],
  ['400m H Women'],
  ['400m H Men'],
  ['800m Women', "Women's 800 m"],
  ['800m Men', "Men's 800 Meters"],
  ["Women's 1000 m"],
  ['1500m Women'],
  ['1500m Men', "Men's 1500 m"],
  ["Men's Mile"],
  ['3000m Women', "Women's 3000 m"],
  ['3000m Men', "Men's 3000 Meters"],
  ['3000m SC Women'],
  ['3000m SC Men'],
  ['5000m Women'],
  ['5000m Men', "Men's 5000 Meters"],
];

export const CACHE_PATH = './script/cache.json';
export const ENTRIES_PATH = './public/entries.json';
