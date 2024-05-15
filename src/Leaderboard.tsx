import { List, Paper, Avatar, Loader, Accordion, SegmentedControl, Stack, Code, Button, ScrollArea, Group, Text, Badge } from '@mantine/core';
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { DLMeet, Entries, LBEntry, LBType, Page } from './types';
import Filter from 'badwords-filter';
import { mantineGray } from './const';
import { Store } from './Store';
import { useNavigate } from 'react-router-dom';
import { evtSort } from './util';

const filter = new Filter();
type SortBy = 'score' | 'sprintScore' | 'distanceScore';

export const Leaderboard = ({ meet, entries, setPage }: { meet: DLMeet; entries: Entries, setPage: Dispatch<SetStateAction<Page>> }) => {
  const navigate = useNavigate();
  const { teamToScore, setTeamToScore, athletesById } = useContext(Store);
  const [leaderboard, setLeaderboard] = useState<LBType>({});
  const [sortBy, setSortBy] = useState<SortBy>('score');

  const getName = (athId: string) => {
    const match = athletesById[athId];
    return `${match?.firstName} ${match?.lastName}`;
  };

  useEffect(() => {
    (async () => {
      const lb = await (await fetch(`leaderboard_${meet}.json`)).json();
      setLeaderboard(lb);
    })();
  }, []);

  useEffect(() => {
    setLeaderboard({
      ...leaderboard,
      [meet]: [...(leaderboard?.[meet] ?? [])].sort((a, b) => (b[sortBy] === a[sortBy] ? a.name.localeCompare(b.name) : b[sortBy] - a[sortBy])),
    });
  }, [sortBy]);

  return (
    <Paper withBorder p="xl">
      <Stack align="center">
        <SegmentedControl
          value={sortBy}
          onChange={(v: SortBy) => setSortBy(v)}
          data={[
            { label: `${meet[0].toUpperCase()}${meet.slice(1, -2)} Leaderboard`, value: 'score' },
            // { label: 'King of the Distance', value: 'distanceScore' },
            // { label: 'King of the Sprints', value: 'sprintScore' },
          ]}
          mb={10}
        />
        <Accordion variant="contained">
          {leaderboard?.[meet]?.length ? (
            leaderboard?.[meet]!.map(({ name, userid, eventsScored, picks, tb, ...lbentry }: LBEntry, i) => (
              <Accordion.Item key={userid} value={userid + ''}>
                <Accordion.Control
                  sx={{ width: '100%' }}
                  icon={
                    <Avatar size="sm" radius="xl" style={{ border: `1px solid ${mantineGray}` }}>
                      {leaderboard[meet]?.findIndex((entry) => entry.score === lbentry.score)! + 1}
                    </Avatar>
                  }
                >
                  <Group position="apart">
                    <Text>
                      {filter.clean(name)}
                      {/* <Badge size="sm">#{userid}</Badge>*/}
                    </Text>
                    <Text>
                      <Badge size="md" rightSection="pts" color="green">
                        {lbentry[sortBy]}
                      </Badge>
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack align="center">
                    <Text italic>{eventsScored} events scored</Text>
                    <Button
                      fullWidth
                      onClick={() => {
                        setTeamToScore({ lbpicks: picks, name });
                        navigate(`/${meet}/scoring`);
                        setPage('scoring');
                      }}
                    >
                      View scoring
                    </Button>
                    <ScrollArea w={300} type="always" scrollbarSize={15} offsetScrollbars>
                      <Code block>
                        {Object.entries(picks)
                          .sort(([a], [b]) => evtSort(a, b))
                          .map(([evt, { team }]) => `${evt}: ${team.map(getName).join(', ')}`)
                          .join('\n')}
                        {tb && `\nTiebreaker: ${tb}`}
                      </Code>
                    </ScrollArea>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))
          ) : (
            <Loader />
          )}
        </Accordion>
      </Stack>
    </Paper>
  );
};
