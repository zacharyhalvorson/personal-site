import React from 'react'
import { graphql } from 'gatsby'

import Bio from '../components/bio'
import Layout from '../components/layout'
import PostList from '../components/post-list'
import Modal from '../components/modal'
import Post from '../components/post'

export default ({ data, location }) => {
  const posts = data.allMarkdownRemark.edges.map(({ node }) => ({
    id: node.id,
    slug: node.fields.slug,
    title: node.frontmatter.title,
    html: node.html
  }))

  return (
    <Layout location={location}>
      <Bio />

      <PostList posts={posts} />

      <Modal>
        <Post post={posts[0]}/>
      </Modal>
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
