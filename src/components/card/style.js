import styled from 'styled-components'
import { Link } from 'gatsby'

import truncate from '../../utils/truncate.js'

export const CardLink = styled(Link)`
  display: inline-block;
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
  height: 20rem;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadow.two};
  transition: .2s ease-in-out;
  transition-property: box-shadow, transform;

  &:hover,
  &:focus {
    box-shadow: ${props => props.theme.shadow.three};
    transform: scale(1.02);
    text-decoration: none;
  }

  &:active {
    transform: scale(.98);
    box-shadow: ${props => props.theme.shadow.one};
  }

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0; right: 0; left: 0;
    height: 80%;
    background-image: url(${props => props.teaser});
    background-size: cover;
  }

  h3 {
    margin-top: calc(0.8 * 20rem);
    margin-bottom: 0;
    height: calc(0.2 * 20rem);
    line-height: calc(0.2 * 20rem);
    text-align: center;
    ${truncate};
  }
`
