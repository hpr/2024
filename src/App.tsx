import {
  AppShell,
  Avatar,
  Badge,
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
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { AthleteCard } from './AthleteCard';
import { AthleticsEvent, AuthPage, DLMeet, Entries, Team } from './types';
import { Store } from './Store';
import { MainLinks } from './MainLinks';
import { User } from './User';
import { Calculator, Check, Run } from 'tabler-icons-react';
import { PICKS_PER_EVT, scoring, SERVER_URL } from './const';
import { isEmail, useForm } from '@mantine/form';

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
  const [entries, setEntries] = useState<Entries | null>(null);
  const [meet] = useState<DLMeet>('ncaai23');
  const [evt, setEvt] = useState<AthleticsEvent | null>(null);
  const [myTeam, setMyTeam] = useState<Team>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);
  const [page, setPage] = useState<'events' | 'scoring'>('events');
  const [authPage, setAuthPage] = useState<AuthPage>('register');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
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

  const theme = useMantineTheme();

  useEffect(() => {
    (async () => {
      const entries = await (await fetch('entries.json')).json();
      setEntries(entries);
      setEvt(Object.keys(entries[meet] ?? [])[0] as AthleticsEvent);
    })();
  }, []);

  useEffect(() => {
    setMyTeam(JSON.parse(localStorage.getItem('myTeam') ?? '{}'));
  }, []);

  useEffect(() => {
    if (Object.keys(myTeam).length) localStorage.setItem('myTeam', JSON.stringify(myTeam));
  }, [myTeam]);

  const myTeamPicks = myTeam[meet]?.[evt!] ?? [];
  const arePicksComplete =
    Object.values(myTeam[meet] ?? {}).flat().length ===
    Object.keys(entries?.[meet] ?? {}).length * PICKS_PER_EVT;

  const picksText = Object.keys(myTeam[meet] ?? {})
    .sort(evtSort)
    .map(
      (evt) =>
        `${evt}: ${myTeam[meet]![evt as AthleticsEvent]!.map(
          ({ firstName, lastName }) => `${firstName} ${lastName}`
        ).join(', ')}`
    )
    .join('\n');

  return (
    <Store.Provider value={{ myTeam, setMyTeam }}>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Submit Picks">
        {arePicksComplete ? (
          <Stack>
            <SegmentedControl
              value={authPage}
              onChange={(v: AuthPage) => setAuthPage(v)}
              data={[
                { label: 'Login & Submit', value: 'addPicks' },
                { label: 'Register', value: 'register' },
              ]}
              mb={10}
            />
            <form
              onChange={() => setIsSuccess(false)}
              onSubmit={registerForm.onSubmit(async (vals) => {
                setIsLoading(true);
                const { status } = await (
                  await fetch(SERVER_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                      action: authPage,
                      ...vals,
                      ...(authPage === 'addPicks' ? { picksJson: myTeam[meet] } : {}),
                    }),
                  })
                ).json();
                setIsLoading(false);
                if (status === 'success') setIsSuccess(true);
                else
                  registerForm.setErrors({
                    email: `Error in ${
                      authPage === 'register' ? 'registration' : 'login'
                    }, try again?`,
                  });
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
                      ? 'Registered'
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
                    ...(arePicksComplete
                      ? [
                          {
                            icon: <Calculator />,
                            color: 'black',
                            label: 'Scoring',
                            onClick: () => {
                              setPage('scoring');
                              setNavbarOpen(false);
                            },
                          },
                        ]
                      : []),
                    ...Object.keys(entries?.[meet] ?? {})
                      .sort(evtSort)
                      .map((label) => {
                        const linkEvt = label as AthleticsEvent;
                        const filled = myTeam[meet]?.[linkEvt]?.length === PICKS_PER_EVT;
                        return {
                          icon: filled ? <Check /> : <Run />,
                          color: filled ? 'green' : 'blue',
                          onClick: () => {
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

            <Navbar.Section onClick={() => setModalOpen(true)}>
              <User />
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
              <Text size="xl" weight={500}>
                Fantasy NCAA Indoors
              </Text>
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
          {page === 'scoring' ? (
            <>
              Scoring:
              <Accordion variant="contained">
                {Object.keys(entries?.[meet]!)
                  .filter((evt) => entries![meet]![evt as AthleticsEvent]!.results)
                  .map((evt) => {
                    const picks = myTeam[meet]![evt as AthleticsEvent]!;
                    const results = entries![meet]![evt as AthleticsEvent]?.results!;
                    const primaryPlace =
                      results.findIndex((res) => picks[0].id === res.entrant.id) + 1;
                    const secondaryPlace =
                      results.findIndex((res) => picks[1].id === res.entrant.id) + 1;

                    const pickToScore =
                      primaryPlace <= 3 ? 0 : secondaryPlace < primaryPlace ? 1 : 0;
                    const score = scoring[(pickToScore === 0 ? primaryPlace : secondaryPlace) - 1];
                    return (
                      <Accordion.Item value={evt} key={evt}>
                        <Accordion.Control>
                          {evt} &mdash; {score} pts
                        </Accordion.Control>
                        <Accordion.Panel>
                          <List type="ordered">
                            {results.map(({ entrant = {}, mark, notes, place }, i) => (
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
                                    fontWeight:
                                      entrant.id === picks[pickToScore].id ? 'bold' : undefined,
                                  }}
                                >
                                  {place}. {entrant.firstName} {entrant.lastName} &mdash; {mark}
                                  {notes ? ` (${notes})` : ''}
                                </Text>
                              </List.Item>
                            ))}
                          </List>
                        </Accordion.Panel>
                      </Accordion.Item>
                    );
                  })}
              </Accordion>
            </>
          ) : (
            <>
              <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                {myTeamPicks.map(({ id, lastName }, i) => (
                  <React.Fragment key={id}>
                    <Text sx={{ fontWeight: 'bold' }}>
                      {i === 0 ? 'Primary Pick:' : i === 1 ? 'Secondary Pick:' : 'Backup Pick:'}
                    </Text>
                    <Badge
                      key={id}
                      sx={{ paddingLeft: 0 }}
                      size="lg"
                      radius="xl"
                      leftSection={
                        <Avatar src={`img/avatars/${id}_128x128.png`} mr={5} size={24} />
                      }
                    >
                      {lastName}
                    </Badge>
                  </React.Fragment>
                ))}
              </SimpleGrid>{' '}
              <Text weight={1000} size="xl">
                {evt}
              </Text>
              {/* Event time:{' '}
          {new Date(entries?.[meet]?.[evt!]?.date!).toLocaleTimeString().replace(':00 ', ' ')} */}
              <SimpleGrid
                cols={4}
                breakpoints={[
                  { maxWidth: 'sm', cols: 1 },
                  { maxWidth: 'md', cols: 2 },
                  { maxWidth: 'lg', cols: 3 },
                ]}
              >
                {entries?.[meet]?.[evt!]?.entrants.map((entrant) => {
                  const { id, firstName, lastName, pb, sb, nat } = entrant;
                  return (
                    <AthleteCard
                      key={id}
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
              </SimpleGrid>
            </>
          )}
        </Stack>
      </AppShell>
    </Store.Provider>
  );
}
