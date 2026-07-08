
/* eslint-disable react/jsx-no-useless-fragment */
import type { Meta, StoryObj } from '@storybook/react';

import LabbLtdExtensionsBarclaysPayment from './index';
import { configProps, fieldMetadata, stateProps } from './mock';

const meta: Meta<typeof LabbLtdExtensionsBarclaysPayment> = {
  title: 'fields/Barclays Payment',
  component: LabbLtdExtensionsBarclaysPayment
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsBarclaysPayment>;

export const BaseLabbLtdExtensionsBarclaysPayment: Story = (args: any) => {
  let count = 0;
  window.PCore = {
    getDataPageUtils: () => {
      return {
        getPageDataAsync: () => {
          console.log('getPageDataAsync', count);
          return Promise.resolve(count++ < 4 ? {
            'Status': 'PENDING'
          } : {
            'Status': 'DONE',
            'PaymentStatus': 'CAPTURED'
          });
        }
      };
    },
    getActionsSequencer: () => {
      return {
        registerBlockingAction: (contextName: string) => Promise.resolve(),
        deRegisterBlockingAction: (contextName: string) => Promise.resolve()
      };
    }
  } as unknown as any;
  const props = {
    fieldMetadata,
    getPConnect: () => {
      return {
        getContextName: () => 'app/primary_1/workarea_1',
        getStateProps: () => {
          return stateProps;
        },
        getActionsApi: () => {
          return {
            updateFieldValue: () => {/* nothing */ },
            triggerFieldChange: () => {/* nothing */ }
          };
        },
        ignoreSuggestion: () => {/* nothing */ },
        acceptSuggestion: () => {/* nothing */ },
        setInheritedProps: () => {/* nothing */ },
        resolveConfigProps: () => {/* nothing */ }
      };
    }
  };

  return (
    <>
      <LabbLtdExtensionsBarclaysPayment {...props} {...args} />
    </>
  );
};

BaseLabbLtdExtensionsBarclaysPayment.args = configProps;
