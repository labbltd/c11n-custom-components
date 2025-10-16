/* eslint-disable react/jsx-no-useless-fragment */
import type { Meta, StoryObj } from '@storybook/react';

import LabbLtdExtensionsNetworkStatus from './index';

const meta: Meta<typeof LabbLtdExtensionsNetworkStatus> = {
  title: 'fields/Network Status',
  component: LabbLtdExtensionsNetworkStatus
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsNetworkStatus>;

export const Default: Story = (args: any) => {
  return <LabbLtdExtensionsNetworkStatus  {...args} />;
};

Default.args = {
  restoredDuration: 0,
  brokenInternetMessage: "Internet connection has been broken",
  restoredInternetMessage: "Internet connection has been restored"
};
