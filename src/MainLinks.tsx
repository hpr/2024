import React, { MouseEventHandler } from 'react';
import { GitPullRequest, AlertCircle, Messages, Database } from 'tabler-icons-react';
import { ThemeIcon, UnstyledButton, Group, Text } from '@mantine/core';

interface MainLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  onClick?: MouseEventHandler;
}

function MainLink({ icon, color, label, onClick = () => {} }: MainLinkProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>

        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const data = [
  { icon: <GitPullRequest size={16} />, color: 'blue', label: 'Pull Requests' },
  { icon: <AlertCircle size={16} />, color: 'teal', label: 'Open Issues' },
  { icon: <Messages size={16} />, color: 'violet', label: 'Discussions' },
  { icon: <Database size={16} />, color: 'grape', label: 'Databases' },
];

type MainLinksProps = {
  links?: {
    icon: JSX.Element;
    color: string;
    label: string;
    onClick?: MouseEventHandler;
  }[];
};

export function MainLinks({ links = data }: MainLinksProps) {
  return (
    <div>
      {links.map((link) => (
        <MainLink {...link} key={link.label} />
      ))}
    </div>
  );
}
