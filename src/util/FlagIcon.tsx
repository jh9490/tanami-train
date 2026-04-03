import React from 'react';
import { Image } from 'react-native';

export default function FlagIcon({ iso, size = 18 }: { iso: string; size?: number }) {
  const code = iso.toLowerCase(); // e.g., 'sy'
  // 24px height looks crisp; pick a small size so lists stay light
  const uri = `https://flagcdn.com/24x18/${code}.png`;
  return (
    <Image
      source={{ uri }}
      style={{ width: size * (24/18), height: size, borderRadius: 2 }}
      resizeMode="cover"
    />
  );
}