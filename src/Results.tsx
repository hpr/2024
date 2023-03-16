import {
  Accordion,
  List,
  Title,
  Text,
  Avatar,
  Badge,
  Group,
  CloseButton,
  Paper,
} from '@mantine/core';
import { useContext } from 'react';
import { disciplineCodes } from './const';
import { Store } from './Store';
import { AthleticsEvent, DLMeet, Entries } from './types';
import { evtSort } from './util';

export const Results = ({ entries, meet }: { entries: Entries | null; meet: DLMeet }) => {
  const { teamToScore, setTeamToScore } = useContext(Store);
  return (
    <>
      <Paper withBorder p="md" radius="md">
        {teamToScore?.name ? (
          <Group>
            <Title order={2}>Scoring for {teamToScore.name}</Title>
            <CloseButton variant="subtle" onClick={() => setTeamToScore({ name: '', lbpicks: {} })} />
          </Group>
        ) : (
          <Title order={2}>Results</Title>
        )}
      </Paper>
      {!Object.keys(entries?.[meet] ?? {}).filter(
        (evt) => entries![meet]![evt as AthleticsEvent]!.results
      ).length && 'Will be populated after events finish...'}
      <Accordion variant="contained">
        {Object.keys(entries?.[meet] ?? {})
          .filter((evt) => entries![meet]![evt as AthleticsEvent]!.results)
          .sort(evtSort)
          .map((evt) => {
            const results = entries![meet]![evt as AthleticsEvent]?.results!;
            const shortCode = ((evt.startsWith("Men's") ? 'M' : 'W') +
              disciplineCodes[evt.split(' ').slice(1).join(' ')]) as AthleticsEvent;
            const evtPoints = Object.values(
              teamToScore?.lbpicks?.[shortCode]?.scorers ?? {}
            ).reduce((acc, x) => acc + x, 0);
            return (
              <Accordion.Item value={evt} key={evt}>
                <Accordion.Control>
                  <Group position="apart">
                    <Text>{evt}</Text>
                    {evtPoints && (
                      <Badge size="lg" color="green">
                        + {evtPoints}
                      </Badge>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <List type="ordered">
                    {results.map(({ entrant = {}, mark, notes, place }, i) => {
                      const wasChosen =
                        entrant.id! in (teamToScore?.lbpicks?.[shortCode]?.scorers ?? {});
                      return (
                        <List.Item
                          key={entrant.id ?? i}
                          icon={
                            <Avatar
                              radius="xl"
                              size="sm"
                              src={`img/avatars/${entrant.id ?? 'default'}_128x128.png`}
                            />
                          }
                        >
                          <Group position="apart">
                            <Text
                              sx={{
                                fontWeight: wasChosen ? 'bold' : undefined,
                                fontStyle: wasChosen ? 'italic' : undefined,
                              }}
                            >
                              {place}. {entrant.firstName} {entrant.lastName} &mdash; {mark}
                            </Text>
                            <div>
                              {notes
                                ?.split(/\s+/)
                                .filter((x) => x)
                                .map((note) => (
                                  <Badge size="xs" key={note}>
                                    {note}
                                  </Badge>
                                ))}{' '}
                              {wasChosen ? (
                                <Badge color="green" size="md">
                                  +
                                  {
                                    teamToScore?.lbpicks?.[shortCode as AthleticsEvent]?.scorers?.[
                                      entrant.id!
                                    ]
                                  }
                                </Badge>
                              ) : (
                                ''
                              )}
                            </div>
                          </Group>
                        </List.Item>
                      );
                    })}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
      </Accordion>
    </>
  );
};
