import styled from 'styled-components'
import Img from 'gatsby-image'

import breakpoints from '../breakpoints'

export const Image = styled(Img)`
  height: 100px;
  width: 100px;

  & img {
    overflow: hidden !important;
    border-radius: 6px !important;
  }

  @media (min-width: ${breakpoints['two-column']}) {
    height: 200px;
    width: 200px;
  }
`

export const ProfilePhotoWrapper = styled.div`
  padding-top: 5vh;

  @media (min-width: ${breakpoints['two-column']}) {
    display: flex;
    justify-content: flex-end;
  }
`
