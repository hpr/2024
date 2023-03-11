import {
  AppShell,
  Avatar,
  Group,
  Header,
  Modal,
  Navbar,
  SimpleGrid,
  Stack,
  Text,
  Code,
  useMantineTheme,
  Burger,
  MediaQuery,
  Button,
  List,
  CopyButton,
  Accordion,
  SegmentedControl,
  TextInput,
  PasswordInput,
  ScrollArea,
  Progress,
  Popover,
  Title,
  Tooltip,
  Paper,
  Switch,
  Table,
  TableProps,
  SimpleGridProps,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { AthleteCard } from './AthleteCard';
import { AthleticsEvent, AuthPage, DLMeet, Entries, Page, Team, TeamToScore } from './types';
import { Store } from './Store';
import { MainLinks } from './MainLinks';
import { User } from './User';
import { BrandGit, Calculator, Check, Dots, Mail, Run, Trophy, Users } from 'tabler-icons-react';
import { disciplineCodes, DIVIDER, PAGES, PICKS_PER_EVT, SERVER_URL } from './const';
import { isEmail, useForm } from '@mantine/form';
import { Submissions } from './Submissions';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';

const evtSort = (a: string, b: string) => {
  const DIGITS = '0123456789';
  const normalize = (s: string) => s.replace('Mile', '1609');
  const firstNumericWord = (s: string) => s.split(' ').find((w) => DIGITS.includes(w[0]))!;
  const gender = (s: string) => (s.match(/(Men|Women)/) ?? [])[0];
  a = normalize(a);
  b = normalize(b);
  if (gender(a) !== gender(b)) return a.localeCompare(b);
  return Number.parseInt(firstNumericWord(a)) - Number.parseInt(firstNumericWord(b));
};

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hash = decodeURIComponent(pathname.slice(1));
  const [entries, setEntries] = useState<Entries | null>(null);
  const [meet] = useState<DLMeet>('ncaai23');
  const [evt, setEvt] = useState<AthleticsEvent | null>(null);
  const [myTeam, setMyTeam] = useState<Team>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('events');
  const [authPage, setAuthPage] = useState<AuthPage>('register');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [tableView, setTableView] = useState<boolean>(false);
  const [teamToScore, setTeamToScore] = useState<TeamToScore | null>(null);
  const registerForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      email: isEmail('Invalid email'),
    },
  });
  if (hash) {
    if (hash.startsWith('evt/')) {
      const hashEvt = hash.split('evt/')[1];
      if (hashEvt !== evt) setEvt(hashEvt as AthleticsEvent);
    } else if (PAGES.includes(hash as Page) && page !== hash) {
      setPage(hash as Page);
    }
  }

  const theme = useMantineTheme();

  useEffect(() => {
    (async () => {
      const entries = await (await fetch('entries.json')).json();
      setEntries(entries);
      const initialEvt = Object.keys(entries[meet] ?? [])[0] as AthleticsEvent;
      setEvt(initialEvt);
      if (!hash) navigate(`evt/${initialEvt}`);
    })();
  }, []);

  useEffect(() => {
    setMyTeam(JSON.parse(localStorage.getItem('myTeam') ?? '{}'));
  }, []);

  useEffect(() => {
    if (Object.keys(myTeam).length) localStorage.setItem('myTeam', JSON.stringify(myTeam));
  }, [myTeam]);

  const myTeamPicks = myTeam[meet]?.[evt!] ?? [];
  const numPicks = Object.values(myTeam[meet] ?? {}).flat().length;
  const numMaxPicks = Object.keys(entries?.[meet] ?? {}).length * PICKS_PER_EVT;
  const arePicksComplete = numPicks === numMaxPicks;
  const percentComplete = Math.round((numPicks / numMaxPicks) * 100);

  const TableAndTbody = ({ children, ...props }: TableProps) => (
    <Table {...props}>
      <thead>
        <tr>
          <th>Name</th>
          {/* <th>Team</th>
          <th>Nat.</th> */}
          <th>SB</th>
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

  const picksText = Object.keys(myTeam[meet] ?? {})
    .sort(evtSort)
    .map(
      (evt) =>
        `${evt}: ${myTeam[meet]![evt as AthleticsEvent]!.map(
          ({ firstName, lastName }) => `${firstName} ${lastName}`
        ).join(', ')}`
    )
    .join('\n');

  const hasEventClosed = Object.values(entries?.[meet] ?? {}).some(({ isClosed }) => isClosed);

  return (
    <Store.Provider value={{ myTeam, setMyTeam, teamToScore, setTeamToScore }}>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Register & Submit Picks">
        {arePicksComplete ? (
          <Stack>
            <SegmentedControl
              value={authPage}
              onChange={(v: AuthPage) => {
                setAuthPage(v);
                registerForm.setErrors({});
                setIsSuccess(false);
              }}
              data={[
                { label: 'Submit Picks', value: 'addPicks' },
                { label: 'Register', value: 'register' },
              ]}
              mb={10}
            />
            <form
              onChange={() => {
                setIsSuccess(false);
                registerForm.setErrors({});
              }}
              onSubmit={registerForm.onSubmit(async (vals) => {
                setIsLoading(true);
                const { status } = await (
                  await fetch(SERVER_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                      action: authPage,
                      ...vals,
                      ...(authPage === 'addPicks' ? { meet, picksJson: myTeam[meet] } : {}),
                    }),
                  })
                ).json();
                setIsLoading(false);
                if (status === 'success') setIsSuccess(true);
                else {
                  setIsSuccess(false);
                  registerForm.setErrors({
                    email: `Error in ${
                      authPage === 'register' ? 'registration' : 'login'
                    }, try again?`,
                  });
                }
              })}
            >
              <TextInput
                withAsterisk
                label="Email"
                placeholder="john@example.com"
                {...registerForm.getInputProps('email')}
              />
              {authPage === 'register' && (
                <TextInput
                  withAsterisk
                  label="Name"
                  placeholder="John (will be displayed on leaderboards)"
                  {...registerForm.getInputProps('name')}
                />
              )}
              <PasswordInput
                withAsterisk
                label="Password"
                placeholder="Password"
                {...registerForm.getInputProps('password')}
              />
              <Group position="right" mt="md">
                <Button
                  leftIcon={isSuccess ? <Check /> : undefined}
                  type="submit"
                  loading={isLoading}
                >
                  {authPage === 'register'
                    ? isSuccess
                      ? 'Registered! Remember to submit your picks as well!'
                      : 'Register'
                    : isSuccess
                    ? 'Submitted Picks!'
                    : 'Submit Picks'}
                </Button>
              </Group>
            </form>

            <Code mt={20} block>
              {picksText}
            </Code>
            <CopyButton value={picksText}>
              {({ copied, copy }) => (
                <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                  {copied ? 'Copied picks' : 'Copy picks to clipboard'}
                </Button>
              )}
            </CopyButton>
          </Stack>
        ) : (
          <>
            <Text mb={20}>
              Please complete your picks before submission. You still need to select for these
              events:
            </Text>
            <List>
              {Object.keys(entries?.[meet] ?? {})
                .sort(evtSort)
                .filter(
                  (evt) => (myTeam[meet]?.[evt as AthleticsEvent]?.length ?? 0) < PICKS_PER_EVT
                )
                .map((evt) => (
                  <List.Item key={evt}>{evt}</List.Item>
                ))}
            </List>
          </>
        )}
      </Modal>
      <AppShell
        padding="md"
        navbarOffsetBreakpoint="sm"
        navbar={
          <Navbar
            sx={{ zIndex: 99 }}
            width={{ base: 300 }}
            hiddenBreakpoint="sm"
            hidden={!navbarOpen}
            height="calc(100% - 60px)"
            p="md"
          >
            <ScrollArea type="always" offsetScrollbars scrollbarSize={15}>
              <Navbar.Section grow mt="xs">
                <MainLinks
                  links={[
                    ...(hasEventClosed
                      ? [
                          {
                            icon: <Trophy />,
                            color: 'gold',
                            label: 'Leaderboard',
                            onClick: () => {
                              navigate('/leaderboard');
                              setPage('leaderboard');
                              setNavbarOpen(false);
                            },
                          },
                          {
                            icon: <Calculator />,
                            color: 'black',
                            label: 'Results',
                            onClick: () => {
                              navigate('/scoring');
                              setPage('scoring');
                              setNavbarOpen(false);
                            },
                          },
                        ]
                      : []),
                    {
                      icon: <Users />,
                      color: 'black',
                      label: 'Submissions',
                      onClick: () => {
                        navigate('/submissions');
                        setPage('submissions');
                        setNavbarOpen(false);
                      },
                    },
                    DIVIDER,
                    ...Object.keys(entries?.[meet] ?? {})
                      .sort(evtSort)
                      .map((label) => {
                        const linkEvt = label as AthleticsEvent;
                        const filled = myTeam[meet]?.[linkEvt]?.length === PICKS_PER_EVT;
                        return {
                          icon: filled ? <Check /> : <Run />,
                          color: filled ? 'green' : 'blue',
                          onClick: () => {
                            navigate(`evt/${linkEvt}`);
                            setEvt(linkEvt);
                            setPage('events');
                            setNavbarOpen(false);
                          },
                          label,
                        };
                      }),
                  ]}
                />
              </Navbar.Section>
            </ScrollArea>

            <Navbar.Section
              onClick={() => {
                if (!hasEventClosed) setModalOpen(true);
              }}
            >
              <User isClosed={hasEventClosed} />
            </Navbar.Section>
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Group sx={{ height: '100%' }} px={20} position="apart">
              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger
                  opened={navbarOpen}
                  onClick={() => setNavbarOpen((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>
              <Text size="md">
                Fantasy NCAA Indoors
                <Popover width="100%" position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Button size="xs" ml={20}>
                      Rules
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text mb={10}>
                      Select {PICKS_PER_EVT} athletes per event by selecting events on the left
                      side, and picking athletes in the main view. The first {PICKS_PER_EVT - 1}{' '}
                      athletes will be your team, and the last athlete will be a "backup" that will
                      automatically be substituted if any of your team members DNS, DNF, or DQ, only
                      if substituting the backup would improve your score. Your incomplete picks are
                      saved to your computer, and once you submit you can always re-submit to update
                      your picks before the submissions deadline.
                    </Text>
                    <Text mb={10}>
                      Your athletes will be scored by place: 10, 8, 6, 5, 4, 3, 2, 1 style. Your
                      Event Captain will score double. Once you have finished your picks, you{' '}
                      <span style={{ fontWeight: 'bold' }}>must</span> submit them by pressing "Save
                      Picks" and then registering an account, then you need to log in and click
                      "Submit Picks".
                    </Text>
                    <Text mb={10}>
                      Prizes as follows, courtesy of the inaugural sponsor{' '}
                      <span style={{ fontWeight: 'bold' }}>LetsRun.com</span>: First Place: LRC
                      Supporters Club Membership, Second Place: Free T-Shirt, Third Place: Free
                      T-Shirt. Submissions Deadline: Friday 3/10 @ 6pm ET.
                    </Text>
                    <Group align="center">
                      <Text>Contact for suggestions, improvements or issues:</Text>
                      <Button
                        variant="default"
                        size="xs"
                        leftIcon={<Mail />}
                        onClick={() => window.open('mailto:habs@sdf.org')?.close()}
                      >
                        habs@sdf.org
                      </Button>
                      <Button
                        variant="default"
                        size="xs"
                        leftIcon={<BrandGit />}
                        onClick={() => window.open('https://github.com/hpr/fantasy-dl', '_blank')}
                      >
                        Source code
                      </Button>
                    </Group>
                  </Popover.Dropdown>
                </Popover>
              </Text>
              <MediaQuery smallerThan="md" styles={{ display: 'none ' }}>
                <Progress
                  value={percentComplete}
                  label={percentComplete >= 10 ? `${percentComplete}% Complete` : ''}
                  size="xl"
                  radius="xl"
                  sx={{ width: '50%' }}
                />
              </MediaQuery>
            </Group>
          </Header>
        }
        styles={(theme) => ({
          main: {
            backgroundColor:
              theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          },
        })}
      >
        <Stack align="center" mt={0}>
          {page === 'submissions' ? (
            <Submissions meet={meet} />
          ) : page === 'leaderboard' ? (
            <Leaderboard meet={meet} entries={entries!} />
          ) : page === 'scoring' ? (
            <>
              {teamToScore && <Title order={2}>Scoring for {teamToScore.name}</Title>}
              {!Object.keys(entries?.[meet] ?? {}).filter(
                (evt) => entries![meet]![evt as AthleticsEvent]!.results
              ).length && 'Will be populated after events finish...'}
              <Accordion variant="contained">
                {Object.keys(entries?.[meet] ?? {})
                  .filter((evt) => entries![meet]![evt as AthleticsEvent]!.results)
                  .map((evt) => {
                    const results = entries![meet]![evt as AthleticsEvent]?.results!;
                    return (
                      <Accordion.Item value={evt} key={evt}>
                        <Accordion.Control>{evt}</Accordion.Control>
                        <Accordion.Panel>
                          <List type="ordered">
                            {results.map(({ entrant = {}, mark, notes, place }, i) => {
                              const shortCode =
                                (evt.startsWith("Men's") ? 'M' : 'W') +
                                disciplineCodes[evt.split(' ').slice(1).join(' ')];
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
                                  <Text
                                    sx={{
                                      fontWeight: Object.keys(
                                        teamToScore?.lbpicks?.[shortCode as AthleticsEvent]
                                          ?.scorers ?? {}
                                      ).includes(entrant.id!)
                                        ? 'bold'
                                        : undefined,
                                    }}
                                  >
                                    {place}. {entrant.firstName} {entrant.lastName} &mdash; {mark}
                                    {notes ? ` (${notes})` : ''}
                                    {Object.keys(
                                      teamToScore?.lbpicks?.[shortCode as AthleticsEvent]
                                        ?.scorers ?? {}
                                    ).includes(entrant.id!)
                                      ? ` (+ ${
                                          teamToScore?.lbpicks?.[shortCode as AthleticsEvent]
                                            ?.scorers?.[entrant.id!]
                                        } pts)`
                                      : ''}
                                  </Text>
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
          ) : (
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
                          {myTeamPicks.length
                            ? `Select ${PICKS_PER_EVT - myTeamPicks.length} more...`
                            : ''}
                          <Dots size={30} />
                        </>
                      )}
                    </>
                  )}
                </Stack>
              </Paper>

              {/* Event time:{' '}
          {new Date(entries?.[meet]?.[evt!]?.date!).toLocaleTimeString().replace(':00 ', ' ')} */}
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
                      const { id, firstName, lastName, pb, sb, nat } = entrant;
                      return (
                        <AthleteCard
                          isClosed={!!entries?.[meet]?.[evt as AthleticsEvent]?.isClosed}
                          key={id}
                          tableView={tableView}
                          avatar={`img/avatars/${id}_128x128.png`}
                          meet={meet}
                          event={evt!}
                          entrant={entrant}
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
          )}
        </Stack>
      </AppShell>
    </Store.Provider>
  );
}
