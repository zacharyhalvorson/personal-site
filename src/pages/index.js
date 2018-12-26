import React from 'react'
import { graphql } from 'gatsby'

import Bio from '../components/bio'
import Layout from '../components/layout'
import Card from '../components/card'

export default ({ data }) =>
  <Layout>
    <Bio />

    <div>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <Card
          key={node.id}
          to={node.fields.slug}
          title={node.frontmatter.title}
        />
      ))}
    </div>
  </Layout>


export const query = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      totalCount
      edges {
        node {
          id
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
`
