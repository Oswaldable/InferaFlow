/** Default theme settings */
export const themeSettings: App.Theme.ThemeSetting = {
  themeScheme: 'dark',
  grayscale: false,
  colourWeakness: false,
  recommendColor: false,
  themeColor: '#00d4ff',
  otherColor: { info: '#00d4ff', success: '#00ff88', warning: '#ffaa00', error: '#ff3366' },
  isInfoFollowPrimary: true,
  resetCacheStrategy: 'close',
  layout: { mode: 'vertical', scrollMode: 'content', reverseHorizontalMix: false },
  page: { animate: true, animateMode: 'fade-slide' },
  header: { height: 56, breadcrumb: { visible: false, showIcon: true }, multilingual: { visible: false } },
  tab: { visible: false, cache: true, height: 44, mode: 'chrome' },
  fixedHeaderAndTab: true,
  sider: {
    inverted: false,
    width: 200,
    collapsedWidth: 64,
    mixWidth: 90,
    mixCollapsedWidth: 64,
    mixChildMenuWidth: 200
  },
  footer: { visible: false, fixed: false, height: 48, right: true },
  watermark: { visible: false, text: 'InferaFlow' },
  tokens: {
    light: {
      colors: {
        container: 'rgb(17, 24, 39)',
        layout: 'rgb(10, 14, 26)',
        inverted: 'rgb(0, 212, 255)',
        'base-text': 'rgb(226, 232, 240)'
      },
      boxShadow: {
        header: '0 1px 2px rgba(0, 0, 0, 0.3)',
        sider: '2px 0 8px 0 rgba(0, 0, 0, 0.3)',
        tab: '0 1px 2px rgba(0, 0, 0, 0.3)'
      }
    },
    dark: {
      colors: {
        container: 'rgb(17, 24, 39)',
        layout: 'rgb(10, 14, 26)',
        'base-text': 'rgb(226, 232, 240)'
      },
      boxShadow: {
        header: '0 1px 2px rgba(0, 0, 0, 0.5)',
        sider: '2px 0 8px 0 rgba(0, 0, 0, 0.5)',
        tab: '0 1px 2px rgba(0, 0, 0, 0.5)'
      }
    }
  }
};

/**
 * Override theme settings
 *
 * If publish new version, use `overrideThemeSettings` to override certain theme settings
 */
export const overrideThemeSettings: Partial<App.Theme.ThemeSetting> = {};
