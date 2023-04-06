import fs from 'fs';
import { ENTRIES_PATH } from './const.mjs';
import { AthleticsEvent, DLMeet, Entries } from './types.mjs';
import dotenv from 'dotenv';
import { BardAPI } from "bardapi";
dotenv.config();

const MEET: DLMeet = 'boston23';

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));

const cap = (str: string) => str[0].toUpperCase() + str.slice(1);

function nth(n: number) {
  return n + ['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th';
}

async function getBlurbs() {
  const bard = new BardAPI({ sessionId: process.env.BARD_TOKEN! })
  for (const key in entries[MEET]) {
    const evt = key as AthleticsEvent;
    for (const entrant of entries[MEET][evt]?.entrants ?? []) {
      const { firstName, lastName, pb, nat } = entrant;
      const rank = entries[MEET][evt]?.entrants.indexOf(entrant)! + 1;
      
      const [he, him, his] = evt.startsWith('Men') ? ['he', 'him', 'his'] : ['she', 'her', 'her'];
      // prettier-ignore
      const prompt = `
Please write a race preview for ${firstName} ${lastName} in the ${evt} at the 2023 Boston Marathon. For context, ${he} is from ${nat} and ${pb ? `${his} marathon PB is ${pb}, which ranks ${him} ${nth(rank)} in the pro field` : `${he} is making ${his} marathon debut`}.
      `.trim();
      console.log(prompt);
      const blurb = await bard.ask({ message: prompt });
      console.log(blurb);
      entrant.blurb = blurb.response;
    }
    break;
  }

  fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
}

await getBlurbs();
