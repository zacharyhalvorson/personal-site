import { createGlobalStyle } from 'styled-components'

export default createGlobalStyle`
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 16px;

    margin: 0;
    color: ${props => props.theme.text['default-light']};
    background-color: ${props => props.theme.bg['default-light']};
  }

  @media (prefers-color-scheme: dark) {
    body {
      color: ${props => props.theme.text['default-dark']};
      background-color: ${props => props.theme.bg['default-dark']};
    }
  }
`
