import fs from 'fs';
import { ENTRIES_PATH, GRAPHQL_API_KEY, GRAPHQL_ENDPOINT, GRAPHQL_QUERY } from './const.mjs';
import { AthleticsEvent, DLMeet, Entries, Competitor, ResultsByYearResult } from './types.mjs';
import dotenv from 'dotenv';
import { ChatGPTAPI, ChatMessage } from 'chatgpt';
dotenv.config();

const MEET: DLMeet = 'doha23';
const BLURBCACHE_PATH = './script/blurbCache.json';

type BlurbCache = { [k in DLMeet]: { blurbs: { [k in AthleticsEvent]?: string }; athletes: { [k: string]: Competitor } } };

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
const blurbCache: BlurbCache = JSON.parse(fs.readFileSync(BLURBCACHE_PATH, 'utf-8'));

const cap = (str: string) => str[0].toUpperCase() + str.slice(1);

function nth(n: number) {
  return n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th');
}

function getAge(birthday: Date) {
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

async function getBlurbs() {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY!,
    completionParams: {
      model: 'gpt-4',
    },
  });

  blurbCache[MEET] ??= { blurbs: {}, athletes: {} };
  for (const key in entries[MEET]) {
    const evt = key as AthleticsEvent;
    const gender = evt.toLowerCase().includes('women') ? 'Women' : 'Men';
    const ungenderedEvt = evt
      .split(' ')
      .filter((w) => !w.toLowerCase().includes('men'))
      .join(' ');
    let prompt = `Write a race preview for the ${gender}'s ${ungenderedEvt} at the 2023 Doha Diamond League track meet, which will happen on May 5th, 2023. Here are the competitors:\n\n`;
    for (const entrant of entries[MEET][evt]?.entrants ?? []) {
      const { firstName, lastName, pb, sb, nat, id } = entrant;
      const fullName = `${firstName} ${lastName}`;
      console.log(fullName, id);
      const field = entries[MEET][evt]?.entrants ?? [];
      const rank = field.indexOf(entrant) + 1;

      const competitor = (blurbCache[MEET].athletes[id] ??= (
        await (
          await fetch(GRAPHQL_ENDPOINT, {
            headers: { 'x-api-key': GRAPHQL_API_KEY },
            body: JSON.stringify({
              operationName: 'GetCompetitorBasicInfo',
              query: GRAPHQL_QUERY,
              variables: { id },
            }),
            method: 'POST',
          })
        ).json()
      ).data.competitor);

      prompt += `${rank}. ${fullName} (${nat}), ${getAge(new Date(competitor.basicData.birthDate))} years old\n`;
      prompt += `Personal Best: ${pb}, Season's Best: ${sb || 'N/A'}\n`;

      prompt += `${competitor?.resultsByYear?.activeYears[0]} results for ${fullName}:\n`;
      prompt +=
        competitor.resultsByYear.resultsByEvent
          .reduce((acc, { indoor, discipline, results }) => {
            acc.push(...results.map((r) => ({ ...r, discipline, indoor })));
            return acc;
          }, [] as ResultsByYearResult[])
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(
            ({ discipline, indoor, date, venue, place, mark, wind, notLegal }) =>
              `${date.split(' ').slice(0, -1).join(' ')}: ${Number.parseInt(place) ? `${nth(+place)} place, ` : ''}${mark}${notLegal ? '*' : ''}${
                wind ? ` (${wind})` : ''
              } in ${discipline}${indoor ? ` (indoor)` : ''} @ ${venue}`
          )
          .join('\n') + '\n\n';
    }
    prompt += `Please predict the final places and times of the athletes and explain why you think they will finish in that order. List the athletes in order of finish. In your reasoning, compare athletes with each other and don't be afraid to make harsh judgements based on the data.`;

    fs.writeFileSync('prompt.txt', prompt);
    console.log(prompt);
    blurbCache[MEET].blurbs[evt] ??= '';
    if (!blurbCache[MEET].blurbs[evt]) process.exit();
    // blurbCache[MEET].blurbs[evt] = response;
    fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache, null, 2));
    // fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
    // await new Promise((res) => setTimeout(res, 1000));
  }
}

await getBlurbs();
