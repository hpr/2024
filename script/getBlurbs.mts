import fs from 'fs';
import { BLURBCACHE_PATH, ENTRIES_PATH, GRAPHQL_API_KEY, GRAPHQL_ENDPOINT, GRAPHQL_QUERY, MEET, standingsMeets } from './const.mjs';
import { AthleticsEvent, DLMeet, Entries, Competitor, ResultsByYearResult, BlurbCache } from './types.mjs';
import dotenv from 'dotenv';
import { ChatGPTAPI, ChatMessage } from 'chatgpt';
dotenv.config();

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
  // const api = new ChatGPTAPI({
  //   apiKey: process.env.OPENAI_API_KEY!,
  //   completionParams: {
  //     model: 'gpt-4',
  //   },
  // });

  blurbCache[MEET] ??= { blurbs: {}, athletes: {} };
  const meetName = MEET[0].toUpperCase() + MEET.slice(1, -2);
  for (const key in entries[MEET]) {
    const evt = key as AthleticsEvent;
    const gender = evt.toLowerCase().includes('women') ? 'Women' : 'Men';
    const targetTime = entries[MEET][evt]?.targetTime;
    const ungenderedEvt = evt
      .split(' ')
      .filter((w) => !w.toLowerCase().includes('men'))
      .join(' ');
    let prompt = `Write a race prediction and preview for the ${gender}'s ${ungenderedEvt} at the 2023 ${meetName} Diamond League track meet, which will happen on ${
      standingsMeets.find((sm) => sm.meet === MEET)?.date
    }. ${evt.includes('5000') ? 'Note that in long races like the 5000, athletes are typically spread far apart and most do not run close to their personal bests every time. ' : ''}${targetTime ? `Note that this race will be a World Record attempt with pacers, the goal time is ${targetTime}, but only the top athletes will be following the pacers. Only one or two athletes will be close to the target, the rest will be very far behind. ` : ''}Start your response with a listing of the predicted finish and times of the athletes. Here are the competitors:\n\n`;
    for (const entrant of entries[MEET][evt]?.entrants ?? []) {
      const { firstName, lastName, pb, sb, nat, id } = entrant;
      const fullName = `${firstName} ${lastName}`;
      console.log(fullName, id);
      const field = entries[MEET][evt]?.entrants ?? [];
      const rank = field.indexOf(entrant) + 1;

      // if (['400m Hurdles Women', '400m Men'].includes(evt)) {
      //   delete blurbCache[MEET].blurbs[evt];
      //   delete blurbCache[MEET].athletes[id];
      // }

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
    prompt += `Please predict the final places and times of the athletes. List the athletes in order of finish with their times. Then, explain why you think they will finish in that order. In your reasoning, compare athletes with each other and don't be afraid to make harsh judgements based on the data. Make reference to specific result times for the athletes in your reasoning, not just their personal bests and season's bests.`;

    fs.writeFileSync('prompt.txt', prompt);
    console.log(prompt);
    blurbCache[MEET].blurbs[evt] ??= '';
    // blurbCache[MEET].blurbs[evt] = response;
    entries[MEET][evt]!.blurb = blurbCache[MEET].blurbs[evt];
    fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache));
    fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries));
    // await new Promise((res) => setTimeout(res, 1000));
    if (!blurbCache[MEET].blurbs[evt]) {
      console.log('Enter response:');
      blurbCache[MEET].blurbs[evt] = fs.readFileSync(0).toString();
      fs.writeFileSync(BLURBCACHE_PATH, JSON.stringify(blurbCache));
    }
  }
}

await getBlurbs();
