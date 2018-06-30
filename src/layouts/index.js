import React from 'react'
import PropTypes from 'prop-types'
import Link from 'gatsby-link'
import Helmet from 'react-helmet'

import './index.css'

const TemplateWrapper = ({ children, data }) => (
  <div>
    <Helmet
      title={data.site.siteMetadata.title}
      meta={data.site.siteMetadata.meta}
		>
			<link
				rel="icon"
				type="image/x-icon"
				href={__PATH_PREFIX__ + '/favicon.ico'}
			/>
			<link
				rel="apple-touch-icon-precomposed"
				href={__PATH_PREFIX__ + '/apple-touch-icon.png'}
			/>
    </Helmet>
    {children()}
  </div>
)

TemplateWrapper.propTypes = {
  children: PropTypes.func,
}

export default TemplateWrapper

export const query = graphql`
  query SiteTitleQuery {
    site {
      siteMetadata {
        title,
				meta...
      }
    }
  }
`
