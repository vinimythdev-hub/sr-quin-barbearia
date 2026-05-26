import { Platform } from 'react-native';

export const FONT_DISPLAY = Platform.OS === 'ios' ? 'Didot' : 'serif';
export const FONT_BODY = Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-light';
export const FONT_MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

// Bauhaus Organic Color Theme Constants
export const COLOR_BG_BASE = '#11100f';
export const COLOR_BG_CARD = '#181615';
export const COLOR_BORDER = '#2c2826';
export const COLOR_GOLD = '#d4af37';
