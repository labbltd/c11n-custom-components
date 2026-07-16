import styled, { css } from 'styled-components';

export default styled.div(() => {
  return css`
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  `;
});

export const StyledConversation = styled.div(() => {
  return css`
    display: flex;
    flex-direction: column;
    row-gap: 0.75rem;
  `;
});

const rise = css`
  @keyframes conversational-form-rise {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
  animation: conversational-form-rise 0.25s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const bubble = css`
  ${rise};
  max-inline-size: 75%;
  padding: 0.625rem 1rem;
  border-radius: 1rem;
`;

export const StyledBotBubble = styled.div(({ theme }) => {
  return css`
    ${bubble};
    align-self: flex-start;
    border-end-start-radius: 0.25rem;
    background: ${theme.base.palette['secondary-background']};
    color: ${theme.base.palette['foreground-color']};
  `;
});

export const StyledUserBubble = styled.button(({ theme }) => {
  return css`
    ${bubble};
    align-self: flex-end;
    border: none;
    border-end-end-radius: 0.25rem;
    background: ${theme.base.palette.interactive};
    color: ${theme.base.colors.white};
    font: inherit;
    text-align: start;
    cursor: pointer;

    &:focus-visible {
      outline: 0.125rem solid ${theme.base.palette['foreground-color']};
      outline-offset: 0.125rem;
    }
  `;
});

export const StyledActiveField = styled.div(({ theme }) => {
  return css`
    ${rise};
    display: flex;
    flex-direction: column;
    row-gap: 0.75rem;
    padding: 1rem;
    border: 0.0625rem solid ${theme.base.palette['border-line']};
    border-radius: 0.5rem;
  `;
});

export const StyledActions = styled.div(() => {
  return css`
    display: flex;
    justify-content: flex-end;
    column-gap: 0.5rem;
    align-items: center;
  `;
});
