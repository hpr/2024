import { Timeline, Text, Paper, Title } from '@mantine/core';
import { Link, Diamond } from 'tabler-icons-react';
import { Standings } from './types';
import { useEffect, useState } from 'react';
import { modals } from '@mantine/modals';

const LeagueStandings = () => {
  const [standings, setStandings] = useState<Standings>([]);

  useEffect(() => {
    (async () => {
      setStandings(await (await fetch('standings.json')).json());
    })();
  }, []);

  return (
    <Paper withBorder p="lg">
      <Paper withBorder p="lg" mb="lg" style={{ textAlign: 'center' }}>
        <Title order={2}>League Standings</Title>
      </Paper>
      <Timeline active={standings.findLastIndex((standing) => standing.cutoff)} bulletSize={24} lineWidth={2}>
        {standings.map(({ meet, date, url, leaders, cutoff }) => (
          <Timeline.Item
            key={meet}
            bullet={<Diamond size={12} />}
            title={
              <Text>
                {meet[0].toUpperCase() + meet.slice(1, -2)}{' '}
                {url && (
                  <a href={url} target="_blank">
                    <Link size={15} />
                  </a>
                )}
              </Text>
            }
          >
            <Text color="dimmed" size="sm">
              <ol>
                {leaders.map((leader) => (
                  <li key={leader.userid}>
                    {leader.name}#{leader.userid} &mdash; {leader.cumPlace}
                  </li>
                ))}
                {!!leaders.length && (
                  <li>
                    <Text
                      underline
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        modals.open({
                          title: 'Other Participants',
                          children: <Text>{cutoff?.users?.map((user) => `${user.name}#${user.id}`).join(', ')}</Text>,
                        })
                      }
                    >
                      ...everyone else (tie)
                    </Text>
                  </li>
                )}
              </ol>
            </Text>
            <Text size="xs" mt={4}>
              {date}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Paper>
  );
};

export default LeagueStandings;
