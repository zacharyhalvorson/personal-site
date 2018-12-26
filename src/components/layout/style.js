import styled from 'styled-components'

export const TwoColumnLayout = styled.div`
  & > *:first-child {
    background: tomato;
  }

  & > *:last-child {
    background: cornflowerblue;
  }

  @media (min-width: 680px) {
    max-width: 960px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, [col-start] 1fr);
    grid-gap: 1rem;
    height: 100vh;

    & > *:first-child {
      background: tomato;
      grid-column: col-start / span 1;

      overflow-y: scroll;
      overflow-x: hidden;
    }

    & > *:last-child {
      background: cornflowerblue;
      grid-column: col-start 2 / span 1;
      
      overflow-y: scroll;
      overflow-x: hidden;
    }
  }
`
