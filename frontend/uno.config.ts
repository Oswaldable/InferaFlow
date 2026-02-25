import { defineConfig } from '@unocss/vite';
import transformerDirectives from '@unocss/transformer-directives';
import transformerVariantGroup from '@unocss/transformer-variant-group';
import presetWind3 from '@unocss/preset-wind3';
import type { Theme } from '@unocss/preset-uno';
import { presetSoybeanAdmin } from '@sa/uno-preset';
import { themeVars } from './src/theme/vars';

export default defineConfig<Theme>({
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist']
    }
  },
  theme: {
    ...themeVars,
    fontSize: {
      'icon-xs': '0.875rem',
      'icon-small': '1rem',
      icon: '1.125rem',
      'icon-large': '1.5rem',
      'icon-xl': '2rem'
    }
  },
  shortcuts: {
    'card-wrapper': 'rd-12px border-1 border-solid border-[rgba(0,212,255,0.1)] bg-[rgba(17,24,39,0.6)] backdrop-blur-16',
    'flex-cc': 'flex items-center justify-center',
    'tech-glass': 'bg-[rgba(17,24,39,0.6)] backdrop-blur-16 border-1 border-solid border-[rgba(0,212,255,0.1)] rd-12px',
    'tech-text-gradient': 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent'
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  presets: [presetWind3({ dark: 'class' }), presetSoybeanAdmin()]
});
