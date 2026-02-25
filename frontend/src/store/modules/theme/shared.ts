import type { GlobalThemeOverrides } from 'naive-ui';
import { defu } from 'defu';
import { addColorAlpha, getColorPalette, getPaletteColorByNumber, getRgb } from '@sa/color';
import { DARK_CLASS } from '@/constants/app';
import { toggleHtmlClass } from '@/utils/common';
import { localStg } from '@/utils/storage';
import { overrideThemeSettings, themeSettings } from '@/theme/settings';
import { themeVars } from '@/theme/vars';

/** Init theme settings */
export function initThemeSettings() {
  const isProd = import.meta.env.PROD;

  // if it is development mode, the theme settings will not be cached, by update `themeSettings` in `src/theme/settings.ts` to update theme settings
  if (!isProd) return themeSettings;

  // if it is production mode, the theme settings will be cached in localStorage
  // if want to update theme settings when publish new version, please update `overrideThemeSettings` in `src/theme/settings.ts`

  const localSettings = localStg.get('themeSettings');

  let settings = defu(localSettings, themeSettings);

  const isOverride = localStg.get('overrideThemeFlag') === BUILD_TIME;

  if (!isOverride) {
    settings = defu(overrideThemeSettings, settings);

    localStg.set('overrideThemeFlag', BUILD_TIME);
  }

  return settings;
}

/**
 * create theme token css vars value by theme settings
 *
 * @param colors Theme colors
 * @param tokens Theme setting tokens
 * @param [recommended=false] Use recommended color. Default is `false`
 */
export function createThemeToken(
  colors: App.Theme.ThemeColor,
  tokens?: App.Theme.ThemeSetting['tokens'],
  recommended = false
) {
  const paletteColors = createThemePaletteColors(colors, recommended);

  const { light, dark } = tokens || themeSettings.tokens;

  const themeTokens: App.Theme.ThemeTokenCSSVars = {
    colors: {
      ...paletteColors,
      nprogress: paletteColors.primary,
      ...light.colors
    },
    boxShadow: {
      ...light.boxShadow
    }
  };

  const darkThemeTokens: App.Theme.ThemeTokenCSSVars = {
    colors: {
      ...themeTokens.colors,
      ...dark?.colors
    },
    boxShadow: {
      ...themeTokens.boxShadow,
      ...dark?.boxShadow
    }
  };

  return {
    themeTokens,
    darkThemeTokens
  };
}

/**
 * Create theme palette colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function createThemePaletteColors(colors: App.Theme.ThemeColor, recommended = false) {
  const colorKeys = Object.keys(colors) as App.Theme.ThemeColorKey[];
  const colorPaletteVar = {} as App.Theme.ThemePaletteColor;

  colorKeys.forEach(key => {
    const colorMap = getColorPalette(colors[key], recommended);

    colorPaletteVar[key] = colorMap.get(500)!;

    colorMap.forEach((hex, number) => {
      colorPaletteVar[`${key}-${number}`] = hex;
    });
  });

  return colorPaletteVar;
}

/**
 * Get css var by tokens
 *
 * @param tokens Theme base tokens
 */
function getCssVarByTokens(tokens: App.Theme.BaseToken) {
  const styles: string[] = [];

  function removeVarPrefix(value: string) {
    return value.replace('var(', '').replace(')', '');
  }

  function removeRgbPrefix(value: string) {
    return value.replace('rgb(', '').replace(')', '');
  }

  for (const [key, tokenValues] of Object.entries(themeVars)) {
    for (const [tokenKey, tokenValue] of Object.entries(tokenValues)) {
      let cssVarsKey = removeVarPrefix(tokenValue);
      let cssValue = tokens[key][tokenKey];

      if (key === 'colors') {
        cssVarsKey = removeRgbPrefix(cssVarsKey);
        const { r, g, b } = getRgb(cssValue);
        cssValue = `${r} ${g} ${b}`;
      }

      styles.push(`${cssVarsKey}: ${cssValue}`);
    }
  }

  const styleStr = styles.join(';');

  return styleStr;
}

/**
 * Add theme vars to global
 *
 * @param tokens
 */
