
export const configProps = {
  startPaymentLabel: 'Start payment',
  paymentUrl: 'http://localhost:6040',
  paymentWindowFeatures: 'popup=yes,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes,width=800,height=600',
  pollingInterval: 1000,
  pollingTimeout: 30000,
  paymentStatusDatapage: 'D_PaymentStatus',
  parameters: {
    transactionTime: '1234',
    transNo: '4567',
    transactionReference: '1234-5678'
  }
};

export const stateProps = {
  value: '.TextInputSample',
  hasSuggestions: false
};

export const fieldMetadata = {
  classID: 'DIXL-MediaCo-Work-NewService',
  type: 'Text',
  maxLength: 256,
  displayAs: 'pxTextInput',
  label: 'TextInput Sample'
};
