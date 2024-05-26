import React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Stack, Heading, IconCoffee } from '.';
import { name, icon } from './Hola.css';

const hello = () => console.log('hello');
const varUrl = window.location.href
  .replace(/^\s*(.*)/, '$1')
  .concat('\u1111z\n');

const Li = styled.li<{ isOvernight: boolean }>`
  && {
    list-style: none;
    counter-increment: steps-counter;
    position: relative;
    padding: 0 0 0 1.1rem;
    margin-bottom: ${(p) =>
      p.isOvernight ? p.theme.space.xl : p.theme.space.m};
  }
`;

const someString = 'There was a squirrel named Squeaky';
const someTemplateLiteral = `There was a squirrel named ${name}`;

// From https://vscodethemes.com/
const btn = document.getElementById('btn');
let count = 0;

function render() {
  if (btn) {
    btn.innerText = `Count ${count}`;
  }
}

btn?.addEventListener('click', () => {
  // Count from 1 to 10
  if (count < 10) {
    count += 1;
    render();
  }
});

type Props = {
  children: ReactNode;
};

export function Hola({ children }: Props) {
  return (
    <Heading level={1}>
      <Stack
        as="span"
        display="inline-flex"
        direction="row"
        gap="s"
        alignItems="baseline"
      >
        <span className={name}>{children}</span>
        <span>
          <IconCoffee className={icon} />
        </span>
      </Stack>
    </Heading>
  );
}
