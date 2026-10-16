import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '0 16px 16px',
});

export const description = style({
  fontSize: '14px',
  lineHeight: '22px',
  color: cssVar('textSecondaryColor'),
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const empty = style({
  fontSize: '13px',
  color: cssVar('textSecondaryColor'),
  padding: '8px 0',
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const itemInputs = style({
  display: 'flex',
  flex: 1,
  gap: '8px',
});

export const actions = style({
  display: 'flex',
  gap: '8px',
  marginTop: '8px',
});
