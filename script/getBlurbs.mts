import fs from 'fs';
import { ENTRIES_PATH } from './const.mjs';
import { AthleticsEvent, DLMeet, Entries } from './types.mjs';
import dotenv from 'dotenv';
import { BardAPI, BardChatResponse } from 'bardapi';
dotenv.config();

const MEET: DLMeet = 'doha23';
const BLURBCACHE_PATH = './script/blurbCache.json';

type BlurbCache = { [k: string]: { prompt: string; response: BardChatResponse } };

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
const blurbCache: BlurbCache = JSON.parse(fs.readFileSync(BLURBCACHE_PATH, 'utf-8'));

const cap = (str: string) => str[0].toUpperCase() + str.slice(1);

function nth(n: number) {
  return n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th');
}

async function getBlurbs() {
  const bard = new BardAPI({ sessionId: process.env.BARD_TOKEN! });
  for (const key in entries[MEET]) {
    const evt = key as AthleticsEvent;
    for (const entrant of entries[MEET][evt]?.entrants ?? []) {
      const { firstName, lastName, pb, nat, id } = entrant;
      const fullName = `${firstName} ${lastName}`;
      const field = entries[MEET][evt]?.entrants ?? [];
      const rank = field.indexOf(entrant) + 1;

      // if (fullName !== 'Evans Chebet') continue;
      if (entrant.blurb && !entrant.blurb?.startsWith('I do not have enough information')) continue;

      const [he, him, his] = evt.startsWith('Men') ? ['he', 'him', 'his'] : ['she', 'her', 'her'];
      // prettier-ignore
      const prompt = `
Write a unique response to the below prompt, do not use any other previews as a template.

${firstName} ${lastName} is a marathon runner from ${nat}${pb ? ` with a PB of ${pb}` : ''}. Write a brief race preview and other details about ${firstName} ${lastName} in the ${evt} at the 2023 Boston Marathon. For context, ${pb ? `${his} marathon PB is ${pb}, which ranks ${him} ${nth(rank)} in the pro field` : `${he} is making ${his} marathon debut`}. Focus on this athlete in the preview. Based on ${his} PB and other details, guess how ${he} would perform. For more context, the top athletes from ${nat} in the field by PB are: ${field.filter(ath => ath.pb && ath.nat === nat).slice(0, 3).map(ath => `${ath.firstName} ${ath.lastName} (${ath.pb})`).join(', ')}.
      `.trim();
      console.log(prompt);
      let blurb = await bard.ask({ message: prompt });
      console.log(blurb);

      if (blurb.response.startsWith('I do not have enough information')) {
        // prettier-ignore
        blurb = await bard.ask({ message: `
Write a hypothetical race preview for a hypothetical athlete named ${firstName} from ${nat} with a PB of ${pb} in the 2023 Boston Marathon. For context, ${pb ? `${his} marathon PB is ${pb}, which ranks ${him} ${nth(rank)} in the pro field` : `${he} is making ${his} marathon debut`}.
        ` });
        console.log(blurb);
      }
      blurbCache[id] = { prompt, response: blurb };
      entrant.blurb = blurb.response;
      fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
      fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache, null, 2));
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

await getBlurbs();