export function addThemeVarsToGlobal(tokens: App.Theme.BaseToken, darkTokens: App.Theme.BaseToken) {
  const cssVarStr = getCssVarByTokens(tokens);
  const darkCssVarStr = getCssVarByTokens(darkTokens);

  const css = `
    :root {
      ${cssVarStr}
    }
  `;

  const darkCss = `
    html.${DARK_CLASS} {
      ${darkCssVarStr}
    }
  `;

  const styleId = 'theme-vars';

  const style = document.querySelector(`#${styleId}`) || document.createElement('style');

  style.id = styleId;

  style.textContent = css + darkCss;

  document.head.appendChild(style);
}

/**
 * Toggle css dark mode
 *
 * @param darkMode Is dark mode
 */
export function toggleCssDarkMode(darkMode = false) {
  const { add, remove } = toggleHtmlClass(DARK_CLASS);

  if (darkMode) {
    add();
  } else {
    remove();
  }
}

/**
 * Toggle auxiliary color modes
 *
 * @param grayscaleMode
 * @param colourWeakness
 */
export function toggleAuxiliaryColorModes(grayscaleMode = false, colourWeakness = false) {
  const htmlElement = document.documentElement;
  htmlElement.style.filter = [grayscaleMode ? 'grayscale(100%)' : '', colourWeakness ? 'invert(80%)' : '']
    .filter(Boolean)
    .join(' ');
}

type NaiveColorScene = '' | 'Suppl' | 'Hover' | 'Pressed' | 'Active';
type NaiveColorKey = `${App.Theme.ThemeColorKey}Color${NaiveColorScene}`;
type NaiveThemeColor = Partial<Record<NaiveColorKey, string>>;
interface NaiveColorAction {
  scene: NaiveColorScene;
  handler: (color: string) => string;
}

