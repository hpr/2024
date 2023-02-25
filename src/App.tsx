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
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { AthleteCard } from './AthleteCard';
import { AthleticsEvent, DLMeet, Entries, Team } from './types';
import { Store } from './Store';
import { MainLinks } from './MainLinks';
import { User } from './User';
import { Check, Run } from 'tabler-icons-react';

export default function App() {
  const [entries, setEntries] = useState<Entries | null>(null);
  const [meet] = useState<DLMeet>('doha');
  const [evt, setEvt] = useState<AthleticsEvent | null>(null);
  const [myTeam, setMyTeam] = useState<Team>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [navbarOpen, setNavbarOpen] = useState<boolean>(false);

  const theme = useMantineTheme();

  useEffect(() => {
    (async () => {
      setEntries(await (await fetch('entries.json')).json());
    })();
  }, []);

  const myTeamPicks = myTeam[meet]?.[evt!] ?? [];
  const arePicksComplete =
    Object.values(myTeam[meet] ?? {}).flat().length === Object.keys(entries?.[meet] ?? {}).length * 2;

  return (
    <Store.Provider value={{ myTeam, setMyTeam }}>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Your Picks">
        {arePicksComplete ? (
          <>
            <Text mb={20}>Copy / paste this block to record your picks:</Text>
            <Code block>
              {Object.entries(myTeam[meet] ?? {})
                .map(
                  ([evt, [primary, secondary]]) =>
                    primary &&
                    secondary &&
                    `${evt}: ${primary.firstName} ${primary.lastName} (${secondary.firstName} ${secondary.lastName})`
                )
                .join('\n')}
            </Code>
          </>
        ) : (
          <Text>Please complete your picks before sharing</Text>
        )}
      </Modal>
      <AppShell
        padding="md"
        navbar={
          <Navbar
            width={{ base: 300 }}
            hiddenBreakpoint="sm"
            hidden={!navbarOpen}
            height="calc(100% - 60px)"
            p="xs"
          >
            <Navbar.Section grow mt="xs">
              <MainLinks
                links={Object.keys(entries?.[meet] ?? {})
                  .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
                  .map((label) => {
                    const linkEvt = label as AthleticsEvent;
                    const filled = myTeam[meet]?.[linkEvt]?.length === 2;
                    return {
                      icon: filled ? <Check /> : <Run />,
                      color: filled ? 'green' : 'blue',
                      onClick: () => setEvt(linkEvt),
                      label,
                    };
                  })}
              />
            </Navbar.Section>
            <Navbar.Section>
              <User onClick={() => setModalOpen(true)} />
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
                Fantasy DL
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
          <Group align="center">
            {myTeamPicks.map(({ id, lastName }, i) => (
              <React.Fragment key={id}>
                <Text sx={{ fontWeight: 'bold' }}>
                  {i === 0 ? 'Primary Pick:' : 'Secondary Pick:'}
                </Text>
                <Badge
                  key={id}
                  sx={{ paddingLeft: 0 }}
                  size="lg"
                  radius="xl"
                  leftSection={<Avatar src={`img/avatars/${id}_128x128.png`} mr={5} size={24} />}
                >
                  {lastName}
                </Badge>
              </React.Fragment>
            ))}
          </Group>
          Entries Close:{' '}
          {new Date(entries?.[meet]?.[evt!]?.date!).toLocaleTimeString().replace(':00 ', ' ')}
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
        </Stack>
      </AppShell>
    </Store.Provider>
  );
}
