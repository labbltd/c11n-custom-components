import styled, { css } from 'styled-components';

export default styled.div(() => {
  return css`
    display: flex;
    flex-direction: column;
    row-gap: 1.5rem;
  `;
});

export const StyledSummaryList = styled.dl(() => {
  return css`
    margin: 0;
  `;
});

export const StyledSummaryRow = styled.div(() => {
  return css`
    display: grid;
    grid-template-columns: minmax(8rem, 30%) 1fr auto;
    column-gap: 1rem;
    align-items: baseline;
    padding-block: 0.75rem;
    border-block-end: 0.0625rem solid rgb(0 0 0 / 0.15);

    dt,
    dd {
      margin: 0;
    }

    @media (max-width: 40rem) {
      grid-template-columns: 1fr auto;

      dd:first-of-type {
        grid-column: 1 / -1;
      }
    }
  `;
});
