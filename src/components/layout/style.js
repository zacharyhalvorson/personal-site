import styled from 'styled-components'

import breakpoints from '../breakpoints'

export const TwoColumnLayout = styled.div`
  width: 92%;
  margin: 0 auto;

  @media (min-width: ${breakpoints['two-column']}) {
    max-width: 960px;
    display: grid;
    grid-template-columns: repeat(2, [col-start] 1fr);
    grid-gap: 2rem;
    height: 100vh;

    & > *:first-child {
      grid-column: col-start / span 1;
    }

    & > *:nth-child(2) {
      grid-column: col-start 2 / span 1;
    }
  }

  @media (min-width: 760px) {
    grid-gap: 4rem;
  }
`
