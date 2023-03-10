import { List, Paper, Avatar } from '@mantine/core';
import { useEffect, useState } from 'react';
import { DLMeet, Entries, LBEntry, LBType } from './types';
import Filter from 'badwords-filter';
import { mantineGray } from './const';

const filter = new Filter();

export const Leaderboard = ({ meet, entries }: { meet: DLMeet; entries: Entries }) => {
  const [leaderboard, setLeaderboard] = useState<LBType>({});
  useEffect(() => {
    (async () => {
      const lb = await (await fetch('leaderboard.json')).json();
      setLeaderboard(lb);
    })();
  }, []);
  const overall = [...leaderboard[meet]!].sort((a, b) => b.score - a.score);
  return (
    <Paper withBorder>
      <List>
        {overall.map(({ name, userid, score, eventsScored }: LBEntry) => (
          <List.Item
            key={userid}
            icon={
              <Avatar size="sm" radius="xl" style={{ border: `1px solid ${mantineGray}` }}>
                {name
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? '')
                  .join('')}
              </Avatar>
            }
          >
            {filter.clean(name)}: {score}pts ({eventsScored} events scored)
          </List.Item>
        ))}
      </List>
    </Paper>
  );
};
