import { Avatar, Button, Code, Grid, GridProps, Group, Paper, Stack, Switch, Table, TableProps, Text, Title, Tooltip } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { Check, Clock, ClockPause, Dots, ExternalLink, HandClick, HandFinger, Robot, Tex } from 'tabler-icons-react';
import { AthleteCard } from './AthleteCard';
import { GRAPHQL_API_KEY, GRAPHQL_ENDPOINT, GRAPHQL_QUERY, mantineGray, PICKS_PER_EVT } from './const';
import { Store } from './Store';
import { AthleticsEvent, Competitor, DLMeet, Entries } from './types';
import { modals } from '@mantine/modals';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { getSitelink, normalize } from './util';

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

  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const numEntrants = entries?.[meet]?.[evt!]?.entrants.length!;
  const [competitors, setCompetitors] = useState<{ [key: string]: Competitor | null }>({});
  const [wikis, setWikis] = useState<{ [key: string]: string | null }>({});

  const cacheDetails = async (i: number, evt: AthleticsEvent) => {
    const entrant = entries?.[meet]?.[evt!]?.entrants[i]!;
    if (!competitors[evt + i]) {
      getSitelink(entrant.id).then((sparqlResp) => {
        if (sparqlResp.results.bindings[0]?.enWikiSiteLink?.value) {
          setWikis({ ...wikis, [evt + i]: sparqlResp.results.bindings[0].enWikiSiteLink.value });
        }
      });
      const { competitor: competitorResp } = (
        await (
          await fetch(GRAPHQL_ENDPOINT, {
            headers: { 'x-api-key': GRAPHQL_API_KEY },
            body: JSON.stringify({
              operationName: 'GetCompetitorBasicInfo',
              query: GRAPHQL_QUERY,
              variables: { id: entrant.id },
            }),
            method: 'POST',
          })
        ).json()
      ).data;
      setCompetitors({ ...competitors, [evt + i]: competitorResp });
    }
  };

  const gridChildren = entries?.[meet]?.[evt!]?.entrants.map((entrant, i) => {
    const { id, firstName, lastName, pb, sb, nat, blurb } = entrant;
    if (!id) console.log(firstName, lastName);
    return (
      <AthleteCard
        idx={i}
        numEntrants={numEntrants}
        isClosed={!!entries?.[meet]?.[evt as AthleticsEvent]?.isClosed}
        key={id}
        tableView={tableView}
        showPrev={() => {
          setShowDetails({ ...showDetails, [evt + i]: false, [evt + (i - 1)]: true });
          cacheDetails(i - 1, evt);
        }}
        showNext={() => {
          setShowDetails({ ...showDetails, [evt + i]: false, [evt + (i + 1)]: true });
          cacheDetails(i + 1, evt);
        }}
        cacheDetails={() => cacheDetails(i, evt)}
        competitor={competitors[evt + i]}
        wiki={wikis[evt + i]}
        showDetails={!!showDetails[evt + i]}
        setShowDetails={(sd: boolean) => setShowDetails({ ...showDetails, [evt + i]: sd })}
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
  const entriesEvt = entries?.[meet]?.[evt as AthleticsEvent];
  return (
    <>
      <Paper shadow="xl" radius="xl" p="xl" withBorder sx={{ minHeight: 193 }}>
        <Stack align="center">
          {!!entries?.[meet]?.[evt as AthleticsEvent]?.isClosed ? (
            <Text>Event Closed</Text>
          ) : entriesEvt?.entrants?.length === 0 ? (
            <>
              <Title order={1}>Awaiting Startlist</Title>
              <Text style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <ClockPause size={30} /> ... Looks like the startlists aren't available yet.
              </Text>
              <Text>
                Check{' '}
                <a target="_blank" href={entriesEvt.url}>
                  the official meet website
                </a>{' '}
                for details -- when entries are available there, this site will soon be updated so you can make picks!
              </Text>
            </>
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
                    title: (
                      <>
                        <Text>
                          {evt} AI Preview <Robot />
                        </Text>
                        <Button
                          mt="sm"
                          fullWidth
                          onClick={() => {
                            const ungenderedEvt = evt
                              .split(' ')
                              .filter((w) => !w.toLowerCase().includes('men'))
                              .join(' ')
                              .replace('m', ' Metres')
                              .replace(/Steeple$/, 'Steeplechase');
                            const gender = evt.toLowerCase().includes('Women') ? 'Women' : 'Men';
                            const entrants = entries?.[meet]?.[evt]?.entrants ?? [];
                            const athleteIds = entrants.map((e) => e.id);
                            const currentYear = String(new Date().getFullYear());
                            window.open(
                              normalize(
                                `https://hpr.github.io/match/#/` +
                                  new URLSearchParams({
                                    athleteIds: JSON.stringify(athleteIds),
                                    athleteYears: JSON.stringify(Object.fromEntries(athleteIds.map((id) => [id, currentYear]))),
                                    athleteInfo: JSON.stringify(
                                      Object.fromEntries(
                                        entrants.map((ent) => [
                                          ent.id,
                                          {
                                            gender,
                                            givenName: ent.firstName,
                                            familyName: ent.lastName,
                                            aaAthleteId: ent.id,
                                            disciplines: ungenderedEvt,
                                          },
                                        ])
                                      )
                                    ),
                                    athleteBasicInfo: JSON.stringify(
                                      Object.fromEntries(
                                        entrants.map((ent) => [
                                          ent.id,
                                          {
                                            resultsByYear: {
                                              activeYears: [currentYear],
                                            },
                                          },
                                        ])
                                      )
                                    ),
                                    discipline: ungenderedEvt,
                                    response: window.btoa(entries?.[meet]?.[evt]?.blurb ?? ''),
                                  })
                              ),
                              '_blank'
                            );
                          }}
                        >
                          Open in TrackBot Match <ExternalLink />
                        </Button>
                      </>
                    ),
                    children: (
                      <ReactMarkdown>{entries?.[meet]?.[evt]?.blurb ?? ''}</ReactMarkdown>
                      // <Code block sx={{ whiteSpace: 'pre-wrap' }}>
                      //   {entries?.[meet]?.[evt]?.blurb}
                      // </Code>
                    ),
                    size: 'xl',
                  })
                }
              >
                Open TrackBot (AI) Preview
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
