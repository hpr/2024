import { Avatar, Badge, Button, List, Loader, Paper, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { mantineGray, SERVER_URL } from './const';
import { DLMeet } from './types';
import Filter from 'badwords-filter';
import { Refresh } from 'tabler-icons-react';

export const Submissions = ({ meet }: { meet: DLMeet }) => {
  const [submissions, setSubmissions] = useState<{ id: number; name: string }[]>([]);
  const refreshSubmissions = async () => {
    setSubmissions([]);
    setSubmissions(
      await (
        await fetch(SERVER_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'getSubmissions',
            meet,
          }),
        })
      ).json()
    );
  };
  useEffect(() => {
    refreshSubmissions();
  }, []);
  const filter = new Filter();
  return (
    <Paper withBorder p="xl">
      <Stack align="center">
        <Button color={mantineGray} variant="outline" onClick={refreshSubmissions}>
          <Refresh />
        </Button>
        {!submissions.length && <Loader />}
        <List>
          {submissions.map(({ id, name }) => (
            <List.Item
              key={id}
              icon={
                <Avatar size="sm" radius="xl" style={{ border: `1px solid ${mantineGray}` }}>
                  {name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? '')
                    .join('')}
                </Avatar>
              }
            >
              {filter.clean(name)} <Badge size="sm">#{id}</Badge>
            </List.Item>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};
