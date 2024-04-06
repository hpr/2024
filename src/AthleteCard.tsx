import {
  Avatar,
  Text,
  Group,
  Button,
  Modal,
  Accordion,
  List,
  Stack,
  Title,
  Table,
  LoadingOverlay,
  Popover,
  Indicator,
  useMantineTheme,
  Paper,
  Badge,
  Box,
  Grid,
  CloseButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Book, Globe, Link, Minus, Plus, World } from 'tabler-icons-react';
import { GRAPHQL_API_KEY, GRAPHQL_ENDPOINT, GRAPHQL_QUERY, mantineGray, PICKS_PER_EVT } from './const';
import { Store } from './Store';
import { AthleticsEvent, Competitor, DLMeet, Entrant, ResultsByYearResult } from './types';
import { getSitelink, isTouchDevice } from './util';

interface AthleteCardProps {
  avatar: string;
  name: string;
  job: string;
  stats: { label: string; value: string }[];
  event: AthleticsEvent;
  meet: DLMeet;
  entrant: Entrant;
  tableView: boolean;
  isClosed: boolean;
  blurb?: string;
  idx: number;
  numEntrants: number;
  showDetails: boolean;
  setShowDetails: (sd: boolean) => void;
  showPrev: () => void;
  showNext: () => void;

  cacheDetails: () => void;
  competitor: Competitor | null;
  wiki: string | null;
}

function nth(n: string) {
  const num = Number.parseInt(n);
  return ['st', 'nd', 'rd'][((((num + 90) % 100) - 10) % 10) - 1] || 'th';
}

