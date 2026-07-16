import { Input } from '@pega/cosmos-react-core';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LabbLtdExtensionsConversationalForm from './index';

const meta: Meta<typeof LabbLtdExtensionsConversationalForm> = {
  title: 'templates/Conversational Form',
  component: LabbLtdExtensionsConversationalForm,
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsConversationalForm>;

// a tiny stand-in for the Constellation store: field values live here between renders
const answers: Record<string, string> = {};

const propertyKey = (value: string) => value.replace('@P .', '');

const templateMetadata = {
  type: 'LabbLtd_Extensions_ConversationalForm',
  config: { inheritedProps: [] },
  children: [
    {
      name: 'A',
      type: 'Region',
      children: [
        { type: 'TextInput', config: { label: 'What is your first name?', value: '@P .FirstName', required: true } },
        { type: 'TextInput', config: { label: 'And your last name?', value: '@P .LastName', required: true } },
        {
          type: 'Email',
          config: { label: 'Which email address can we reach you on?', value: '@P .Email', required: true },
        },
        {
          type: 'TextInput',
          config: { label: 'Anything else we should know?', value: '@P .Remarks', required: false },
        },
      ],
    },
  ],
};

const MockField = ({ fieldMeta }: { fieldMeta: any }) => {
  const key = propertyKey(fieldMeta.config.value);
  return (
    <Input
      label={fieldMeta.config.label}
      type={fieldMeta.type === 'Email' ? 'email' : 'text'}
      defaultValue={answers[key] ?? ''}
      data-testid={`mock-${key}`}
      onChange={(event: any) => {
        answers[key] = event.target.value;
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => {
    const props = {
      getPConnect: () => ({
        getRawMetadata: () => templateMetadata,
        resolveConfigProps: (config: any) => ({ ...config, value: answers[propertyKey(config.value)] ?? '' }),
        getInheritedProps: () => ({}),
        getLocalizedValue: (value: string) => value,
        createComponent: (fieldMeta: any) => <MockField fieldMeta={fieldMeta} />,
      }),
    };

    return <LabbLtdExtensionsConversationalForm {...props} {...args} />;
  },
  args: {
    label: 'Tell us about yourself',
    showLabel: true,
    nextLabel: 'Next',
    completionMessage: 'That is everything. Review your answers above, then submit.',
  },
};
