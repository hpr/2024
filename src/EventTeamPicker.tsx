import {
  Avatar,
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
import { PICKS_PER_EVT } from './const';
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
  const { myTeam } = useContext(Store);
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
      <Paper shadow="xl" radius="xl" p="xl" withBorder>
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
                          i === 0 ? 'Event Captain' : i === 1 ? 'Secondary' : 'Backup'
                        }: ${lastName}`}
                        events={{ hover: true, focus: true, touch: true }}
                      >
                        <Avatar
                          size={i === 0 ? 'xl' : i === 1 ? 'lg' : 'md'}
                          src={`img/avatars/${id}_128x128.png`}
                          radius="xl"
                        />
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </Tooltip.Group>
              ) : (
                <Text>Select an event captain, secondary pick, and backup pick below</Text>
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
              <Switch
                checked={tableView}
                onChange={(e) => setTableView(e.currentTarget.checked)}
                label="Table View?"
              />
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
