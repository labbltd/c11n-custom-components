import { withConfiguration, Flex, Button } from '@pega/cosmos-react-core';
import './create-nonce';
import { useEffect } from 'react';

type ActionableButtonProps = {
  label: string;
  value: string;
  localAction: string;
  getPConnect: any;
};

export const PegaExtensionsActionableButton = (props: ActionableButtonProps) => {
  const { getPConnect, label, value, localAction } = props;
  const localizedLabel =
    getPConnect().getContainerName() === 'primary'
      ? getPConnect().getLocalizedValue(
        label,
        undefined,
        `${getPConnect().getCaseInfo().getClassName().toUpperCase()}!VIEW!PYCASESUMMARY`,
      )
      : label;
  async function launchLocalAction() {
    if (value && localAction) {
      const availableActions =
        getPConnect().getValue((window as any).PCore.getConstants().CASE_INFO.AVAILABLEACTIONS) || [];
      const targetAction = availableActions.find((action: { ID: string; }) => action.ID === localAction);

      const actionName = targetAction?.name || localizedLabel;
      const actionsAPI = getPConnect().getActionsApi();
      actionsAPI.openLocalAction(localAction, {
        caseID: value,
        containerName: 'modal',
        type: 'express',
        name: actionName,
      });
    };
  };
  useEffect(() => {
    const eventType = window.PCore.getConstants().PUB_SUB_EVENTS.EVENT_EXPRESS_LOCALACTION;
    const eventId = 'actionableButtonSubmitSubscription';
    window.PCore.getPubSubUtils().subscribe(eventType, (response: any) => {
      const confirmNote = response.submitResponse.confirmationNote;
      if (confirmNote === "Thank you for your input.") {
        launchLocalAction();
      }
    }, eventId);
    return () => {
      window.PCore.getPubSubUtils().unsubscribe(eventType, eventId);
    };
  }, []);
  if (value && localAction) {
    return (
      <Flex container={{ direction: 'row' }}>
        <Button onClick={() => launchLocalAction()}>{localizedLabel}</Button>
      </Flex>
    );
  }
  return null;
};

export default withConfiguration(PegaExtensionsActionableButton);
