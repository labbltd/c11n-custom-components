import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  withConfiguration,
  registerIcon,
  Button,
  Icon,
  CardHeader,
  CardContent,
  Modal,
  Flex,
  Text,
  EmptyState,
  useModalManager,
  SummaryList,
  SummaryItem,
  Lightbox,
  Grid,
  getMimeTypeFromFile,
  useTheme,
} from '@pega/cosmos-react-core';
import type { SummaryListItem, ModalMethods, ModalProps, LightboxItem, LightboxProps } from '@pega/cosmos-react-core';
import { downloadBlob, addAttachment, downloadFile } from './utils';
import StyledCardContent from './styles';
import './create-nonce';

import * as polarisIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/polaris.icon';
import * as informationIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/information.icon';
import * as clipboardIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/clipboard.icon';

import * as downloadIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/download.icon';
import * as timesIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/times.icon';

import * as videoIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/play-solid.icon';
import * as audioIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/speaker-on-solid.icon';
import * as documentIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/filetype-text.icon';
import * as messageIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/mail-solid.icon';
import * as spreadsheetIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/grid-solid.icon';
import * as presentationIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/slideshow-solid.icon';
import * as archiveIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/archive-solid.icon';
import * as pictureIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/picture-solid.icon';
import * as openIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/open.icon';
import * as paperClipIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/paper-clip.icon';

/* To register more icon, you need to import them as shown above */
registerIcon(
  polarisIcon,
  informationIcon,
  clipboardIcon,
  downloadIcon,
  timesIcon,
  videoIcon,
  audioIcon,
  documentIcon,
  messageIcon,
  spreadsheetIcon,
  presentationIcon,
  archiveIcon,
  pictureIcon,
  openIcon,
  paperClipIcon,
);

export type UtilityListProps = {
  heading: string;
  casesDataPage: string;
  useAttachmentEndpoint: boolean;
  groupByCase?: boolean;
  categories?: string;
  dataPage: string;
  iconName?: 'information' | 'polaris' | 'clipboard';
  displayFormat?: 'list' | 'tiles';
  useLightBox?: boolean;
  enableDownloadAll?: boolean;
  getPConnect?: any;
};

const ViewAllModal = ({
  heading,
  attachments,
  loading,
}: {
  heading: ModalProps['heading'];
  attachments: SummaryListItem[];
  loading: ModalProps['progress'];
}) => {
  return (
    <Modal heading={heading} count={attachments.length} progress={loading}>
      <SummaryList items={attachments} />
    </Modal>
  );
};

