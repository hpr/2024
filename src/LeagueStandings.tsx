import { Timeline, Text, Paper, Title } from '@mantine/core';
import { GitBranch, GitPullRequest, GitCommit, MessageDots } from 'tabler-icons-react';

function LeagueStandings() {
  return (
    <Paper withBorder p="lg">
      <Paper withBorder p="lg" mb="lg" style={{ textAlign: 'center' }}>
        <Title order={2}>League Standings</Title>
      </Paper>
      <Timeline active={1} bulletSize={24} lineWidth={2}>
        <Timeline.Item bullet={<GitBranch size={12} />} title="Doha">
          <Text color="dimmed" size="sm">
            <ol>
              <li>test</li>
              <li>2nd</li>
            </ol>
          </Text>
          <Text size="xs" mt={4}>
            May 5, 2023
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<GitBranch size={12} />} title="Rabat">
          <Text color="dimmed" size="sm">
            <ol>
              <li>test</li>
              <li>2nd</li>
            </ol>
          </Text>
          <Text size="xs" mt={4}>
            May 5, 2023
          </Text>
        </Timeline.Item>

        <Timeline.Item title="Pull request" bullet={<GitPullRequest size={12} />} lineVariant="dashed">
          <Text color="dimmed" size="sm">
            You&apos;ve submitted a pull request
            <Text variant="link" component="span" inherit>
              Fix incorrect notification message (#187)
            </Text>
          </Text>
          <Text size="xs" mt={4}>
            34 minutes ago
          </Text>
        </Timeline.Item>

        <Timeline.Item title="Code review" bullet={<MessageDots size={12} />}>
          <Text color="dimmed" size="sm">
            <Text variant="link" component="span" inherit>
              Robert Gluesticker
            </Text>{' '}
            left a code review on your pull request
          </Text>
          <Text size="xs" mt={4}>
            12 minutes ago
          </Text>
        </Timeline.Item>
      </Timeline>
    </Paper>
  );
}

export default LeagueStandings;
