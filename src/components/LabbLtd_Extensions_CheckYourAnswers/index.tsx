import { Button, FieldGroup, NoValue, Text, withConfiguration } from '@pega/cosmos-react-core';
import './create-nonce';

import StyledCheckYourAnswersWrapper, { StyledSummaryList, StyledSummaryRow } from './styles';
import { getStepForSection, getSummarySections, getVisitedSteps, type SummaryField } from './utils';

interface CheckYourAnswersProps {
  getPConnect: () => any;
  label?: string;
  showLabel?: boolean;
  changeLabel?: string;
}

function renderValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return <NoValue />;
  }
  return <Text as='span'>{String(value)}</Text>;
}

function LabbLtdExtensionsCheckYourAnswers(props: CheckYourAnswersProps) {
  const { getPConnect, label, showLabel = true, changeLabel } = props;
  const pConn = getPConnect();
  const propsToUse = { label, showLabel, ...pConn.getInheritedProps() };

  const sections = getSummarySections(getPConnect);
  const steps = getVisitedSteps(getPConnect);
  const changeText = changeLabel || pConn.getLocalizedValue('Change');

  const jumpToStep = (stepID: string) => {
    pConn.getActionsApi().navigateToStep(stepID, pConn.getContextName());
  };

  return (
    <StyledCheckYourAnswersWrapper>
      <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
        {sections.map((section, sectionIndex) => {
          const step = getStepForSection(section, sectionIndex, steps);
          return (
            <section key={section.heading ?? `section-${sectionIndex + 1}`}>
              {section.heading && <Text variant='h3'>{section.heading}</Text>}
              <StyledSummaryList>
                {section.fields.map((field: SummaryField, fieldIndex: number) => (
                  <StyledSummaryRow key={field.label ?? `field-${fieldIndex + 1}`}>
                    <Text as='dt' variant='secondary'>
                      {field.label}
                    </Text>
                    <dd>{renderValue(field.value)}</dd>
                    <dd>
                      {step && (
                        <Button
                          variant='link'
                          onClick={() => jumpToStep(step.ID)}
                          aria-label={`${changeText}: ${field.label}`}
                        >
                          {changeText}
                        </Button>
                      )}
                    </dd>
                  </StyledSummaryRow>
                ))}
              </StyledSummaryList>
            </section>
          );
        })}
      </FieldGroup>
    </StyledCheckYourAnswersWrapper>
  );
}

export default withConfiguration(LabbLtdExtensionsCheckYourAnswers);