export const PegaExtensionsDisplayAttachments = (props: UtilityListProps) => {
  const {
    heading = 'List of objects',
    useAttachmentEndpoint = true,
    groupByCase = false,
    casesDataPage,
    dataPage = '',
    categories = '',
    displayFormat = 'summaryList',
    iconName = 'clipboard',
    useLightBox = false,
    enableDownloadAll = false,
    getPConnect,
  } = props;
  const { create } = useModalManager();
  const [attachments, setAttachments] = useState<Array<SummaryListItem>>([]);
  const [files, setFiles] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [elemRef, setElemRef] = useState<HTMLElement>();
  const [images, setImages] = useState<LightboxProps['items'] | null>(null);
  const viewAllModalRef = useRef<ModalMethods<any>>();
  const theme = useTheme();
  const downloadAll = (caseId?: string) => {
    files
      ?.filter((attachment: any) => !caseId || attachment.caseId === caseId)
      .forEach((attachment: any) => {
        downloadFile(attachment, getPConnect, undefined, true);
      });
  };

  const onLightboxItemClose = () => {
    setImages(null);
    elemRef?.focus();
  };

  const onLightboxItemDownload = async (id: LightboxItem['id']) => {
    images?.forEach((image: any) => {
      if (image.id === id) {
        downloadBlob(image.blob, image.name, image.mimeType);
      }
    });
  };

  const publishAttachmentsUpdated = useCallback((count: any) => {
    (window as any).PCore.getPubSubUtils().publish('WidgetUpdated', {
      widget: 'LABBLTD_EXTENSIONS_CASESATTACHMENTS',
      count,
    });
  }, []);

  const loadAttachments = useCallback(
    (response: Array<any> = [], caseInfo: { id: string; label: string } = { id: '', label: '' }) => {
      const listOfAttachments: Array<any> = [];
      const listOfFiles: Array<any> = [];
      const listOfCategories = categories.split(',');
      response.forEach((attachment: any) => {
        const currentCategory = attachment.category?.trim() || attachment.pyCategory?.trim();
        if (useAttachmentEndpoint) {
          /* Filter the attachment categories */
          if (categories && listOfCategories.length > 0) {
            let isValidCategory = false;
            listOfCategories.forEach((categoryVal: string) => {
              if (currentCategory.toLocaleLowerCase() === categoryVal.trim().toLocaleLowerCase()) {
                isValidCategory = true;
              }
            });
            if (!isValidCategory) return;
          }
        } else {
          attachment = {
            ...attachment,
            category: attachment.pyCategory,
            name: attachment.pyMemo,
            ID: attachment.pzInsKey,
            type: attachment.pyFileCategory,
            fileName: attachment.pyFileName,
            mimeType: attachment.pyTopic,
            categoryName: attachment.pyLabel,
            createTime: attachment.pxCreateDateTime,
            createdByName: attachment.pxCreateOpName,
          };
        }
        attachment.mimeType = getMimeTypeFromFile(attachment.fileName || attachment.nameWithExt || '');
        if (!attachment.mimeType) {
          if (attachment.category === 'Correspondence') {
            attachment.mimeType = 'text/html';
            attachment.extension = 'html';
          } else {
            attachment.mimeType = 'text/plain';
          }
        }
        listOfFiles.push(attachment);
        addAttachment({
          currentCategory,
          attachment,
          listOfAttachments,
          getPConnect,
          setImages,
          useLightBox,
          setElemRef,
        });
      });
      setFiles((files) => [...files, ...listOfFiles.map((file: any) => ({ ...file, caseId: caseInfo.id }))]);
      setAttachments((attachments) => [
        ...attachments,
        ...listOfAttachments.map((item: any) => ({ ...item, caseId: caseInfo.id, caseLabel: caseInfo.label })),
      ]);
      publishAttachmentsUpdated(listOfAttachments?.length ?? 0);
      setLoading(false);
    },
    [categories, getPConnect, useAttachmentEndpoint, useLightBox, publishAttachmentsUpdated],
  );

  const initialLoad = useCallback(
    (caseID: string, caseLabel: string) => {
      const pConn = getPConnect();
      const caseInfo = { id: caseID, label: caseLabel };
      if (useAttachmentEndpoint) {
        const attachmentUtils = (window as any).PCore.getAttachmentUtils();
        attachmentUtils
          .getCaseAttachments(caseID, pConn.getContextName())
          .then((resp: any) => loadAttachments(resp, caseInfo))
          .catch(() => {
            setLoading(false);
          });
      } else {
        const payload = {
          dataViewParameters: [{ LinkRefFrom: caseID }],
        };
        (window as any).PCore.getDataApiUtils()
          .getData(dataPage, payload, pConn.getContextName())
          .then((response: any) => {
            if (response.data.data !== null) {
              loadAttachments(response.data.data, caseInfo);
            } else {
              setLoading(false);
            }
          })
          .catch(() => {
            setLoading(false);
          });
      }
    },
    [dataPage, getPConnect, loadAttachments, useAttachmentEndpoint],
  );

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Array<any> }>();
    attachments.forEach((attachment: any) => {
      const group: { label: string; items: Array<any> } = map.get(attachment.caseId) ?? {
        label: attachment.caseLabel || attachment.caseId,
        items: [],
      };
      group.items.push(attachment);
      map.set(attachment.caseId, group);
    });
    return Array.from(map, ([id, group]) => ({ id, ...group }));
  }, [attachments]);

  useEffect(() => {
    // retrieve case ID's from casesDatapage
    if (casesDataPage) {
      const pConn = getPConnect();
      (window as any).PCore.getDataApiUtils()
        .getData(casesDataPage, {}, pConn.getContextName())
        .then((response: any) => {
          if (response.data.data !== null && Array.isArray(response.data.data)) {
            response.data.data.forEach((item: any) =>
              initialLoad(item.pzInsKey, item.pyID || item.pyLabel || item.pzInsKey),
            );
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [categories, useLightBox, useAttachmentEndpoint, enableDownloadAll, initialLoad]);

  const renderTileGrid = (items: Array<any>) => (
    <Grid
      container={{ pad: 0, gap: 1 }}
      xl={{ container: { cols: 'repeat(6, 1fr)', rows: 'repeat(1, 1fr)' } }}
      lg={{ container: { cols: 'repeat(4, 1fr)', rows: 'repeat(1, 1fr)' } }}
      md={{ container: { cols: 'repeat(3, 1fr)', rows: 'repeat(1, 1fr)' } }}
      sm={{ container: { cols: 'repeat(2, 1fr)', rows: 'repeat(1, 1fr)' } }}
      xs={{ container: { cols: 'repeat(1, 1fr)', rows: 'repeat(1, 1fr)' } }}
    >
      {items.map((attachment: any) => (
        <StyledCardContent key={attachment.id} theme={theme}>
          <SummaryItem
            id={attachment.id}
            visual={attachment.visual}
            primary={attachment.primary}
            secondary={attachment.secondary}
          />
        </StyledCardContent>
      ))}
    </Grid>
  );

  return (
    <>
      {displayFormat === 'list' ? (
        <Flex container={{ direction: 'column' }}>
          {groupByCase && !loading && groups.length > 0 ? (
            groups.map((group) => (
              <SummaryList
                key={group.id}
                name={group.label}
                headingTag='h3'
                icon={iconName}
                count={group.items.length}
                items={group.items.slice(0, 3)}
                onViewAll={() => {
                  viewAllModalRef.current = create(ViewAllModal, {
                    heading: group.label,
                    attachments: group.items,
                    loading,
                  });
                }}
                actions={
                  enableDownloadAll
                    ? [
                        {
                          text: 'Download all',
                          id: `Download all ${group.id}`,
                          icon: 'download',
                          onClick: () => {
                            downloadAll(group.id);
                          },
                        },
                      ]
                    : undefined
                }
              />
            ))
          ) : (
            <SummaryList
              name={heading}
              headingTag='h3'
              icon={iconName}
              count={loading ? undefined : attachments.length}
              items={attachments?.slice(0, 3)}
              loading={loading}
              onViewAll={() => {
                viewAllModalRef.current = create(ViewAllModal, { heading, attachments, loading });
              }}
              actions={
                enableDownloadAll
                  ? [
                      {
                        text: 'Download all',
                        id: 'Download all',
                        icon: 'download',
                        onClick: () => {
                          downloadAll();
                        },
                      },
                    ]
                  : undefined
              }
            />
          )}
        </Flex>
      ) : (
        <Flex container={{ direction: 'column' }}>
          <CardHeader
            actions={
              enableDownloadAll ? (
                <Button
                  variant='simple'
                  label={getPConnect().getLocalizedValue('Download all')}
                  icon
                  compact
                  onClick={() => downloadAll()}
                >
                  <Icon name='download' />
                </Button>
              ) : undefined
            }
          >
            <Text variant='h2'>{heading}</Text>
          </CardHeader>
          <CardContent>
            {attachments?.length > 0 ? (
              groupByCase ? (
                <Flex container={{ direction: 'column', gap: 2 }}>
                  {groups.map((group) => (
                    <Flex key={group.id} container={{ direction: 'column', gap: 1 }}>
                      <Text variant='h3'>{group.label}</Text>
                      {renderTileGrid(group.items)}
                    </Flex>
                  ))}
                </Flex>
              ) : (
                renderTileGrid(attachments)
              )
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Flex>
      )}
      {images && <Lightbox items={images} onAfterClose={onLightboxItemClose} onItemDownload={onLightboxItemDownload} />}
    </>
  );
};

export default withConfiguration(PegaExtensionsDisplayAttachments);
