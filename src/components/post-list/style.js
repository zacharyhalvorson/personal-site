import styled from 'styled-components'

import breakpoints from '../breakpoints'

export const List = styled.ul`
  margin: 0 -20px;
  padding: 5vh 20px;

  @media (min-width: ${breakpoints['two-column']}) {
    height: 100vh;
    overflow-y: scroll;
    overflow-x: visible;
  }
`
