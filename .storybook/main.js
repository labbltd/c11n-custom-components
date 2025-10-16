/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  staticDirs: ['./static'],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5'
  },
  docs: {
    docsMode: true
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
};
export default config;
