import styled from 'styled-components'
import gray from 'gray-percentage'
import { Link } from 'gatsby'

export const Overlay = styled(Link)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: ${gray(30)};
`

export const Modal = styled.div`
  height: 100%;
  width: 100%;
  background: white;
  position: absolute;
  top: 0; right: 0; left: 0;
  padding: 1rem;
  overflow-y: scroll;
  border-radius: 0;

  @media (min-width: 520px) {
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    padding: 2rem;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
`
