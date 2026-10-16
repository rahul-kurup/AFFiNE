import { bodyRegular, footnoteRegular } from '@toeverything/theme/typography';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const content = style({
  padding: '24px 16px 96px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const description = style([
  footnoteRegular,
  {
    color: cssVarV2('text/tertiary'),
    padding: '0 4px',
  },
]);

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const itemInputs = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 8,
});

export const empty = style([
  bodyRegular,
  {
    color: cssVarV2('text/tertiary'),
    textAlign: 'center',
    padding: '24px 0',
  },
]);

export const actions = style({
  display: 'flex',
  gap: 8,
});
