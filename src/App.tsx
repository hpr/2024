import {
  AppShell,
  Group,
  Header,
  Modal,
  Navbar,
  Stack,
  Text,
  Code,
  useMantineTheme,
  Burger,
  MediaQuery,
  Button,
  List,
  CopyButton,
  SegmentedControl,
  TextInput,
  PasswordInput,
  ScrollArea,
  Progress,
  Popover,
  Box,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { AthleticsEvent, AuthPage, DLMeet, Entrant, Entries, Page, Team, TeamToScore } from './types';
import { Store } from './Store';
import { MainLinks } from './MainLinks';
import { User } from './User';
import { BrandGit, Calculator, Check, Diamond, Dots, Mail, Run, Trophy, Users } from 'tabler-icons-react';
import { DIVIDER, PAGES, PICKS_PER_EVT, SERVER_URL } from './const';
import { isEmail, useForm } from '@mantine/form';
import { Submissions } from './Submissions';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';
import { evtSort } from './util';
import { Results } from './Results';
import { EventTeamPicker } from './EventTeamPicker';
import LeagueStandings from './LeagueStandings';

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hash = decodeURIComponent(pathname.slice(1));
  const [entries, setEntries] = useState<Entries | null>(null);
  const [meet] = useState<DLMeet>('paris23');
  const [evt, setEvt] = useState<AthleticsEvent | null>(null);
  const [myTeam, setMyTeam] = useState<Team>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('events');
  const [authPage, setAuthPage] = useState<AuthPage>('register');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [teamToScore, setTeamToScore] = useState<TeamToScore | null>(null);
  const [athletesById, setAthletesById] = useState<{ [id: string]: Entrant }>({});
  const registerForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      tiebreaker: '',
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
      const entries: Entries = await (await fetch('entries.json')).json();
      setEntries(entries);

      setAthletesById(
        Object.fromEntries(
          Object.values(entries?.[meet] ?? {})
            .flatMap(({ entrants }) => entrants)
            .map((entrant) => [entrant.id, entrant])
        )
      );
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

  const numPicks = Object.values(myTeam[meet] ?? {}).flat().length;
  const numMaxPicks = Object.keys(entries?.[meet] ?? {}).length * PICKS_PER_EVT;
  const arePicksComplete = numPicks === numMaxPicks;
  const percentComplete = Math.round((numPicks / numMaxPicks) * 100);

  const picksText = Object.keys(myTeam[meet] ?? {})
    .sort(evtSort)
    .map((evt) => `${evt}: ${myTeam[meet]![evt as AthleticsEvent]!.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', ')}`)
    .join('\n');

  const hasEventClosed = Object.values(entries?.[meet] ?? {}).some(({ isClosed }) => isClosed);

  return (
    <Store.Provider value={{ myTeam, setMyTeam, teamToScore, setTeamToScore, athletesById, setAthletesById }}>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Register / Login & Submit Picks">
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
                { label: 'Submit / Update Picks', value: 'addPicks' },
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
                let { status } = await (
                  await fetch(SERVER_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                      action: authPage,
                      ...vals,
                      ...(authPage === 'addPicks'
                        ? {
                            meet,
                            picksJson: myTeam[meet],
                            tiebreaker: registerForm.values.tiebreaker,
                          }
                        : {}),
                    }),
                  })
                ).json();
                if (authPage === 'register' && status === 'success') {
                  ({ status } = await (
                    await fetch(SERVER_URL, {
                      method: 'POST',
                      body: JSON.stringify({
                        action: 'addPicks',
                        ...vals,
                        ...{
                          meet,
                          picksJson: {
                            ...myTeam[meet],
                            tiebreaker: registerForm.values.tiebreaker,
                          },
                        },
                      }),
                    })
                  ).json());
                }
                setIsLoading(false);
                if (status === 'success') setIsSuccess(true);
                else {
                  setIsSuccess(false);
                  registerForm.setErrors({
                    email: `Error in ${authPage === 'register' ? 'registration' : 'login'}, try again?`,
                  });
                }
              })}
            >
              <TextInput withAsterisk label="Email" placeholder="usain@bolt.com" {...registerForm.getInputProps('email')} />
              {authPage === 'register' && (
                <TextInput withAsterisk label="Name" placeholder="Usain (will be displayed on leaderboards)" {...registerForm.getInputProps('name')} />
              )}
              <PasswordInput withAsterisk label="Password" placeholder="Password" {...registerForm.getInputProps('password')} />
              <TextInput withAsterisk label="Tiebreaker: Men's 3K Steeple winning time?" placeholder="e.g. 12:38.50" {...registerForm.getInputProps('tiebreaker')} />
              <Group position="right" mt="md">
                <Button leftIcon={isSuccess ? <Check /> : undefined} type="submit" loading={isLoading}>
                  {authPage === 'register'
                    ? isSuccess
                      ? 'Registered and submitted picks!'
                      : 'Register'
                    : isSuccess
                    ? 'Updated Picks!'
                    : 'Submit / Update Picks'}
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
            <Text mb={20}>Please complete your picks before submission. You still need to select for these events:</Text>
            <List>
              {Object.keys(entries?.[meet] ?? {})
                .sort(evtSort)
                .filter((evt) => (myTeam[meet]?.[evt as AthleticsEvent]?.length ?? 0) < PICKS_PER_EVT)
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
          <Navbar sx={{ zIndex: 99 }} width={{ base: 300 }} hiddenBreakpoint="sm" hidden={!navbarOpen} height="calc(100% - 60px)" p="md">
            <ScrollArea type="always" offsetScrollbars scrollbarSize={15}>
              <Box w={266}>
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
                        icon: <Diamond />,
                        color: 'black',
                        label: 'League Standings',
                        onClick: () => {
                          navigate('/standings');
                          setPage('standings');
                          setNavbarOpen(false);
                        },
                      },
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
              </Box>
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
                <Burger opened={navbarOpen} onClick={() => setNavbarOpen((o) => !o)} size="sm" color={theme.colors.gray[6]} mr="xl" />
              </MediaQuery>
              <Text size="md">
                Fantasy Paris '23
                <Popover width="100%" position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Button size="xs" ml={20}>
                      Rules
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text mb={10}>
                      Select {PICKS_PER_EVT} athletes per event by selecting events on the left side menu (on mobile tap the three lines to bring it up), and
                      picking athletes in the main view. Your incomplete picks are saved to your device, and once you submit you can always re-submit to update
                      your picks before the submissions deadline.
                    </Text>
                    <Text mb={10}>
                      Your athletes will be scored by place, with zero points awarded outside the top six. The <strong>catch</strong> is that the order of your
                      team matters: Your first athlete will be scored 20-12-8-6-5-4 style, then your #2 athlete will be scored 10-8-6-4-3-2 style, and your
                      final athlete will be scored 6-5-4-3-2-1. Once all {PICKS_PER_EVT} athletes are scored, we remove the lowest-scoring athlete so that only
                      your top {PICKS_PER_EVT - 1} scorers per event will count. Once you have finished your picks, you <strong>must</strong> submit them by
                      pressing "Save Picks" and then registering or logging in to an account.
                    </Text>
                    <Text mb={10}>
                      <strong>Submissions Deadline:</strong> Friday June 9, before the DL TV window starts, by 2pm ET.
                      {/* <br />
                      <strong>Prizes:</strong> First Place: Free Supporters Club Membership ($100 value!) + T-Shirt. Second Place: Free T-Shirt. Third Place:
                      Free T-Shirt. Thanks to sponsor <strong>LetsRun.com</strong> for providing the prizes! */}
                    </Text>
                    <Group align="center">
                      <Text>Contact for suggestions, improvements or issues:</Text>
                      <Button variant="default" size="xs" leftIcon={<Mail />} onClick={() => window.open('mailto:habs@sdf.org')?.close()}>
                        habs@sdf.org
                      </Button>
                      <Button variant="default" size="xs" leftIcon={<BrandGit />} onClick={() => window.open(`https://github.com/hpr/${meet}`, '_blank')}>
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
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          },
        })}
      >
        <Stack align="center" mt={0}>
          {page === 'submissions' ? (
            <Submissions meet={meet} />
          ) : page === 'leaderboard' ? (
            <Leaderboard meet={meet} entries={entries!} />
          ) : page === 'scoring' ? (
            <Results entries={entries} meet={meet} />
          ) : page === 'standings' ? (
            <LeagueStandings />
          ) : (
            <EventTeamPicker entries={entries} meet={meet} evt={evt!} />
          )}
        </Stack>
      </AppShell>
    </Store.Provider>
  );
}
