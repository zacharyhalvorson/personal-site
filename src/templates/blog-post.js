import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"

import Modal from '../components/modal'
import Post from '../components/post'


export default ({ data }) => {
  const post = {
    title: data.markdownRemark.frontmatter.title,
    html: data.markdownRemark.html,
  }

  return (
    <Layout>
      <Modal>
        <Post post={post}/>
      </Modal>
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`
