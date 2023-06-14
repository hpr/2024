import React, { MouseEventHandler } from 'react';
import { GitPullRequest, AlertCircle, Messages, Database } from 'tabler-icons-react';
import { ThemeIcon, UnstyledButton, Group, Text, Divider } from '@mantine/core';
import { DIVIDER } from './const';
import { useLocation } from 'react-router-dom';

interface MainLinkProps {
  icon: React.ReactNode;
  path: string;
  color: string;
  label: string;
  onClick?: MouseEventHandler;
}

function MainLink({ icon, color, path, label, onClick = () => {} }: MainLinkProps) {
  const { pathname } = useLocation();
  const hash = decodeURIComponent(pathname.slice(1));
  return (
    <UnstyledButton
      onClick={onClick}
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        backgroundColor: path === hash ? theme.colors.dark[6] : undefined,
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
  links?: (
    | {
        icon: JSX.Element;
        color: string;
        label: string;
        onClick?: MouseEventHandler;
      }
    | 'divider'
  )[];
};

export function MainLinks({ links = data }: MainLinksProps) {
  return (
    <div>
      {links.map((link, i) =>
        link === DIVIDER ? <Divider key={i} my="lg" /> : <MainLink {...link} key={link.label} />
      )}
    </div>
  );
}
