import React from 'react'
import { graphql } from 'gatsby'
import { Router, Location } from '@reach/router';

import Bio from '../components/bio'
import Layout from '../components/layout'
import PostList from '../components/post-list'

export default ({ data, location }) => {
  const posts = data.allMarkdownRemark.edges.map(({ node }) => ({
    id: node.id,
    slug: node.fields.slug,
    title: node.frontmatter.title,
    html: node.html
  }))

  return (
    <Layout
      location={location}
      posts={posts}
    >
    </Layout>
  )
}

export const query = graphql`
  query {
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
`
