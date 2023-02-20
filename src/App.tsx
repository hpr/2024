import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { AthleteCard } from './AthleteCard';
import { DLMeet, Entries } from './types';

export default function App() {
  const [entries, setEntries] = useState<Entries | null>(null);
  const [meet] = useState<DLMeet>('doha');

  useEffect(() => {
    (async () => {
      setEntries(await (await fetch('entries.json')).json());
    })();
  }, []);

  return (
    <Stack align="center" mt={50}>
      <Text size="xl" weight={500}>
        Fantasy DL
      </Text>
      <SimpleGrid cols={5} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        {entries &&
          entries[meet]!['200m Men']?.map(({ id, firstName, lastName, pb, sb }) => (
            <AthleteCard
              key={id}
              avatar={`img/avatars/${id}_128x128.png`}
              name={`${firstName} ${lastName}`}
              job="200m"
              stats={[
                { label: 'PB', value: pb! },
                { label: 'SB', value: sb! },
              ].filter((x) => x.value)}
            />
          ))}
      </SimpleGrid>
    </Stack>
  );
}
