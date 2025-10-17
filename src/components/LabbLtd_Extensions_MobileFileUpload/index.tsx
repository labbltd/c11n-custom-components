import { Button, withConfiguration } from '@pega/cosmos-react-core';
import type { AttachmentProperties } from '@pega/pcore-pconnect-typedefs/attachment/types';
import { useEffect, useState } from 'react';

interface AttachmentConfig {
  label: string;
  delete: boolean;
  inProgress: boolean;
  responseProps?: {
    pzInsKey?: string;
  };
  props: {
    meta: string;
    progress?: number;
    error?: boolean;
    name: string;
  };
  category?: string;
  handle?: string;
  ID?: string;
}

function LabbLtdExtensionsMobileFileUpload(props: any) {
  const [hasFailedFiles, setHasFailedFiles] = useState<boolean>(false);

  function getName(): string {
    return props.reference;
  }

  function getStoreKey(): string {
    return `attachmentsList.${getName()}`;
  }

  function getAttachmentsFromState(): AttachmentConfig[] {
    const context = props.getPConnect().getContextName();
    return window.PCore.getStoreValue(`.${getStoreKey()}`, 'context_data', context) || [];
  }

  function updateAttachmentsInState(attachments: AttachmentConfig[]): void {
    window.PCore.getStateUtils().updateState(
      props.getPConnect().getContextName(),
      getStoreKey(),
      attachments,
      {
        pageReference: 'context_data',
        isArrayDeepMerge: false
      }
    );
  }

  async function retry(): Promise<void> {
    const attachments = getAttachmentsFromState();
    // navigating while file upload is not finished will not link the document to the case
    // therefore we block navigation until all files are uploaded
    await window.PCore.getActionsSequencer().registerBlockingAction(props.getPConnect().getContextName());

    for (const file of attachments) {
      if (file.props.error) {
        file.props.meta = '';
        file.props.error = false;
        // client side validation succeeded, ready to upload to server
        try {
          // put file on server
          // eslint-disable-next-line no-await-in-loop
          const fileRes = await window.PCore.getAttachmentUtils().uploadAttachment(
            file,
            (event: any) => {
              file.props.progress = Math.floor((event.loaded / event.total) * 100);
            },
            (isCanceled: any) => (error: Error) => {
              if (!isCanceled(error)) {
                // manually clicking the delete button will cancel the request
                // here we handle the remaining unexpected errors
                file.props.error = true;
              }
            },
            props.getPConnect().getContextName()
          );

          if (fileRes) {
            file.props.error = false;
            file.props.meta = props.getPConnect().getLocalizedValue('Uploaded successfully');
            file.props.progress = 100;
            file.inProgress = false;
            file.handle = (fileRes as any).ID;
            file.label = props.reference;
            file.category = props.categoryName;
            file.responseProps = {
              ID: 'temp',
              fileName: file.props.name
            } as AttachmentProperties['responseProps'];
          }
        } catch (error) {
          // eslint-disable-next-line no-await-in-loop
          await window.PCore.getActionsSequencer().cancelDeferredActionsOnError(props.getPConnect().getContextName());
        }
      }
    }
    // re-enable the action buttons for navigating
    await window.PCore.getActionsSequencer().deRegisterBlockingAction(props.getPConnect().getContextName());

    // updating the state such that Constellation Core will
    // link uploaded file to the current assignment using the clientFileID and handle
    updateAttachmentsInState([...attachments]);
  }

  useEffect(() => {
    window.PCore.getStore().subscribe(() => {
      const attachments = getAttachmentsFromState();
      setHasFailedFiles(attachments.some((file) => file.props.error));
    });
    if (props.referenceTestID) {
      const fileInput = document.querySelector(`input[data-testid="${props.referenceTestID}"]`);
      if (fileInput) {
        fileInput.setAttribute('capture', props.capture || 'environment');
        fileInput.setAttribute('accept', props.accept || 'image/*');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return hasFailedFiles ? <Button onClick={() => retry()}>{props.label || 'Retry File Upload'}</Button> : null;
}

export default withConfiguration(LabbLtdExtensionsMobileFileUpload);
