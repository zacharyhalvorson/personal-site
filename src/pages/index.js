import React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'
import Header from '../components/header'

export default ({ data }) =>
  <Layout>
    <Header headerText="hey" />

    <Link to="/contact/">Contact</Link>

    <h1>{data.site.siteMetadata.title}</h1>
    <p>What a world.</p>
    <img src="https://source.unsplash.com/random/400x200" alt="" />

    <h1>
      Amazing Pandas Eating Things
    </h1>

    <h4>{data.allMarkdownRemark.totalCount} Posts</h4>

    {data.allMarkdownRemark.edges.map(({ node }) => (
      <div key={node.id}>
        <Link
          to={node.fields.slug}
        >
          <h3>
            {node.frontmatter.title}{" "}
            <span>
              — {node.frontmatter.date}
            </span>
          </h3>
          <p>{node.excerpt}</p>
        </Link>
      </div>
    ))}
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
