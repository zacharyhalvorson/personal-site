import styled from 'styled-components'
import Img from 'gatsby-image'
import gray from 'gray-percentage'

export const BioWrapper = styled.div`
  padding-top: 5vh;
`

export const SocialsLink = styled.a`
  display: flex;
  height: 3rem;
  padding: 0 .5rem;
  margin: 0 -.5rem;
  align-items: center;
  transition: .15s ease background-color;
  border-radius: 4px;
  font-size: .875rem;
  color: ${gray(45)};
  max-width: 20rem;

  img {
    flex: none;
    height: 60%;
    margin-right: 1rem;
  }

  &:hover {
    background-color: ${props => props.theme.bg.highlight};
    text-decoration: none;
  }
`

export const Image = styled(Img)`
  height: 100px;
  width: 100px;

  & img {
    overflow: hidden !important;
    border-radius: 50% !important;
  }
`

export const Intro = styled.p`
  color: ${gray(40)};
  margin-top: 1rem;
  margin-bottom: 1.5rem;
`

export const Name = styled.div`
  font-weight: 600;
  color: ${gray(30)};
  font-size: 2.75rem;
  display: block;
  line-height: 1.125;
  margin-bottom: 1.5rem;
`

export const List = styled.ul`
  margin: 0;
  list-style-type: none;

  li {
    margin: 0;
  }
`
