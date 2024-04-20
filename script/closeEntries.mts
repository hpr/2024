import fs from 'fs';
import { AthleticsEvent, DLMeet, Entries } from './types.mjs';
import { ENTRIES_PATH, MEET } from './const.mjs';

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
for (const evt in entries[MEET]) {
  entries[MEET]![evt as AthleticsEvent]!.isClosed = true;
}
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
