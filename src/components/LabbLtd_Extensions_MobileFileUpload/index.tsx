import { withConfiguration } from '@pega/cosmos-react-core';
import DxAttachment from './Attachment/Attachment.jsx';

function LabbLtdExtensionsMobileFileUpload(props: any) {
  try {
    return <DxAttachment {...props} />;
  } catch (e) {
    console.trace(e);
    return <div>Error</div>;
  }
}

export default withConfiguration(LabbLtdExtensionsMobileFileUpload);
