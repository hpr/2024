import fs from 'fs';
import { AthleticsEvent, DLMeet, Entries } from './types.mjs';
import { ENTRIES_PATH } from './const.mjs';

const entries: Entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
for (const meet in entries) {
  for (const evt in entries[meet as DLMeet]) {
    entries[meet as DLMeet]![evt as AthleticsEvent]!.isClosed = true;
  }
}
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
