import { AthleticsEvent } from './types.mjs';

export const runningEvents: AthleticsEvent[][] = [
  ["Women's 60 m"],
  ["Men's 60 m"],
  ["Men's 60 m Hurdles"],
  ['100m Women'],
  ['100m Men'],
  ['100m H Women'],
  ['110m H Men'],
  ['200m Women'],
  ['200m Men'],
  ['400m Women'],
  ['400m Men', "Men's 400 m"],
  ['400m H Women'],
  ['400m H Men'],
  ['800m Women', "Women's 800 m"],
  ['800m Men'],
  ["Women's 1000 m"],
  ['1500m Women'],
  ['1500m Men', "Men's 1500 m"],
  ['3000m Women', "Women's 3000 m"],
  ['3000m Men'],
  ['3000m SC Women'],
  ['3000m SC Men'],
  ['5000m Women'],
  ['5000m Men'],
];

export const CACHE_PATH = './script/cache.json';
export const ENTRIES_PATH = './public/entries.json';