/**
 * Get naive theme colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function getNaiveThemeColors(colors: App.Theme.ThemeColor, recommended = false) {
  const colorActions: NaiveColorAction[] = [
    { scene: '', handler: color => color },
    { scene: 'Suppl', handler: color => color },
    { scene: 'Hover', handler: color => getPaletteColorByNumber(color, 500, recommended) },
    { scene: 'Pressed', handler: color => getPaletteColorByNumber(color, 700, recommended) },
    { scene: 'Active', handler: color => addColorAlpha(color, 0.1) }
  ];

  const themeColors: NaiveThemeColor = {};

  const colorEntries = Object.entries(colors) as [App.Theme.ThemeColorKey, string][];

  colorEntries.forEach(color => {
    colorActions.forEach(action => {
      const [colorType, colorValue] = color;
      const colorKey: NaiveColorKey = `${colorType}Color${action.scene}`;
      themeColors[colorKey] = action.handler(colorValue);
    });
  });

  return themeColors;
}

/**
 * Get naive theme
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
export function getNaiveTheme(colors: App.Theme.ThemeColor, recommended = false) {
  const { primary: colorLoading } = colors;

  const theme: GlobalThemeOverrides = {
    common: {
      ...getNaiveThemeColors(colors, recommended),
      borderRadius: '8px',
      bodyColor: '#0a0e1a',
      cardColor: 'rgba(17, 24, 39, 0.6)',
      modalColor: 'rgba(17, 24, 39, 0.9)',
      popoverColor: 'rgba(17, 24, 39, 0.95)',
      tableColor: 'rgba(17, 24, 39, 0.4)',
      inputColor: 'rgba(17, 24, 39, 0.8)',
      actionColor: 'rgba(17, 24, 39, 0.6)',
      hoverColor: 'rgba(0, 212, 255, 0.08)',
      tableColorHover: 'rgba(0, 212, 255, 0.04)',
      tableColorStriped: 'rgba(0, 212, 255, 0.02)',
      borderColor: 'rgba(0, 212, 255, 0.12)',
      dividerColor: 'rgba(0, 212, 255, 0.08)',
      textColor1: '#e2e8f0',
      textColor2: '#cbd5e1',
      textColor3: '#64748b',
      placeholderColor: '#475569',
      iconColor: '#64748b',
      iconColorHover: '#00d4ff',
      clearColor: '#64748b',
      closeIconColor: '#64748b',
      closeIconColorHover: '#00d4ff'
    },
    LoadingBar: {
      colorLoading
    },
    Tag: {
      borderRadius: '6px'
    },
    Button: {
      borderRadiusMedium: '8px',
      borderRadiusSmall: '6px',
      borderRadiusLarge: '10px'
    },
    Card: {
      borderRadius: '12px',
      borderColor: 'rgba(0, 212, 255, 0.1)',
      color: 'rgba(17, 24, 39, 0.6)',
      titleFontWeight: '600',
      titleTextColor: '#e2e8f0'
    },
    Input: {
      color: 'rgba(17, 24, 39, 0.8)',
      colorFocus: 'rgba(17, 24, 39, 0.9)',
      border: '1px solid rgba(100, 116, 139, 0.3)',
      borderHover: '1px solid rgba(0, 212, 255, 0.4)',
      borderFocus: '1px solid rgba(0, 212, 255, 0.6)',
      boxShadowFocus: '0 0 15px rgba(0, 212, 255, 0.15)',
      caretColor: '#00d4ff',
      borderRadius: '8px',
      placeholderColor: '#475569',
      textColor: '#e2e8f0'
    },
    DataTable: {
      thColor: 'rgba(0, 212, 255, 0.06)',
      tdColor: 'transparent',
      tdColorHover: 'rgba(0, 212, 255, 0.04)',
      tdColorStriped: 'rgba(0, 212, 255, 0.02)',
      thTextColor: '#64748b',
      tdTextColor: '#cbd5e1',
      borderColor: 'rgba(0, 212, 255, 0.06)',
      borderRadius: '12px'
    },
    Menu: {
      itemTextColor: '#64748b',
      itemTextColorHover: '#00d4ff',
      itemTextColorActive: '#00d4ff',
      itemTextColorActiveHover: '#00d4ff',
      itemTextColorChildActive: '#00d4ff',
      itemTextColorChildActiveHover: '#00d4ff',
      itemIconColor: '#64748b',
      itemIconColorHover: '#00d4ff',
      itemIconColorActive: '#00d4ff',
      itemIconColorActiveHover: '#00d4ff',
      itemIconColorChildActive: '#00d4ff',
      itemIconColorChildActiveHover: '#00d4ff',
      itemColorHover: 'rgba(0, 212, 255, 0.06)',
      itemColorActive: 'rgba(0, 212, 255, 0.1)',
      itemColorActiveHover: 'rgba(0, 212, 255, 0.12)',
      arrowColor: '#64748b',
      arrowColorHover: '#00d4ff',
      arrowColorActive: '#00d4ff',
      arrowColorActiveHover: '#00d4ff',
      arrowColorChildActive: '#00d4ff',
      arrowColorChildActiveHover: '#00d4ff',
      borderRadius: '8px'
    },
    Tabs: {
      tabTextColorActiveLine: '#00d4ff',
      tabTextColorHoverLine: '#00d4ff',
      barColor: '#00d4ff'
    },
    Dialog: {
      color: 'rgba(17, 24, 39, 0.95)',
      textColor: '#e2e8f0',
      borderRadius: '12px'
    },
    Form: {
      labelTextColor: '#94a3b8'
    },
    Popover: {
      color: 'rgba(17, 24, 39, 0.95)',
      textColor: '#e2e8f0',
      borderRadius: '8px'
    },
    Tooltip: {
      color: 'rgba(17, 24, 39, 0.95)',
      textColor: '#e2e8f0',
      borderRadius: '6px'
    },
    Notification: {
      color: 'rgba(17, 24, 39, 0.95)',
      textColor: '#e2e8f0',
      borderRadius: '12px'
    },
    Dropdown: {
      color: 'rgba(17, 24, 39, 0.95)',
      optionTextColor: '#cbd5e1',
      optionTextColorHover: '#00d4ff',
      optionColorHover: 'rgba(0, 212, 255, 0.08)',
      borderRadius: '8px'
    },
    Pagination: {
      itemTextColor: '#64748b',
      itemTextColorHover: '#00d4ff',
      itemTextColorActive: '#00d4ff',
      itemBorderRadius: '6px'
    },
    Progress: {
      railColor: 'rgba(0, 212, 255, 0.1)',
      textColorLineInner: '#fff'
    },
    DatePicker: {
      panelColor: 'rgba(17, 24, 39, 0.95)',
      panelTextColor: '#e2e8f0',
      itemTextColor: '#cbd5e1',
      itemTextColorActive: '#fff',
      panelHeaderDividerColor: 'rgba(0, 212, 255, 0.1)',
      calendarDaysDividerColor: 'rgba(0, 212, 255, 0.06)',
      arrowColor: '#64748b',
      borderRadius: '8px'
    },
    Scrollbar: {
      color: 'rgba(0, 212, 255, 0.2)',
      colorHover: 'rgba(0, 212, 255, 0.35)',
      borderRadius: '3px',
      width: '6px',
      height: '6px'
    }
  };

  return theme;
}
