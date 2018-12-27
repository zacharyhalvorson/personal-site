import React from 'react'
import { Helmet } from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import { ThemeProvider } from 'styled-components'

import Theme from '../theme'
import GlobalStyle from '../global-style'

import * as Styled from './style.js'

export default ({ children, location }) => (
  <StaticQuery
    query={graphql`
      query {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `}
    render={data => (
      <ThemeProvider theme={Theme}>
        <Styled.TwoColumnLayout>
          <Helmet>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <meta name="description" content={data.site.siteMetadata.description} />
            <title>{data.site.siteMetadata.title}</title>
            <link rel="canonical" href="https://zacharyhalvorson.com" />
          </Helmet>

          <GlobalStyle />

          {children}
        </Styled.TwoColumnLayout>
      </ThemeProvider>
    )}
  />
)
