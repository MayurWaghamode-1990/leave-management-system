import React from 'react';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'white' | 'primary';
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'medium',
  color = 'default'
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return {
        fontSize: '1rem',
        iconSize: 24,
        mainText: '1.1rem',
        subText: '0.85rem',
        spacing: 1
      };
      case 'large': return {
        fontSize: '2.2rem',
        iconSize: 48,
        mainText: '2.8rem',
        subText: '2rem',
        spacing: 2
      };
      default: return {
        fontSize: '1.6rem',
        iconSize: 32,
        mainText: '2rem',
        subText: '1.4rem',
        spacing: 1.5
      };
    }
  };

  const getColors = () => {
    switch (color) {
      case 'white': return { primary: '#FFFFFF', secondary: '#FFFFFF', accent: '#FF4444' };
      case 'primary': return { primary: '#1976d2', secondary: '#1976d2', accent: '#FF4444' };
      default: return { primary: '#2D5A3D', secondary: '#2D5A3D', accent: '#E53935' };
    }
  };

  const { fontSize, iconSize, mainText, subText, spacing } = getSize();
  const { primary, secondary, accent } = getColors();

  const ArrowIcon = () => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        mx: spacing * 0.8,
        position: 'relative'
      }}
    >
      <svg
        width={iconSize}
        height={iconSize * 0.6}
        viewBox="0 0 60 24"
        fill="none"
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))' }}
      >
        {/* Triple chevron arrows */}
        <path
          d="M4 6L12 12L4 18L6 20L16 12L6 4L4 6Z"
          fill={accent}
        />
        <path
          d="M20 6L28 12L20 18L22 20L32 12L22 4L20 6Z"
          fill={accent}
        />
        <path
          d="M36 6L44 12L36 18L38 20L48 12L38 4L36 6Z"
          fill={accent}
        />
      </svg>
    </Box>
  );

  if (variant === 'icon') {
    return <ArrowIcon />;
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize,
            color: primary,
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            letterSpacing: '1px',
            textShadow: '0px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          GO-LIVE
        </Typography>
        <ArrowIcon />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize,
            color: primary,
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            letterSpacing: '1px',
            textShadow: '0px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          FASTER
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing * 0.3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: mainText,
            color: primary,
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            lineHeight: 1
          }}
        >
          GO-LIVE
        </Typography>
        <ArrowIcon />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: mainText,
            color: primary,
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            lineHeight: 1
          }}
        >
          FASTER
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: subText,
          color: secondary,
          fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          textAlign: 'center',
          textShadow: '0px 1px 2px rgba(0,0,0,0.1)',
          lineHeight: 1,
          mt: -0.5
        }}
      >
        CRMS
      </Typography>
    </Box>
  );
};

export default Logo;