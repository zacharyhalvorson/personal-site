import React from 'react'
import { graphql } from 'gatsby'

import Bio from '../components/bio'
import Layout from '../components/layout'
import WorkList from '../components/work-list'

export default ({ data }) => {
  const items = data.allMarkdownRemark.edges.map(({ node }) => ({
    id: node.id,
    slug: node.fields.slug,
    title: node.frontmatter.title,
  }))

  return (
    <Layout>
      <Bio />

      <WorkList items={items} />
    </Layout>
  )
}

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
