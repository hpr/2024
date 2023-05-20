import { Avatar, Button, Code, Grid, GridProps, Group, Paper, Stack, Switch, Table, TableProps, Text, Title, Tooltip } from '@mantine/core';
import { useContext, useState } from 'react';
import { Check, Dots, HandClick, HandFinger } from 'tabler-icons-react';
import { AthleteCard } from './AthleteCard';
import { mantineGray, PICKS_PER_EVT } from './const';
import { Store } from './Store';
import { AthleticsEvent, DLMeet, Entries } from './types';
import { modals } from '@mantine/modals';

export const EventTeamPicker = ({ entries, meet, evt }: { entries: Entries | null; meet: DLMeet; evt: AthleticsEvent }) => {
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

  const gridChildren = entries?.[meet]?.[evt!]?.entrants.map((entrant) => {
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
  });

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
                        label={`${i === 0 ? 'Event Captain' : i < PICKS_PER_EVT ? `#${i + 1} Member` : 'Backup'}: ${lastName}`}
                        events={{ hover: true, focus: true, touch: true }}
                      >
                        <Avatar size={i === 0 ? 'lg' : i < PICKS_PER_EVT ? 'md' : 'sm'} src={`img/avatars/${id}_128x128.png`} radius="xl" />
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </Tooltip.Group>
              ) : (
                <>
                  <Text>
                    Select {PICKS_PER_EVT === 3 ? 'an event captain, secondary pick, and backup pick' : `your team of ${PICKS_PER_EVT} athletes`} below
                  </Text>
                  <Text>
                    (<strong>Hint:</strong> You can click / tap <HandClick /> on the athlete's pictures to see detailed reports of PBs and recent results)
                  </Text>
                </>
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
              <Title order={1} sx={{ textAlign: 'center' }}>
                {evt}
              </Title>
              <Group>
                <Switch checked={tableView} onChange={(e) => setTableView(e.currentTarget.checked)} label="Table View?" />
                <Button size="xs" variant="default" color={mantineGray} onClick={() => setMyTeam({ ...myTeam, [meet]: { ...myTeam[meet], [evt]: [] } })}>
                  Reset Team
                </Button>
              </Group>
              <Button
                onClick={() =>
                  modals.open({
                    title: `${evt} AI Preview`,
                    children: (
                      <Code block sx={{ whiteSpace: 'pre-wrap' }}>
                        {entries?.[meet]?.[evt]?.blurb?.replaceAll('\\n', '\n')}
                      </Code>
                    ),
                  })
                }
              >
                Open ChatGPT Preview
              </Button>
            </Stack>
          </Paper>

          {tableView ? (
            <TableAndTbody fontSize="lg" striped highlightOnHover withBorder withColumnBorders>
              {gridChildren}
            </TableAndTbody>
          ) : (
            <Grid justify="center">{gridChildren}</Grid>
          )}
        </Stack>
      </Paper>
    </>
  );
};
