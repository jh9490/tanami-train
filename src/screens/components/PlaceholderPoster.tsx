import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Rect, Polygon, Image as SvgImage } from 'react-native-svg';

const GREEN = '#0f4f30';
const GOLD  = '#9b8a63';

type Props = {
  width: number;
  height: number;
  style?: ViewStyle;
};

/**
 * A simple branded placeholder:
 * - green background
 * - gold corner accent (bottom-left → right)
 * - centered logo (from PNG)
 */
export default function PlaceholderPoster({ width, height, style }: Props) {
  const logo = require('../../assets/logo3.png'); // adjust path if different

  return (
    <Svg width={width} height={height} style={style}>
      {/* background */}
      <Rect x="0" y="0" width={width} height={height} fill={GREEN} />

      {/* gold accent triangle on the right side */}
      <Polygon
        points={`${width*0.82},0 ${width},0 ${width},${height} ${width*0.94},${height}`}
        fill={GOLD}
        opacity={0.95}
      />

      {/* centered logo */}
      <SvgImage
        href={logo}
        x={width * 0.2}
        y={height * 0.2}
        width={width * 0.6}
        height={height * 0.6}
        preserveAspectRatio="xMidYMid meet"
        opacity={0.9}
      />
    </Svg>
  );
}
