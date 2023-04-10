import {
  Avatar,
  Button,
  Group,
  Paper,
  SimpleGrid,
  SimpleGridProps,
  Stack,
  Switch,
  Table,
  TableProps,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useContext, useState } from 'react';
import { Check, Dots } from 'tabler-icons-react';
import { AthleteCard } from './AthleteCard';
import { mantineGray, NUM_BACKUP, PICKS_PER_EVT } from './const';
import { Store } from './Store';
import { AthleticsEvent, DLMeet, Entries } from './types';

export const EventTeamPicker = ({
  entries,
  meet,
  evt,
}: {
  entries: Entries | null;
  meet: DLMeet;
  evt: AthleticsEvent;
}) => {
  const { myTeam, setMyTeam } = useContext(Store);
  const [tableView, setTableView] = useState<boolean>(false);

  const TableAndTbody = ({ children, ...props }: TableProps) => (
    <Table {...props}>
      <thead>
        <tr>
          <th>Name</th>
          {/* <th>Team</th>
          <th>Nat.</th> */}
          <th>PB</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </Table>
  );

  const GridContainer = tableView ? TableAndTbody : SimpleGrid;
  const gridContainerProps = tableView
    ? ({
        fontSize: 'lg',
        striped: true,
        highlightOnHover: true,
        withBorder: true,
        withColumnBorders: true,
      } as TableProps)
    : ({
        cols: 8,
        breakpoints: [
          { maxWidth: 'sm', cols: 2 },
          { maxWidth: 'md', cols: 3 },
          { maxWidth: 'lg', cols: 5 },
          { maxWidth: 'xl', cols: 7 },
        ],
        spacing: 'lg',
        verticalSpacing: 'xl',
      } as SimpleGridProps);

  const myTeamPicks = myTeam[meet]?.[evt!] ?? [];
  return (
    <>
      <Paper shadow="xl" radius="xl" p="xl" withBorder sx={{ minHeight: 193 }}>
        <Stack align="center">
          {!!entries?.[meet]?.[evt as AthleticsEvent]?.isClosed ? (
            <Text>Event Closed</Text>
          ) : (
            <>
              {myTeamPicks.length ? (
                <Tooltip.Group openDelay={0} closeDelay={100}>
                  <Avatar.Group spacing="xs">
                    {myTeamPicks.map(({ id, lastName }, i) => (
                      <Tooltip
                        key={i}
                        withArrow
                        label={`${
                          i === 0
                            ? 'Event Captain'
                            : i < PICKS_PER_EVT - NUM_BACKUP
                            ? `#${i + 1} Member`
                            : 'Backup'
                        }: ${lastName}`}
                        events={{ hover: true, focus: true, touch: true }}
                      >
                        <Avatar
                          size={i === 0 ? 'lg' : i < PICKS_PER_EVT - NUM_BACKUP ? 'md' : 'sm'}
                          src={`img/avatars/${id}_128x128.png`}
                          radius="xl"
                        />
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </Tooltip.Group>
              ) : (
                <Text>
                  Select{' '}
                  {PICKS_PER_EVT === 3
                    ? 'an event captain, secondary pick, and backup pick'
                    : `your team of ${PICKS_PER_EVT} athletes`}{' '}
                  below
                </Text>
              )}
              {myTeamPicks.length == PICKS_PER_EVT ? (
                <>
                  <Check size={30} />
                  Event Complete! Now select another event on the left menu
                </>
              ) : (
                <>
                  {myTeamPicks.length ? `Select ${PICKS_PER_EVT - myTeamPicks.length} more...` : ''}
                  <Dots size={30} />
                </>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Event time: {new Date(entries?.[meet]?.[evt!]?.date!).toLocaleTimeString().replace(':00 ', ' ')} */}
      <Paper withBorder radius="xl" p="lg">
        <Stack align="center">
          <Paper withBorder radius="xl" p="lg" py="md" shadow="xl">
            <Stack align="center">
              <Title order={1}>{evt}</Title>
              <Group>
                <Switch
                  checked={tableView}
                  onChange={(e) => setTableView(e.currentTarget.checked)}
                  label="Table View?"
                />
                <Button
                  size="xs"
                  variant="default"
                  color={mantineGray}
                  onClick={() => setMyTeam({ ...myTeam, [meet]: { ...myTeam[meet], [evt]: [] } })}
                >
                  Reset Team
                </Button>
              </Group>
            </Stack>
          </Paper>

          <GridContainer {...gridContainerProps}>
            {entries?.[meet]?.[evt!]?.entrants.map((entrant) => {
              const { id, firstName, lastName, pb, sb, nat, blurb } = entrant;
              if (!id) console.log(firstName, lastName);
              return (
                <AthleteCard
                  isClosed={!!entries?.[meet]?.[evt as AthleticsEvent]?.isClosed}
                  key={id}
                  tableView={tableView}
                  avatar={`img/avatars/${id}_128x128.png`}
                  meet={meet}
                  event={evt!}
                  entrant={{ ...entrant, blurb: undefined }}
                  blurb={blurb}
                  name={`${firstName} ${lastName}`}
                  job={nat}
                  stats={[
                    { label: 'PB', value: pb! },
                    { label: 'SB', value: sb! },
                  ].filter((x) => x.value)}
                />
              );
            })}
          </GridContainer>
        </Stack>
      </Paper>
    </>
  );
};
