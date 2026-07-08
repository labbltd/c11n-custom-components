/* stylelint-disable */
import { Button, Status, withConfiguration } from '@pega/cosmos-react-core';
import type { PConnFieldProps } from './PConnProps';
import './create-nonce';

// include in bundle

import StyledLabbLtdExtensionsBarclaysPaymentWrapper from './styles';
import { useEffect, useRef, useState } from 'react';

// interface for props
interface LabbLtdExtensionsBarclaysPaymentProps extends PConnFieldProps {
  paymentUrl: string;
  startPaymentLabel: string;
  paymentWindowFeatures: string;
  pollingInterval: number;
  pollingTimeout: number;
  paymentStatusDatapage: string;
  transactionTime: string;
  transNo: string;
  transactionReference: string;
}

// props passed in combination of props from property panel (config.json) and run time props from Constellation
// any default values in config.pros should be set in defaultProps at bottom of this file
function LabbLtdExtensionsBarclaysPayment(props: LabbLtdExtensionsBarclaysPaymentProps) {
  const pollingId = useRef<number | null>(null);
  const [windowRef, setWindowRef] = useState<Window | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ status: string, result: string; } | null>(null);

  console.log(JSON.stringify({ ...props, getPConnect: null }, null, 2));
  console.log(JSON.stringify({ ...paymentStatus }, null, 2));

  function evaluatePaymentStatus() {
    console.log('evaluatePaymentStatus');
    if (!props.transNo || !props.transactionReference || !props.transactionTime) {
      console.log('payment details unknown');
      return;
    }
    const context = props.getPConnect().getContextName();
    window.PCore.getDataPageUtils()
      .getPageDataAsync(props.paymentStatusDatapage, context,
        {
          transactionTime: props.transactionTime,
          transNo: props.transNo,
          transactionReference: props.transactionReference,
        },
        {
          invalidateCache: true
        })
      .then((res: any) => {
        console.log('response', JSON.stringify(res, null, 2));
        setPaymentStatus({ status: res.Status, result: res.PaymentStatus });
      })
      .catch((err) => {
        console.error('Error fetching payment status:', err);
      });
  }

  function startPolling() {
    console.log('startPolling');
    pollingId.current = window.setInterval(evaluatePaymentStatus, props.pollingInterval);
  }

  function stopPolling() {
    console.log('stopPolling');
    PCore.getActionsSequencer().deRegisterBlockingAction(props.getPConnect().getContextName()).catch(() => { });
    window.clearInterval(pollingId.current!);
    pollingId.current = null;
  }

  function startPayment() {
    console.log('startPayment');
    PCore.getActionsSequencer().registerBlockingAction(props.getPConnect().getContextName()).then(() => {
      console.log(`opening window ${props.paymentUrl}`);
      const openedWindow = window.open(props.paymentUrl, '_blank', props.paymentWindowFeatures);

      if (openedWindow) {
        setWindowRef(openedWindow);
        startPolling();
      }
    });
  }

  function paymentDone() {
    return paymentStatus?.status === 'DONE';
  }

  function paymentRetry() {
    return paymentStatus?.result === 'CLOSED';
  }

  useEffect(() => {
    evaluatePaymentStatus();
    return stopPolling;
  }, []);

  useEffect(() => {
    if (paymentDone()) {
      stopPolling();
      if (windowRef) {
        windowRef.close();
        setWindowRef(null);
      }
    } else if (windowRef?.closed) {
      setPaymentStatus({ status: 'DONE', result: 'CLOSED' });
      stopPolling();
      setWindowRef(null);
    }
  }, [paymentStatus]);

  return (
    <StyledLabbLtdExtensionsBarclaysPaymentWrapper>
      {(!paymentDone() || paymentRetry()) && !pollingId.current && <><Button type='button' onClick={() => {
        startPayment();
      }}>{props.startPaymentLabel}</Button><br /></>}
      {pollingId.current && <Status variant='pending'>Payment in progress...</Status>}
      {paymentStatus?.result === 'CAPTURED' && <Status variant='success'>Payment success</Status>}
      {paymentStatus?.result === 'CANCELLED' && <Status variant='warn'>Payment cancelled</Status>}
      {paymentStatus?.result === 'FAIL' && <Status variant='urgent'>Payment failed</Status>}
      {paymentStatus?.result === 'DECLINED' && <Status variant='urgent'>Payment declined</Status>}
      {paymentStatus?.result === 'CLOSED' && <Status variant='urgent'>Payment window closed</Status>}
    </StyledLabbLtdExtensionsBarclaysPaymentWrapper>
  );
}

export default withConfiguration(LabbLtdExtensionsBarclaysPayment);
