import React from 'react'
import { Helmet } from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import { ThemeProvider } from 'styled-components'

import Theme from '../theme'
import GlobalStyle from '../global-style'

import ProfilePhoto from '../profile-photo'
import Bio from '../bio'

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
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
          totalCount
          edges {
            node {
              id
              html
              frontmatter {
                title
                date(formatString: "DD MMMM, YYYY")
              }
              fields {
                slug
              }
              excerpt
            }
          }
        }
      }
    `}
    render={data => {
      const posts = data.allMarkdownRemark.edges.map(({ node }) => ({
        id: node.id,
        slug: node.fields.slug,
        title: node.frontmatter.title,
        html: node.html
      }))

      return (
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

            <ProfilePhoto />

            <Bio />

            {children}
          </Styled.TwoColumnLayout>
        </ThemeProvider>
      );
    }}
  />
)