export function AthleteCard({
  avatar,
  name,
  job,
  stats,
  event,
  meet,
  entrant,
  blurb,
  tableView,
  isClosed,
  showDetails,
  setShowDetails,
  showNext,
  showPrev,
  idx,
  numEntrants,
  cacheDetails,
  competitor,
  wiki,
}: AthleteCardProps) {
  const { myTeam, setMyTeam } = useContext(Store);
  const theme = useMantineTheme();
  const [popOpened, { close: popClose, open: popOpen }] = useDisclosure(false);
  const isSmall = useMediaQuery(`(max-width: ${theme.breakpoints.md}px)`);

  const team = myTeam?.[meet]?.[event] ?? [];
  const teamPosition = team.findIndex((member) => member.id === entrant.id);
  const isOnTeam = teamPosition >= 0;
  const isBackup = teamPosition >= PICKS_PER_EVT;

  const items = stats.map((stat) => (
    <div key={stat.label}>
      <Text align="center" size="lg" weight={500}>
        {stat.value}
      </Text>
      <Text align="center" size="sm" color="dimmed">
        {stat.label}
      </Text>
    </div>
  ));

  const addToTeam: React.MouseEventHandler = (evt) => {
    evt.stopPropagation();
    if (isClosed) return;
    if (!isOnTeam && (myTeam[meet]?.[event]?.length ?? 0) >= PICKS_PER_EVT) return;
    setMyTeam({
      ...myTeam,
      [meet]: {
        ...myTeam[meet],
        [event]: isOnTeam ? myTeam[meet]![event]?.filter((member) => member.id !== entrant.id) : [...(myTeam[meet]?.[event] ?? []), entrant],
      },
    });
  };
  const AddToTeamButtonIcon = isOnTeam ? Minus : team.length < PICKS_PER_EVT ? Plus : AlertCircle;

  return (
    <>
      <Modal
        size={500}
        title={
          <Text variant="gradient" gradient={{ from: 'gray', to: 'white' }} size={30} sx={{ fontWeight: 'bold' }}>
            {entrant.firstName} {entrant.lastName.toUpperCase()}
          </Text>
        }
        closeButtonProps={{ mr: 10, variant: 'outline' }}
        withCloseButton={true}
        opened={showDetails}
        onClose={() => setShowDetails(false)}
      >
        <div style={{ position: 'relative' }}>
          <Stack align="center">
            <Group align="center" position="center">
              <Button disabled={idx === 0} variant="outline" onClick={() => showPrev()}>
                <ArrowLeft />
              </Button>
              <Avatar variant="outline" bg="gray" size={128} radius={128} src={entrant.hasAvy ? avatar : undefined}>
                {!entrant.hasAvy && entrant.firstName[0] + entrant.lastName[0]}
              </Avatar>
              <Button disabled={idx === numEntrants - 1} variant="outline" onClick={() => showNext()}>
                <ArrowRight />
              </Button>
            </Group>
            <Group align="center" position="center">
              {entrant.pb && (
                <Badge size="xl" rightSection="PB">
                  {entrant.pb}
                </Badge>
              )}
              {entrant.sb && (
                <Badge size="xl" rightSection="SB">
                  {entrant.sb}
                </Badge>
              )}
              <Badge size="xl" leftSection={<World style={{ marginTop: 10 }} />}>
                {entrant.nat}
              </Badge>
            </Group>
            <Button.Group orientation="vertical">
              <Button variant="outline" leftIcon={<AddToTeamButtonIcon />} radius="xl" size="xl" color={isOnTeam ? 'red' : undefined} onClick={addToTeam}>
                {(() => {
                  if (isSmall) return '';
                  if (isOnTeam) return 'Remove from Team';
                  if (team.length >= PICKS_PER_EVT) return 'Team Full';
                  if (team.length === 0) return 'Add as Event Captain';
                  return 'Add to Team';
                })()}
              </Button>
              <Button
                size="xl"
                variant="outline"
                radius="xl"
                leftIcon={<Link />}
                onClick={() => window.open(`https://worldathletics.org/athletes/_/${entrant.id}`, '_blank')}
              >
                {isSmall ? '' : 'World Athletics'}
              </Button>
              {wiki && (
                <Button size="xl" variant="outline" radius="xl" leftIcon={<Book />} onClick={() => window.open(wiki, '_blank')}>
                  {isSmall ? (
                    ''
                  ) : (
                    <>
                      Wiki{' '}
                      <Badge ml="md" color="red">
                        New!
                      </Badge>
                    </>
                  )}
                </Button>
              )}
            </Button.Group>
            {blurb && (
              <Accordion variant="contained" sx={{ width: '100%' }}>
                <Accordion.Item value="blurb">
                  <Accordion.Control>AI-Generated Bio (may contain incorrect information)</Accordion.Control>
                  <Accordion.Panel>{blurb}</Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            )}
            <Title order={3}>Personal Bests</Title>
            <Box pos="relative" w="100%">
              <Stack align="center">
                <LoadingOverlay visible={!competitor} overlayBlur={2} />
                <Table sx={{ textAlign: 'left' }} fontSize="md" striped highlightOnHover withBorder withColumnBorders>
                  <tbody>
                    {competitor?.personalBests.results.map(({ indoor, discipline, mark, notLegal, venue, date, resultScore }, i) => {
                      return (
                        <tr key={i}>
                          <td>
                            {indoor ? 'Indoor' : ''} {discipline}
                          </td>
                          <td>
                            {mark}
                            {notLegal ? '*' : ''} ({date})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                <Title order={3}>{competitor?.resultsByYear?.activeYears[0]} Results</Title>
                <Accordion multiple variant="contained" sx={{ width: '100%' }}>
                  {competitor &&
                    Object.entries(
                      competitor.resultsByYear.resultsByEvent.reduce((acc, { indoor, discipline, results }) => {
                        acc[discipline] ??= [];
                        acc[discipline].push(...results);
                        return acc;
                      }, {} as { [k: string]: ResultsByYearResult[] })
                    ).map(([discipline, results]) => (
                      <Accordion.Item key={discipline} value={discipline}>
                        <Accordion.Control>{discipline}</Accordion.Control>
                        <Accordion.Panel>
                          <List>
                            {results
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map(({ date, venue, place, mark, wind, notLegal }, i) => (
                                <List.Item key={i}>
                                  {date.split(' ').slice(0, -1).join(' ')}:{' '}
                                  <span style={{ fontWeight: 'bold' }}>
                                    {Number.parseInt(place) ? `${Number.parseInt(place)}${nth(place)} place, ` : ''}
                                    {mark}
                                  </span>
                                  {notLegal ? '*' : ''} {wind ? `(${wind})` : ''} @ {venue}
                                </List.Item>
                              ))}
                          </List>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                </Accordion>
              </Stack>
            </Box>
          </Stack>
        </div>
      </Modal>
      {tableView ? (
        <tr
          onClick={() => {
            setShowDetails(true);
            cacheDetails();
          }}
          style={{ cursor: 'pointer' }}
        >
          <td>
            {name}
            {isOnTeam && <Badge ml={5}>{isBackup ? 'Backup' : `#${teamPosition + 1}`}</Badge>}
          </td>
          {/* <td>{entrant.team}</td>
          <td>{job}</td> */}
          <td>{entrant.pb}</td>
          <td onClick={addToTeam}>
            <Button
              size="xs"
              compact
              fullWidth
              sx={{ minWidth: 114 }}
              color={isOnTeam ? 'red' : undefined}
              disabled={!isOnTeam && team.length >= PICKS_PER_EVT}
              leftIcon={<AddToTeamButtonIcon size={20} />}
            >
              {(() => {
                if (isOnTeam) return 'Remove';
                if (team.length === 0) return 'Captain';
                if (team.length < PICKS_PER_EVT) return 'Add';
                return 'Full';
              })()}
            </Button>
          </td>
        </tr>
      ) : (
        <Grid.Col span="content">
          <Popover width={200} position="bottom" withArrow shadow="md" opened={popOpened}>
            <Popover.Target>
              <Indicator
                className="addToTeamIndicator"
                color={isOnTeam ? 'red' : mantineGray}
                disabled={!isOnTeam && team.length >= PICKS_PER_EVT}
                size={40}
                withBorder
                label={<AddToTeamButtonIcon onClick={addToTeam} />}
                offset={15}
                sx={{ cursor: 'pointer', zIndex: 1 }}
              >
                <Indicator
                  color={'green'}
                  disabled={!isOnTeam}
                  size={30}
                  withBorder
                  label={isBackup ? 'Backup' : `#${teamPosition + 1}`}
                  offset={15}
                  position="top-start"
                  sx={{ zIndex: 1 }}
                >
                  <Indicator withBorder color={mantineGray} size={20} label={entrant.lastName.toUpperCase()} position="bottom-center">
                    <Avatar
                      onMouseEnter={popOpen}
                      onMouseLeave={popClose}
                      onClick={() => {
                        setShowDetails(true);
                        cacheDetails();
                      }}
                      src={entrant.hasAvy ? avatar : undefined}
                      size={128}
                      radius={128}
                      mx="auto"
                      sx={{ border: `1px solid ${mantineGray}`, cursor: 'pointer' }}
                    >
                      {!entrant.hasAvy && entrant.firstName[0] + entrant.lastName[0]}
                    </Avatar>
                  </Indicator>
                </Indicator>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown sx={{ display: isTouchDevice() ? 'none' : undefined }}>
              <Text align="center" size="lg" weight={500} mt="sm">
                {name}
              </Text>
              <Text align="center" size="sm" color="dimmed">
                {entrant.team ? `${entrant.team} (${job})` : job}
              </Text>
              <Group mt="md" position="center" spacing={30}>
                {items}
              </Group>
            </Popover.Dropdown>
          </Popover>
        </Grid.Col>
      )}
    </>
  );
}
