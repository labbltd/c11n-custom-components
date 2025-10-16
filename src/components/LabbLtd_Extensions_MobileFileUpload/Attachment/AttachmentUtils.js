import download from 'downloadjs';
import { useCallback } from 'react';
import { getKindFromMimeType } from '@pega/cosmos-react-core';

let docURL = '';

export const binaryToArrayBuffer = (binaryString) => {
  const bytes = new Uint8Array(binaryString.length);
  return bytes.map((byte, i) => binaryString.charCodeAt(i));
};

export const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64); // Comment this if not using base64
  return binaryToArrayBuffer(binaryString);
};

export const isContentBinary = (headers) => {
  return headers && headers['content-transfer-encoding'] === 'binary';
};

export const isContentBase64 = (headers) => {
  return headers && headers['content-transfer-encoding'] === 'base64';
};

export const shouldOpenFileInNewWindow = (type) => {
  return type === 'image' || type === 'pdf';
};

export const validateMaxSize = (fileObj, maxSizeInMB) => {
  const fileSize = (fileObj.size / 1048576).toFixed(2);
  return parseFloat(fileSize) < parseFloat(maxSizeInMB);
};

export const validateFileExtension = (fileObj, allowedExtensions) => {
  if (!allowedExtensions) {
    return true;
  }
  const allowedExtensionList = allowedExtensions
    .toLowerCase()
    .split(',')
    .map((item) => item.replaceAll('.', '').trim());
  const extension = fileObj.name.split('.').pop().toLowerCase();
  return allowedExtensionList.includes(extension);
};

export const fileDownload = (data, fileName, ext, headers) => {
  const name = ext ? `${fileName}.${ext}` : fileName;
  // Temp fix: downloading EMAIl type attachment as html file
  if (ext === 'html') {
    download(isContentBase64(headers) ? atob(data) : data, name, 'text/html');
  } else if (isContentBinary(headers)) {
    download(data, name);
  } else {
    download(atob(data), name);
  }
};

export const transformImageData = (data, type) => {
  const decodedData = atob(data);
  if (!decodedData || !decodedData.length || !type) return;

  const bytes = new Uint8Array(decodedData.length);
  const arrayBuf = bytes.map((_, i) => decodedData.charCodeAt(i));
  return new Blob([arrayBuf], { type });
};

export const getIconFromFileType = (fileType) => {
  let icon = 'document-doc';
  if (!fileType) return icon;
  if (fileType.startsWith('audio')) {
    icon = 'audio';
  } else if (fileType.startsWith('video')) {
    icon = 'video';
  } else if (fileType.startsWith('image')) {
    icon = 'picture';
  } else if (fileType.includes('pdf')) {
    icon = 'document-pdf';
  } else {
    const [, subtype] = fileType.split('/');
    const foundMatch = (sources) => {
      return sources.some((key) => subtype.includes(key));
    };

    if (foundMatch(['excel', 'spreadsheet'])) {
      icon = 'document-xls';
    } else if (foundMatch(['zip', 'compressed', 'gzip', 'rar', 'tar'])) {
      icon = 'document-compress';
    }
  }

  return icon;
};

export const fileDownloadVar = (content, type, name, extension) => {
  if (type === 'FILE' || type === undefined) {
    fileDownload(content.data, name, extension, content.headers);
  } else if (type === 'URL') {
    let { data } = content;
    if (!/^(http|https):\/\//.test(data)) {
      data = `//${data}`;
    }
    window.open(content.data, '_blank');
  } else if (type === 'EMAIL') {
    // Temp Fix: for EMAIL type attachment
    fileDownload(content.data, name, 'html', content.headers);
  }
};

export const useFileDownload = (context) => {
  return useCallback(
    ({ ID, name, extension, type, category, responseType }) => {
      if (category !== 'pxDocument') {
        PCore.getAttachmentUtils()
          .downloadAttachment(ID, context, responseType)
          .then((content) => {
            fileDownloadVar(content, type, name, extension);
          })
          // eslint-disable-next-line no-console
          .catch(console.error);
      } else {
        PCore.getAttachmentUtils()
          .downloadDocument(ID, context, responseType)
          .then((content) => {
            fileDownloadVar(content, type, name, extension);
          })
          // eslint-disable-next-line no-console
          .catch(console.error);
      }
    },
    [context]
  );
};

export const useOpenFile = (context) => {
  return useCallback(
    (att, downloadFile, getPConnect) => {
      const kind = getKindFromMimeType(att.mimeType);
      if (att.category === 'pxDocument') {
        if (!docURL) {
          PCore.getAttachmentUtils()
            .getDocumentURL(getPConnect())
            .then((response) => {
              docURL = response?.pyURLContent !== '' ? response?.pyURLContent : null;
              const docId = att.ID.split(' ');
              if (docURL) window.open(`${docURL}/${docId[1]}`, '_blank');
            });
        } else {
          const docId = att.ID.split(' ');
          window.open(`${docURL}/${docId[1]}`, '_blank');
        }
      } else if (shouldOpenFileInNewWindow(kind)) {
        PCore.getAttachmentUtils()
          .downloadAttachment(att.ID, context, att.responseType)
          .then((content) => {
            let arrayBuf = [];
            if (isContentBinary(content.headers)) arrayBuf = content.data;
            else arrayBuf = base64ToArrayBuffer(content.data);

            const blob = new Blob([arrayBuf], { type: att.mimeType });
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
          })
          .catch(() => {
            downloadFile(att);
          });
      } else {
        downloadFile(att);
      }
    },
    [context]
  );
};

export const isFileUploadedToServer = (file) => file.responseProps && !file.responseProps.ID?.includes('temp');
