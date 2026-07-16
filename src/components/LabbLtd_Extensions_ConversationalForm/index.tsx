import { Button, FieldGroup, Text, withConfiguration } from '@pega/cosmos-react-core';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import './create-nonce';

import StyledConversationalFormWrapper, {
  StyledActions,
  StyledActiveField,
  StyledBotBubble,
  StyledConversation,
  StyledUserBubble,
} from './styles';
import { getConversationFields, isAnswerEmpty } from './utils';

interface ConversationalFormProps {
  getPConnect: () => any;
  label?: string;
  showLabel?: boolean;
  nextLabel?: string;
  completionMessage?: string;
}

function LabbLtdExtensionsConversationalForm(props: ConversationalFormProps) {
  const { getPConnect, label, showLabel = true, nextLabel, completionMessage } = props;
  const pConn = getPConnect();
  const propsToUse = { label, showLabel, ...pConn.getInheritedProps() };

  const fields = useMemo(() => getConversationFields(getPConnect), [getPConnect]);

  // activeIndex: the question currently being answered; -1 when the conversation is finished.
  // maxReached: the furthest question revealed so far — earlier questions render as bubbles.
  const [activeIndex, setActiveIndex] = useState(fields.length > 0 ? 0 : -1);
  const [maxReached, setMaxReached] = useState(0);
  const [requiredHint, setRequiredHint] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const nextText = nextLabel || pConn.getLocalizedValue('Next');
  const doneText =
    completionMessage || pConn.getLocalizedValue('That is everything. Review your answers above, then submit.');
  const notAnsweredText = pConn.getLocalizedValue('Not answered yet');

  const resolve = (fieldMeta: any) => pConn.resolveConfigProps(fieldMeta.config) ?? {};
  const isDone = maxReached >= fields.length && activeIndex === -1;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [activeIndex, maxReached]);

  const advance = () => {
    const resolved = resolve(fields[activeIndex]);
    if (resolved.required && isAnswerEmpty(resolved.value)) {
      setRequiredHint(true);
      return;
    }
    setRequiredHint(false);
    if (activeIndex === maxReached) {
      const next = activeIndex + 1;
      setMaxReached(next);
      setActiveIndex(next < fields.length ? next : -1);
    } else {
      // returning from editing an earlier answer: go back to the frontier
      setActiveIndex(maxReached < fields.length ? maxReached : -1);
    }
  };

  const editAnswer = (index: number) => {
    setRequiredHint(false);
    setActiveIndex(index);
  };

  return (
    <StyledConversationalFormWrapper>
      <FieldGroup name={propsToUse.showLabel ? propsToUse.label : ''}>
        <StyledConversation role='log' aria-live='polite'>
          {fields.map((fieldMeta, index) => {
            if (index > maxReached) {
              return null;
            }
            const resolved = resolve(fieldMeta);
            const question = resolved.label;
            const isActive = index === activeIndex;
            return (
              <Fragment key={`question-${index + 1}`}>
                <StyledBotBubble>
                  <Text as='span'>{question}</Text>
                </StyledBotBubble>
                {isActive ? (
                  <StyledActiveField>
                    {pConn.createComponent(fieldMeta)}
                    <StyledActions>
                      {requiredHint && (
                        <Text as='span' status='warning'>
                          {pConn.getLocalizedValue('This question is required')}
                        </Text>
                      )}
                      <Button variant='primary' onClick={advance}>
                        {nextText}
                      </Button>
                    </StyledActions>
                  </StyledActiveField>
                ) : (
                  <StyledUserBubble
                    type='button'
                    onClick={() => editAnswer(index)}
                    aria-label={`${pConn.getLocalizedValue('Change answer')}: ${question}`}
                  >
                    {isAnswerEmpty(resolved.value) ? <em>{notAnsweredText}</em> : String(resolved.value)}
                  </StyledUserBubble>
                )}
              </Fragment>
            );
          })}
          {isDone && (
            <StyledBotBubble>
              <Text as='span'>{doneText}</Text>
            </StyledBotBubble>
          )}
          <div ref={endRef} />
        </StyledConversation>
      </FieldGroup>
    </StyledConversationalFormWrapper>
  );
}

export default withConfiguration(LabbLtdExtensionsConversationalForm);
