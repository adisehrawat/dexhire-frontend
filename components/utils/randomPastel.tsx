import { useMemo } from 'react';

const pastelPalette = [
  '#FFE5E5', '#FFF2E5', '#FFFBE5', '#E8FFE5',
  '#E5F3FF', '#F5E5FF', '#FFE5F1', '#E5FFF5',
];

export const randomPastel = () =>
  pastelPalette[Math.floor(Math.random() * pastelPalette.length)];