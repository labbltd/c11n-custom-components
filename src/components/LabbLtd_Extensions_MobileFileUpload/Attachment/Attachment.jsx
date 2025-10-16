import {
  Banner,
  FileDisplay,
  FileInput,
  createUID,
  getKindFromMimeType,
  useAfterInitialEffect,
  usePrevious
} from '@pega/cosmos-react-core';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getIconFromFileType,
  isFileUploadedToServer,
  shouldOpenFileInNewWindow,
  useFileDownload,
  useOpenFile,
  validateFileExtension,
  validateMaxSize
} from './AttachmentUtils';

const getAttachmentKey = (name, embeddedReference) => {
  return `attachmentsList${embeddedReference}.${name}`;
};

function getCurrentAttachmentsList(key, context) {
  return PCore.getStoreValue(`.${key}`, 'context_data', context) || [];
}

const updateAttachmentState = (pConn, key, attachments) => {
  PCore.getStateUtils().updateState(pConn.getContextName(), key, attachments, {
    pageReference: 'context_data',
    isArrayDeepMerge: false
  });
};

function DxAttachment(props) {
  const {
    value,
    validatemessage,
    getPConnect,
    label,
    extensions,
    helperText,
    testId,
    displayMode,
    multiple,
    fieldMetadata,
    isTableFormatter,
    capture,
    accept
  } = props;
  const [toggleUploadBegin, setToggleUploadBegin] = useState(false);
  const { attachmentPageInstructionEnabled = false } =
    PCore.getEnvironmentInfo().environmentInfoObject?.features?.form || {};

  /* this is a temporary fix because required is supposed to be passed as a boolean and NOT as a string */
  let { required, disabled } = props;
  [required, disabled] = [required, disabled].map(
    (prop) => prop === true || (typeof prop === 'string' && prop === 'true')
  );

  const pConn = getPConnect();

  const actionSequencer = useMemo(() => PCore.getActionsSequencer(), []);
  const caseID = PCore.getStoreValue('.pyID', 'caseInfo.content', pConn.getContextName());
  const rawValue = pConn.getComponentConfig().value;
  const isAttachmentAnnotationPresent = typeof rawValue === 'object' ? false : rawValue.includes('@ATTACHMENT');
  const { hasUploadedFiles, attachments, categoryName } = isAttachmentAnnotationPresent
    ? value
    : PCore.getAttachmentUtils().prepareAttachmentData(value);

  let valueRef = pConn.getStateProps().value;
  valueRef = valueRef?.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;

  pConn.setReferenceList(`.${valueRef}`);

  const [files, setFiles] = useState(attachments);

  const prevAttachments = usePrevious(attachments);
  const attachmentCount = useRef(attachments?.length);
  const attachmentFieldUpdated = useRef(false);
  const [filesWithError, setFilesWithError] = useState([]);

  const context = pConn.getContextName();
  const onFileDownload = useFileDownload(context);

  const embeddedProperty = pConn
    .getPageReference()
    .replace(PCore.getConstants().CASE_INFO.CASE_INFO_CONTENT, '')
    .replace(PCore.getConstants().DATA_INFO.DATA_INFO_CONTENT, '');

  const fieldAdditionalInfo = fieldMetadata?.additionalInformation;
  const additionalInfo = fieldAdditionalInfo
    ? {
      content: fieldAdditionalInfo
    }
    : undefined;

  const deleteFile = useCallback(
    (file, fileIndex) => {
      let attachmentsList = [];
      let currentAttachmentList = getCurrentAttachmentsList(
        getAttachmentKey(valueRef, embeddedProperty),
        pConn.getContextName()
      );

      // If file to be deleted is the one added in previous stage i.e. for which a file instance is created in server
      // no need to filter currentAttachmentList as we will get another entry of file in redux with delete & label
      if (hasUploadedFiles && isFileUploadedToServer(file)) {
        const updatedAttachments = currentAttachmentList.map((f) => {
          if (f.responseProps && f.responseProps.ID === file.responseProps?.ID) {
            return { ...f, delete: true, label: valueRef };
          }
          return f;
        });

        // updating the redux store to help form-handler in passing the data to delete the file from server
        updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), [...updatedAttachments]);
        setFiles((current) => {
          const newlyAddedFiles = current.filter((f) => !!f.ID);
          const filesPostDelete = current.filter(
            (f) => isFileUploadedToServer(f) && f.responseProps?.ID !== file.responseProps?.ID
          );
          attachmentsList = [...filesPostDelete, ...newlyAddedFiles];
          return attachmentsList;
        });
      } //  if the file being deleted is the added in this stage  i.e. whose data is not yet created in server
      else {
        // filter newly added files in this stage, later the updated current stage files will be added to redux once files state is updated in below setFiles()
        currentAttachmentList = currentAttachmentList.filter((f) => f.delete || f.label !== valueRef);
        setFiles((current) => {
          attachmentsList = current.filter((f) => f.ID !== file.ID);
          return attachmentsList;
        });
        updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), [
          ...currentAttachmentList,
          ...attachmentsList
        ]);
        if (file.inProgress) {
          PCore.getAttachmentUtils().cancelRequest(file.ID, pConn.getContextName());
          actionSequencer.deRegisterBlockingAction(pConn.getContextName()).catch((error) => {
            // eslint-disable-next-line no-console
            console.log(error);
          });
        }
      }

      if (attachmentPageInstructionEnabled && !attachmentFieldUpdated.current) {
        attachmentFieldUpdated.current = true;
      }

      // uploaded file ID is saved in .handle, so use that if we try to upload & delete before submitting
      if (attachmentPageInstructionEnabled && embeddedProperty !== '' && !file.inProgress) {
        attachmentCount.current -= 1;
        if (multiple === true) {
          pConn.getListActions().deleteEntry(fileIndex);
          // reset the file indexes
          setFiles((current) => {
            return [
              ...current.map((f, idx) => {
                return {
                  ...f,
                  props: {
                    ...f.props,
                    onDelete: () => deleteFile(f, idx)
                  }
                };
              })
            ];
          });
        } else {
          pConn.getListActions().deletePage(`.${valueRef}`);
        }
      }

      setToggleUploadBegin(false);
      setFilesWithError((prevFilesWithError) => {
        return prevFilesWithError.filter((f) => f.ID !== file.ID);
      });
    },
    [
      valueRef,
      pConn,
      hasUploadedFiles,
      attachmentPageInstructionEnabled,
      embeddedProperty,
      actionSequencer,
      multiple
    ]
  );

  useAfterInitialEffect(() => {
    // for automation usecase
    if (!attachmentFieldUpdated.current && JSON.stringify(prevAttachments) !== JSON.stringify(attachments)) {
      setFiles(() => {
        return [
          ...attachments.map((f, idx) => {
            return {
              ...f,
              props: {
                ...f.props,
                onDelete: () => deleteFile(f, idx),
                onDownload: () => onFileDownload(f.responseProps)
              }
            };
          })
        ];
      });
    }
  }, [attachments]);

  const resetAttachmentStoredState = () => {
    updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), undefined);
  };

  useEffect(() => {
    let tempUploadedFiles = getCurrentAttachmentsList(
      getAttachmentKey(valueRef, embeddedProperty),
      pConn.getContextName()
    );
    tempUploadedFiles = tempUploadedFiles
      .filter((f) => f.label === valueRef)
      .map((f, idx) => ({
        ...f,
        props: {
          ...f.props,
          onDelete: () => deleteFile(f, idx)
        }
      }));
    setFiles((current) => {
      return [
        ...current.map((f, idx) => {
          return isFileUploadedToServer(f)
            ? {
              ...f,
              props: {
                ...f.props,
                onDelete: () => deleteFile(f, idx),
                onDownload: () => onFileDownload(f.responseProps)
              }
            }
            : { ...f };
        }),
        ...tempUploadedFiles
      ];
    });
    PCore.getPubSubUtils().subscribe(
      PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION,
      resetAttachmentStoredState,
      caseID
    );
    return () => {
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, caseID);
    };
  }, []);

  const onUploadProgress = (id, ev) => {
    const progress = Math.floor((ev.loaded / ev.total) * 100) - 1;
    setFiles((current) => [
      ...current.map((f) => {
        if (f.ID === id) {
          f.inProgress = true;
          f.props.progress = progress;
        }
        return f;
      })
    ]);
  };

  const errorHandler = (isFetchCanceled, file) => {
    return (error) => {
      if (!isFetchCanceled(error)) {
        let uploadFailMsg = pConn.getLocalizedValue('Something went wrong');
        if (error.response && error.response.data && error.response.data.errorDetails) {
          uploadFailMsg = pConn.getLocalizedValue(error.response.data.errorDetails[0].localizedValue);
        }
        setFiles((current) => {
          return current.map((f, idx) => {
            if (f.ID === file.ID) {
              f.props.meta = uploadFailMsg;
              f.props.error = true;
              f.props.uploadError = true;
              f.props.onDelete = () => deleteFile(f, idx);
              f.props.icon = getIconFromFileType(f.type);
              f.props.name = pConn.getLocalizedValue('Unable to upload file');
              f.inProgress = false;
              const fieldName = pConn.getStateProps().value;
              // set errors to property to block submit even on errors in file upload
              PCore.getMessageManager().addMessages({
                messages: [
                  {
                    type: 'error',
                    message: pConn.getLocalizedValue('Error with one or more files')
                  }
                ],
                property: fieldName,
                pageReference: pConn.getPageReference(),
                context
              });
              delete f.props.progress;
            }
            return f;
          });
        });
      }
      throw error;
    };
  };

  const clearFieldErrorMessages = () => {
    const fieldName = pConn.getStateProps().value;
    PCore.getMessageManager().clearMessages({
      type: PCore.getConstants().MESSAGES.MESSAGES_TYPE_ERROR,
      property: fieldName,
      pageReference: pConn.getPageReference(),
      context
    });
  };

  const uploadFiles = useCallback(() => {
    const filesToBeUploaded = files
      .filter((e) => {
        const isFileUploaded = e.props && e.props.progress === 100;
        const fileHasError = e.props && e.props.error;
        const isFileUploadedinLastStep = e.responseProps && e.responseProps.ID !== 'temp';
        return !isFileUploaded && !fileHasError && !isFileUploadedinLastStep;
      })
      .map((f) => {
        f.props.uploadError = false;
        f.props.error = false;
        return window.PCore.getAttachmentUtils().uploadAttachment(
          f,
          (ev) => {
            onUploadProgress(f.ID, ev);
          },
          (isFetchCanceled) => {
            return errorHandler(isFetchCanceled, f);
          },
          pConn.getContextName()
        );
      });
    Promise.allSettled(filesToBeUploaded)
      .then((fileResponses) => {
        fileResponses = fileResponses.filter((fr) => fr.status !== 'rejected'); // in case of deleting an in progress file, promise gets cancelled but still enters then block
        if (fileResponses.length > 0) {
          if (attachmentPageInstructionEnabled && embeddedProperty !== '') {
            fileResponses.forEach((fileResponse, fileIndex) => {
              if (multiple === true) {
                pConn.getListActions().insert({ ID: fileResponse.value.ID }, attachmentCount.current + fileIndex);
              } else {
                pConn.getListActions().replacePage(`.${valueRef}`, { ID: fileResponse.value.ID });
              }
            });
          }

          attachmentCount.current += fileResponses.length;
          setFiles((current) => {
            const tempFilesUploaded = [...current];
            tempFilesUploaded.forEach((f) => {
              const index = fileResponses.findIndex((fr) => fr.value.clientFileID === f.ID);
              if (index >= 0) {
                f.props.meta = pConn.getLocalizedValue('Uploaded successfully');
                f.props.progress = 100;
                f.inProgress = false;
                f.handle = fileResponses[index].value.ID;
                f.label = valueRef;
                f.category = categoryName;
                f.responseProps = {
                  ID: 'temp',
                  fileName: f.props.name
                };
              }
            });
            return tempFilesUploaded;
          });

          if (filesWithError.length === 0) {
            clearFieldErrorMessages();
          }
        }
        setToggleUploadBegin(false);
        actionSequencer.deRegisterBlockingAction(pConn.getContextName()).catch(() => {
          return 0;
        });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
        setToggleUploadBegin(false);
        actionSequencer.cancelDeferredActionsOnError(pConn.getContextName());
      });
  }, [files, filesWithError]);

  useEffect(() => {
    if (toggleUploadBegin && files.length > 0) {
      actionSequencer.registerBlockingAction(pConn.getContextName()).then(() => {
        uploadFiles();
      });
    }
  }, [toggleUploadBegin]);

  useEffect(() => {
    if (files.length > 0 && displayMode !== 'DISPLAY_ONLY') {
      const currentAttachmentList = getCurrentAttachmentsList(
        getAttachmentKey(valueRef, embeddedProperty),
        pConn.getContextName()
      );
      // block duplicate files to redux store when added 1 after another to prevent multiple duplicates being added to the case on submit
      const tempFiles = files.filter(
        (f) => currentAttachmentList.findIndex((fr) => fr.ID === f.ID) === -1 && !f.inProgress && f.responseProps
      );

      const updatedAttList = [...currentAttachmentList, ...tempFiles];
      updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), updatedAttList);
    }
  }, [files]);

  useEffect(() => {
    if (filesWithError.length === 0) {
      clearFieldErrorMessages();
    }
  }, [filesWithError]);

  const onFileAdded = (addedFiles) => {
    addedFiles = multiple === true ? addedFiles : [addedFiles[0]];
    const maxAttachmentSize = PCore.getEnvironmentInfo().getMaxAttachmentSize() || 5;
    const tempFilesToBeUploaded = [
      ...addedFiles.map((f, idx) => {
        f.ID = createUID();
        f.props = {
          id: f.ID,
          type: f.type,
          name: f.name,
          icon: getIconFromFileType(f.type),
          onDelete: () => deleteFile(f, idx)
        };
        if (!validateMaxSize(f, maxAttachmentSize)) {
          f.props.error = true;
          f.props.meta = pConn.getLocalizedValue(`File is too big. Max allowed size is ${maxAttachmentSize}MB.`);
        } else if (!validateFileExtension(f, extensions)) {
          f.props.error = true;
          f.props.meta = `${pConn.getLocalizedValue(
            'File has invalid extension. Allowed extensions are:'
          )} ${extensions.replaceAll('.', '')}`;
        }
        if (f.props.error) {
          const fieldName = pConn.getStateProps().value;
          PCore.getMessageManager().addMessages({
            messages: [
              {
                type: 'error',
                message: pConn.getLocalizedValue('Error with one or more files')
              }
            ],
            property: fieldName,
            pageReference: pConn.getPageReference(),
            context
          });
        }
        return f;
      })
    ];
    const tempFilesWithError = tempFilesToBeUploaded.filter((f) => f.props.error);
    if (tempFilesWithError.length > 0) {
      setFilesWithError(tempFilesWithError);
    }
    setFiles((current) =>
      multiple !== true ? [...tempFilesToBeUploaded] : [...current, ...tempFilesToBeUploaded]
    );
    if (attachmentPageInstructionEnabled && !attachmentFieldUpdated.current) {
      attachmentFieldUpdated.current = true;
    }
    setToggleUploadBegin(true);
  };

  const openFile = useOpenFile(context);
  const getPreviewOrDownload = (preview, f) => {
    const fileInNewWindow = shouldOpenFileInNewWindow(getKindFromMimeType(f.responseProps.mimeType));
    if (preview && fileInNewWindow)
      return () => openFile(f.responseProps ? f.responseProps : {}, onFileDownload, getPConnect);
    if (!preview && !fileInNewWindow) return () => onFileDownload(f.responseProps ? f.responseProps : {});
    return undefined;
  };

  if (displayMode === 'DISPLAY_ONLY' || isTableFormatter) {
    return attachments?.map((f) => (
      <FileDisplay
        variant='file'
        displayText={f.props ? f.props.name : ''}
        value={f.props ? f.props.name : ''}
        key={JSON.stringify(f.props)}
        onPreview={getPreviewOrDownload(true, f)}
        onDownload={getPreviewOrDownload(false, f)}
      />
    ));
  }

  return <>
    {
      files.some(file => file.props.uploadError) &&
      <Banner variant='urgent' messages={[{
        label: 'something went wrong',
        action: {
          text: 'retry uploads',
          onClick: () => {
            const failedFiles = files
              .filter(f => f.props.uploadError);
            failedFiles.forEach(file => { file.props.onDelete(); });
            onFileAdded(failedFiles);
          }
        }
      }]} />
    }
    <FileInput
      data-testid={testId}
      required={required}
      label={label}
      extensions={extensions}
      status={validatemessage ? 'error' : undefined}
      info={validatemessage || helperText}
      hidden={multiple !== true && files.length > 0}
      onFilesAdded={onFileAdded}
      disabled={disabled}
      files={files.map((f) => f.props)}
      multiple={multiple === true}
      additionalInfo={additionalInfo}
      capture={capture}
      accept={accept}
    />
  </>;
}

DxAttachment.defaultProps = {
  value: '',
  label: '',
  extensions: '',
  helperText: '',
  required: false,
  disabled: false,
  validatemessage: '',
  displayMode: null,
  testId: null,
  multiple: false,
  fieldMetadata: {}
};

DxAttachment.propTypes = {
  value: PropTypes.object,
  label: PropTypes.string,
  extensions: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  validatemessage: PropTypes.string,
  getPConnect: PropTypes.func.isRequired,
  displayMode: PropTypes.string,
  testId: PropTypes.string,
  multiple: PropTypes.bool,
  fieldMetadata: PropTypes.objectOf(PropTypes.any)
};

export default DxAttachment;
