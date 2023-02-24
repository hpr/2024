import fs from 'fs';
import { Entrant, Entries } from './types.mjs';

const PIXELME_API = 'https://pixel-me-api-gateway-cj34o73d6a-an.a.run.app/api/v1';
const key = 'AIzaSyB1icoMXVbxjiAzwBTI_4FufkzTnX78U0s';

const entries: Entries = JSON.parse(fs.readFileSync('./public/entries.json', 'utf-8'));
const entrants: Entrant[] = Object.values(entries).flatMap((meet) =>
  Object.values(meet).flatMap(({ entrants }) => entrants)
);

let i = 0;
for (const { id, firstName, lastName } of entrants) {
  console.log(id, firstName, lastName, i++, entrants.length);
  const file128 = `./public/img/avatars/${id}_128x128.png`;
  if (fs.existsSync(file128)) continue;
  const avatarResp = await fetch(`https://media.aws.iaaf.org/athletes/${id}.jpg`);
  if (avatarResp.status === 403) {
    fs.symlinkSync('./default_128x128.png', file128);
    continue;
  }
  const b64 = Buffer.from(await avatarResp.arrayBuffer()).toString('base64');
  const { data: detectData } = await (
    await fetch(`${PIXELME_API}/detect?${new URLSearchParams({ key })}`, {
      headers: { 'content-type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({
        image: b64, // Buffer.from(fs.readFileSync('./script/kerley.jpg')).toString('base64'),
      }),
      method: 'POST',
    })
  ).json();
  const { image } = detectData;
  const { data: faceData } = await (
    await fetch(`${PIXELME_API}/convert/face?${new URLSearchParams({ key })}`, {
      headers: { 'content-type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ image }),
      method: 'POST',
    })
  ).json();
  const { images }: { images: { label: string; image: string }[] } = faceData;
  for (const { label, image } of images) {
    fs.writeFileSync(`./public/img/avatars/${id}_${label}.png`, Buffer.from(image, 'base64'));
  }
}
