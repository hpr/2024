import { Avatar, List, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';
import { SERVER_URL } from './const';
import { DLMeet } from './types';
import Filter from 'badwords-filter';

export const Submissions = ({ meet }: { meet: DLMeet }) => {
  const [submissions, setSubmissions] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    (async () => {
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
    })();
  }, []);
  const filter = new Filter();
  return (
    <Paper withBorder p="xl">
      <List>
        {submissions.map(({ id, name }) => (
          <List.Item
            icon={
              <Avatar size="sm" radius="xl">
                {name
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join('')}
              </Avatar>
            }
          >
            {filter.clean(name)} (#{id})
          </List.Item>
        ))}
      </List>
    </Paper>
  );
};
