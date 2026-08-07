import {execSync} from 'node:child_process';
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
const gitDate = execSync('git log -1 --format=%cs HEAD').toString().trim();

const config: Config = {
  title: 'My Learning Journey',
  tagline: 'Courses, experiments, and notes from things I am learning',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://nimatrueway.github.io',
  baseUrl: '/my-learning-journey/',
  organizationName: 'nimatrueway',
  projectName: 'my-learning-journey',
  trailingSlash: false,
  onBrokenLinks: 'throw',

  clientModules: [require.resolve('./src/client/shortcuts.ts')],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          {tagName: 'link', rel: 'manifest', href: '/my-learning-journey/manifest.json'},
          {tagName: 'meta', name: 'theme-color', content: '#161923'},
          {tagName: 'link', rel: 'apple-touch-icon', href: '/my-learning-journey/img/apple-touch-icon.png'},
          {tagName: 'meta', name: 'apple-mobile-web-app-capable', content: 'yes'},
          {tagName: 'meta', name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
        ],
      },
    ],
  ],

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Source+Code+Pro:wght@400;600&display=swap',
      type: 'text/css',
    },
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css',
      type: 'text/css',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'my-learning-journey',
      logo: {
        alt: 'My Learning Journey',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/', label: 'Courses', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'journeySidebar',
          label: 'Browse lessons',
          position: 'left',
        },
        {
          href: 'https://github.com/nimatrueway/my-learning-journey',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'html',
          position: 'right',
          value: '<button class="navbarKbdBtn" id="kbd-guide-btn" type="button" title="Keyboard shortcuts (?)">⌨</button>',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'All courses', to: '/'},
            {label: '😼 Deep Learning', to: '/courses/deep-learning/'},
            {
              label: '⚡ Performance Foundations',
              to: '/courses/performance-foundations/',
            },
          ],
        },
        {
          title: 'Source',
          items: [
            {
              label: 'GitHub repository',
              href: 'https://github.com/nimatrueway/my-learning-journey',
            },
          ],
        },
      ],
      copyright: `<span class="footerPrompt">nima@github:~/my-learning-journey$</span> git log -1 → <a href="https://github.com/nimatrueway/my-learning-journey/commit/${gitCommit}">${gitCommit}</a> · deployed ${gitDate} · © ${new Date().getFullYear()} · press <kbd>?</kbd> for shortcuts`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;