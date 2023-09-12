import React, { MouseEventHandler } from 'react';
import { ThemeIcon, UnstyledButton, Group, Text, Divider } from '@mantine/core';
import { DIVIDER } from './const';
import { useLocation } from 'react-router-dom';

interface MainLinkProps {
  icon: React.ReactNode;
  path: string;
  color: string;
  label: string | JSX.Element;
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

type MainLinksProps = {
  links?: (
    | {
        icon: JSX.Element;
        color: string;
        path: string;
        label: string | JSX.Element;
        onClick?: MouseEventHandler;
      }
    | 'divider'
  )[];
};

export function MainLinks({ links = [] }: MainLinksProps) {
  return (
    <div>
      {links.map((link, i) =>
        link === DIVIDER ? <Divider key={i} my="lg" /> : <MainLink {...link} key={link.path} />
      )}
    </div>
  );
}
