import { List } from '@mantine/core';
import { useEffect, useState } from 'react';
import { SERVER_URL } from './const';
import { DLMeet } from './types';

export const Submissions = ({ meet }: { meet: DLMeet }) => {
  const [submissions, setSubmissions] = useState<{ id: number, name: string }[]>([]);
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
  return (
    <List>
      {submissions.map(({ id, name }) => (
        <List.Item>{name} (#{id})</List.Item>
      ))}
    </List>
  );
};
