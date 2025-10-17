
/* eslint-disable react/jsx-no-useless-fragment */
import type { Meta, StoryObj } from '@storybook/react';

import LabbLtdExtensionsMobileFileUpload from './index';

const meta: Meta<typeof LabbLtdExtensionsMobileFileUpload> = {
  title: 'fields/Mobile File Upload',
  component: LabbLtdExtensionsMobileFileUpload
};

export default meta;
type Story = StoryObj<typeof LabbLtdExtensionsMobileFileUpload>;
const configProps = {
  value: null,
  capture: 'user',
  accept: 'image/*',
  extensions: '.png, .jpg, .jpeg',
  label: 'Retry File Upload',
  placeholder: 'TextInput Placeholder',
  helperText: 'TextInput Helper Text',
  multiple: true,
  testId: 'TextInput-12345678',
  hasSuggestions: false,
  displayMode: '',
  variant: '',
  hideLabel: false,
  readOnly: false,
  required: false,
  disabled: false,
  status: '',
  validatemessage: ''
};
window.PCore = {
  getEnvironmentInfo: () => ({
    environmentInfoObject: {},
    getMaxAttachmentSize: () => 1
  }),
  getActionsSequencer: () => ({
    registerBlockingAction: () => Promise.resolve(),
    deRegisterBlockingAction: () => Promise.resolve(),
    cancelDeferredActionsOnError: () => Promise.resolve()
  }),
  getStore: () => ({
    subscribe: (fn: Function) => fn()
  }),
  getStateUtils: () => ({
    updateState: () => { }
  }),
  getStoreValue: () => ([
    {
      props: {
        error: true
      }
    }
  ]),
  getAttachmentUtils: () => ({
    prepareAttachmentData: () => ({
      attachments: []
    }),
    uploadAttachment: (f: any, progress: any, canceled: any, context: string) => {
      return new Promise((resolve, reject) => {
        let tot = 10;
        let load = 0;
        const intervalId = setInterval(() => {
          progress({ loaded: ++load, total: tot });
          if (load === tot) {
            clearInterval(intervalId);
            resolve({ clientFileID: f.ID });
          } else if (!window.navigator.onLine) {
            clearInterval(intervalId);
            canceled(() => false)({
              response: {
                data: {
                  errorDetails: [{ localizedValue: 'Internet connection error' }]
                }
              }
            });
            reject({ clientFileID: f.ID });
          }
        }, 100);
      });
    }
  }),
  getConstants: () => ({
    CASE_INFO: {
      CASE_INFO_CONTENT: 'caseInfoContent'
    },
    DATA_INFO: {
      DATA_INFO_CONTENT: 'dataInfoContent'
    },
    PUB_SUB_EVENTS: { CASE_EVENTS: { ASSIGNMENT_SUBMISSION: 'assignmentSubmission' } },
    MESSAGES: { MESSAGES_TYPE_ERROR: 'messagesTypeError' }
  }),
  getPubSubUtils: () => ({
    subscribe: () => { },
    unsubscribe: () => { }
  }),
  getMessageManager: () => ({
    addMessages: () => { },
    clearMessages: () => { }
  })
} as unknown as typeof PCore;
export const Default: Story = (args: any) => {
  const props = {
    value: configProps.value,
    getPConnect: () => {
      return {
        getStateProps: () => ({
          value: configProps.value
        }),
        getContextName: () => 'context',
        setInheritedProps: () => {/* nothing */ },
        resolveConfigProps: () => {/* nothing */ },
        getComponentConfig: () => ({
          value: ''
        }),
        setReferenceList: () => { },
        getPageReference: () => '',
        getLocalizedValue: (val: string) => val
      };
    }
  };

  return (
    <>
      <LabbLtdExtensionsMobileFileUpload {...props} {...args} />
    </>
  );
};

Default.args = {
  label: configProps.label,
  capture: configProps.capture,
  accept: configProps.accept,
  extensions: configProps.extensions,
  multiple: configProps.multiple,
  helperText: configProps.helperText,
  placeholder: configProps.placeholder,
  testId: configProps.testId,
  readOnly: configProps.readOnly,
  disabled: configProps.disabled,
  required: configProps.required,
  status: configProps.status,
  hideLabel: configProps.hideLabel,
  displayMode: configProps.displayMode,
  validatemessage: configProps.validatemessage
};
