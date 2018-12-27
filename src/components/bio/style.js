import styled from 'styled-components'
import Img from 'gatsby-image'
import gray from 'gray-percentage'

export const BioWrapper = styled.div`
  padding-top: 5vh;
`

export const Image = styled(Img)`
  height: 100px;
  width: 100px;
  border-radius: 50%;
`

export const Intro = styled.p`
  margin: 1rem 0;
`

export const Name = styled.div`
  font-weight: 600;
  color: ${gray(80)};
  font-size: 2.25rem;
  display: block;
  line-height: 2.25rem;

  span {
    color: ${gray(40)};
  }
`
