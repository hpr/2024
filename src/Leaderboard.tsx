import {
  List,
  Paper,
  Avatar,
  Loader,
  Accordion,
  SegmentedControl,
  Stack,
  Code,
  Button,
  ScrollArea,
} from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { DLMeet, Entries, LBEntry, LBType } from './types';
import Filter from 'badwords-filter';
import { mantineGray } from './const';
import { Store } from './Store';
import { useNavigate } from 'react-router-dom';

const filter = new Filter();
type SortBy = 'score' | 'sprintScore' | 'distanceScore';

export const Leaderboard = ({ meet, entries }: { meet: DLMeet; entries: Entries }) => {
  const navigate = useNavigate();
  const { teamToScore, setTeamToScore } = useContext(Store);
  const [leaderboard, setLeaderboard] = useState<LBType>({});
  const [sortBy, setSortBy] = useState<SortBy>('score');

  const getName = (athId: string) => {
    const match = Object.values(entries?.[meet]! ?? {})
      .flatMap(({ entrants }) => entrants)
      .find(({ id }) => id === athId);
    return `${match?.firstName} ${match?.lastName}`;
  };

  useEffect(() => {
    (async () => {
      const lb = await (await fetch('leaderboard.json')).json();
      setLeaderboard(lb);
    })();
  }, []);

  useEffect(() => {
    setLeaderboard({
      ...leaderboard,
      [meet]: [...(leaderboard?.[meet] ?? [])].sort((a, b) => b[sortBy] - a[sortBy]),
    });
  }, [sortBy]);

  return (
    <Paper withBorder p="xl">
      <Stack align="center">
        <SegmentedControl
          value={sortBy}
          onChange={(v: SortBy) => setSortBy(v)}
          data={[
            { label: 'Overall', value: 'score' },
            { label: 'King of the Distance', value: 'distanceScore' },
            { label: 'King of the Sprints', value: 'sprintScore' },
          ]}
          mb={10}
        />
        <Accordion variant="contained">
          {leaderboard?.[meet]?.length ? (
            leaderboard?.[meet]!.map(
              ({ name, userid, eventsScored, picks, ...lbentry }: LBEntry, i) => (
                <Accordion.Item key={userid} value={userid + ''}>
                  <Accordion.Control
                    sx={{ width: "100%" }}
                    icon={
                      <Avatar size="sm" radius="xl" style={{ border: `1px solid ${mantineGray}` }}>
                        {i + 1}
                      </Avatar>
                    }
                  >
                    {filter.clean(name)}: {lbentry[sortBy]}pts ({eventsScored} events scored)
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack align="center">
                      <Button
                        fullWidth
                        onClick={() => {
                          setTeamToScore({ lbpicks: picks, name });
                          navigate('/scoring');
                        }}
                      >
                        View scoring
                      </Button>
                      <ScrollArea w={300} type="always" scrollbarSize={15} offsetScrollbars> {/* fix for mobile */}
                        <Code block>
                          {Object.entries(picks)
                            .map(([evt, { team }]) => `${evt}: ${team.map(getName).join(', ')}`)
                            .join('\n')}
                        </Code>
                      </ScrollArea>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              )
            )
          ) : (
            <Loader />
          )}
        </Accordion>
      </Stack>
    </Paper>
  );
};
