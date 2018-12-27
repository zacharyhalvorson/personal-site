import styled from 'styled-components'

export const TwoColumnLayout = styled.div`
  width: 92%;
  margin: 0 auto;

  @media (min-width: 680px) {
    max-width: 960px;
    display: grid;
    grid-template-columns: repeat(2, [col-start] 1fr);
    grid-gap: 2rem;
    height: 100vh;

    & > *:first-child {
      grid-column: col-start / span 1;
    }

    & > *:last-child {
      grid-column: col-start 2 / span 1;
    }
  }

  @media (min-width: 760px) {
    grid-gap: 4rem;
  }
`
