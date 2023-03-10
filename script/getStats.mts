// sqlite3 -header -csv fantasy1500.db 'select * from picks;' > picks.csv
// scp habs@ma.sdf.org:~/db/picks.csv .

import { parse } from 'csv-parse/sync';
import fs from 'fs';

const rows: { picksJson: string }[] = parse(fs.readFileSync('./picks.csv', 'utf-8'), {
  columns: true,
  skip_empty_lines: true,
});
const res: { [evt: string]: { [ath: string]: number } } = {};

for (const { picksJson } of rows) {
  const picks = JSON.parse(picksJson);
  for (const evt in picks) {
    res[evt] ??= {};
    const { firstName, lastName }: { firstName: string; lastName: string } = picks[evt][0];
    const captain = `${firstName} ${lastName}`;
    res[evt][captain] ??= 0;
    res[evt][captain]++;
  }
}

// for (const evt in res) {
//   console.log(`${evt}:`);
//   const total = Object.values(res[evt]).reduce((acc, x) => acc + x, 0);
//   for (const [name, num] of Object.entries(res[evt]).sort((a, b) => b[1] - a[1])) {
//     console.log(`-- ${name}: ${Math.round(num / total * 100)}%`);
//   }
//   console.log('.');
// }

const evts: [string, number][] = [];
for (const evt in res) {
  const total = Object.values(res[evt]).reduce((acc, x) => acc + x, 0);
  const topPick = Object.entries(res[evt]).sort((a, b) => b[1] - a[1])[0];
  evts.push([evt, topPick[1]]);
}

evts
  .sort((a, b) => b[1] - a[1])
  .forEach(([evt, num]) => {
    console.log(`${evt}: ${Math.round((num / rows.length) * 100)}%`);
  });
