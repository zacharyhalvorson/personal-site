import React from 'react'
import remark from 'remark'
import reactRenderer from 'remark-react'
import * as Headings from '../components/Headings'

export default ({ data }) => {
	const post = data.markdownRemark

	return (
		<div>
			<h1>{post.frontmatter.title}</h1>
			<div>
				{console.log(post.html)}
				{
					remark()
						.use(reactRenderer)
						.processSync(post.html).contents
				}
			</div>
		</div>
	)
}

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`
