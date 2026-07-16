import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LabbLtdExtensionsNetworkStatus from './index';

const meta: Meta<typeof LabbLtdExtensionsNetworkStatus> = {
  title: 'fields/Network Status',
  component: LabbLtdExtensionsNetworkStatus,
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsNetworkStatus>;

export const Default: Story = {
  render: (args) => <LabbLtdExtensionsNetworkStatus {...args} />,
  args: {
    restoredDuration: 0,
    brokenInternetMessage: 'Internet connection has been broken',
    restoredInternetMessage: 'Internet connection has been restored',
  },
};
