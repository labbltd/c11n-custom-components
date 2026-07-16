import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LabbLtdExtensionsCheckYourAnswers from './index';

const meta: Meta<typeof LabbLtdExtensionsCheckYourAnswers> = {
  title: 'templates/Check Your Answers',
  component: LabbLtdExtensionsCheckYourAnswers,
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsCheckYourAnswers>;

const navigationSteps = [
  { ID: 'YourDetails_AssignmentSF1', name: 'Your details', visited_status: 'success' },
  { ID: 'ContactDetails_AssignmentSF2', name: 'Contact details', visited_status: 'success' },
  { ID: 'Payment_AssignmentSF3', name: 'Payment', visited_status: 'success' },
  { ID: 'Review_AssignmentSF4', name: 'Check your answers', visited_status: 'current' },
];

const templateMetadata = {
  type: 'LabbLtd_Extensions_CheckYourAnswers',
  config: { inheritedProps: [] },
  children: [
    {
      name: 'A',
      type: 'Region',
      children: [
        {
          type: 'Group',
          config: { label: 'Your details' },
          children: [
            { type: 'TextInput', config: { label: 'First name', value: 'Daniël' } },
            { type: 'TextInput', config: { label: 'Last name', value: 'de Vries' } },
            { type: 'Date', config: { label: 'Date of birth', value: '12 March 1987' } },
          ],
        },
        {
          type: 'Group',
          config: { label: 'Contact details' },
          children: [
            { type: 'Email', config: { label: 'Email address', value: 'daniel.devries@example.nl' } },
            { type: 'Phone', config: { label: 'Phone number', value: '+31 6 12345678' } },
            { type: 'TextInput', config: { label: 'Postcode', value: '1234 AB' } },
          ],
        },
        {
          type: 'Group',
          config: { label: 'Payment' },
          children: [
            { type: 'TextInput', config: { label: 'IBAN', value: 'NL91 ABNA 0417 1643 00' } },
            { type: 'TextInput', config: { label: 'Account holder', value: '' } },
          ],
        },
      ],
    },
  ],
};

const setPCore = () => {
  (window as any).PCore = {
    getConstants: () => ({
      CASE_INFO: {
        NAVIGATION: 'caseInfo.navigation',
      },
    }),
  } as unknown as typeof PCore;
};

export const Default: Story = {
  render: (args) => {
    setPCore();
    const props = {
      getPConnect: () => ({
        getRawMetadata: () => templateMetadata,
        resolveConfigProps: (config: any) => config,
        getInheritedProps: () => ({}),
        getValue: (key: string) => (key === 'caseInfo.navigation' ? { steps: navigationSteps } : undefined),
        getContextName: () => 'app/primary_1/workarea_1',
        getLocalizedValue: (value: string) => value,
        getActionsApi: () => ({
          navigateToStep: (stepID: string, containerItemID: string) => {
            alert(`navigateToStep("${stepID}", "${containerItemID}")`);
            return Promise.resolve({});
          },
        }),
      }),
    };

    return <LabbLtdExtensionsCheckYourAnswers {...props} {...args} />;
  },
  args: {
    label: 'Check your answers',
    showLabel: true,
    changeLabel: 'Change',
  },
};

export const WithoutGroups: Story = {
  render: (args) => {
    setPCore();
    const flatMetadata = {
      ...templateMetadata,
      children: [
        {
          name: 'A',
          type: 'Region',
          children: templateMetadata.children[0].children.flatMap((group: any) => group.children),
        },
      ],
    };
    const props = {
      getPConnect: () => ({
        getRawMetadata: () => flatMetadata,
        resolveConfigProps: (config: any) => config,
        getInheritedProps: () => ({}),
        getValue: () => ({ steps: navigationSteps }),
        getContextName: () => 'app/primary_1/workarea_1',
        getLocalizedValue: (value: string) => value,
        getActionsApi: () => ({
          navigateToStep: (stepID: string, containerItemID: string) => {
            alert(`navigateToStep("${stepID}", "${containerItemID}")`);
            return Promise.resolve({});
          },
        }),
      }),
    };

    return <LabbLtdExtensionsCheckYourAnswers {...props} {...args} />;
  },
  args: {
    label: 'Check your answers',
    showLabel: true,
    changeLabel: 'Change',
  },
};
