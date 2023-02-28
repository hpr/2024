import { createStyles, Card, Avatar, Text, Group, Button } from '@mantine/core';
import { useContext } from 'react';
import { Store } from './Store';
import { AthleticsEvent, DLMeet, Entrant } from './types';

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
  },

  avatar: {
    border: `2px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white}`,
  },
}));

interface AthleteCardProps {
  avatar: string;
  name: string;
  job: string;
  stats: { label: string; value: string }[];
  event: AthleticsEvent;
  meet: DLMeet;
  entrant: Entrant;
}

export function AthleteCard({ avatar, name, job, stats, event, meet, entrant }: AthleteCardProps) {
  const { classes, theme } = useStyles();
  const { myTeam, setMyTeam } = useContext(Store);

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

  const team = myTeam?.[meet]?.[event] ?? [];
  const isOnTeam = !!team.find((member) => member.id === entrant.id);

  return (
    <Card withBorder p="xl" radius="md" className={classes.card}>
      {/* <Card.Section sx={{ backgroundImage: `url(${image})`, height: 140 }} /> */}
      <Avatar
        src={avatar}
        size={80}
        radius={80}
        mx="auto"
        className={classes.avatar}
        onClick={() => window.open(`https://worldathletics.org/athletes/_/${entrant.id}`, '_blank')}
      />
      <Text align="center" size="lg" weight={500} mt="sm">
        {name}
      </Text>
      <Text align="center" size="sm" color="dimmed">
        {entrant.team ? `${entrant.team} (${job})` : job}
      </Text>
      <Group mt="md" position="center" spacing={30}>
        {items}
      </Group>
      <Button
        fullWidth
        disabled={!isOnTeam && (myTeam[meet]?.[event]?.length ?? 0) >= 2}
        radius="md"
        mt="xl"
        size="md"
        color={isOnTeam ? 'red' : undefined}
        onClick={() => {
          setMyTeam({
            ...myTeam,
            [meet]: {
              ...myTeam[meet],
              [event]: isOnTeam
                ? myTeam[meet]![event]?.filter((member) => member.id !== entrant.id)
                : [...(myTeam[meet]?.[event] ?? []), entrant],
            },
          });
        }}
      >
        {(() => {
          if (isOnTeam) return 'Remove from Team';
          if (team.length === 0) return 'Add as Primary';
          if (team.length === 1) return 'Add as Secondary';
          return 'Team Full';
        })()}
      </Button>
    </Card>
  );
}
