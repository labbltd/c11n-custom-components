import { Banner, withConfiguration } from '@pega/cosmos-react-core';
import { useEffect, useState } from 'react';

interface NetworkStatusProps {
  brokenInternetMessage: string;
  restoredInternetMessage: string;
  restoredDuration: number;
}

function LabbLtdExtensionsNetworkStatus(props: NetworkStatusProps) {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [restored, setRestored] = useState(props.restoredDuration === 0 && navigator.onLine);

  useEffect(() => {
    window.addEventListener("offline", registerOffline);
    window.addEventListener("online", registerOnline);
    return () => {
      window.removeEventListener('offline', registerOffline);
      window.removeEventListener('online', registerOnline);
    };
  }, []);

  function registerOffline() {
    setOffline(true);
  }
  function registerOnline() {
    setOffline(false);
    setRestored(true);
    if (props.restoredDuration !== undefined && props.restoredDuration !== 0) {
      setTimeout(() => {
        setRestored(false);
      }, props.restoredDuration);
    }
  }

  if (offline) {
    return <Banner variant='warning' messages={[{
      label: props.brokenInternetMessage || 'Internet connection has been broken'
    }]} />;
  }
  if (restored) {
    return <Banner variant='success' messages={[{
      label: props.restoredInternetMessage || 'Internet connection is restored'
    }]} />;
  }
  return null;
}

export default withConfiguration(LabbLtdExtensionsNetworkStatus);
