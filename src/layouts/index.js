import React from 'react'
import PropTypes from 'prop-types'
import Link from 'gatsby-link'
import Helmet from 'react-helmet'

import './index.css'

const socialEmbed = {
	cardType: "summary",
	contentType: "website",
	url: "http://www.zacharyhalvorson.com",
	site: "@zachhalvorson",
	title: "Zachary Halvorson",
	description: "I'm a designer focused on digital interaction and product design.",
	image: "http://zacharyhalvorson.com/embed-image.png"
};

const TemplateWrapper = ({ children }) => (
  <div>
    <Helmet
      title="Zachary Halvorson"
      meta={[
        { name: 'description', content: 'Zachary Halvorson is a digital designer focused on digital interaction and product design.' },
        { name: 'keywords', content: 'product, product design, ui design, ux design, design, vancouver' },
				{ name: 'viewport', content: 'width=device-width' },
				{ name: 'twitter:card', content: socialEmbed.cardType },
				{ name: 'twitter:site', content: socialEmbed.site },
				{ name: 'twitter:title', content: socialEmbed.title },
				{ name: 'twitter:description', content: socialEmbed.description },
				{ name: 'twitter:image', content: socialEmbed.image },
				{ property: 'og:title', content: socialEmbed.title },
				{ property: 'og:description', content: socialEmbed.description },
				{ property: 'og:type', content: socialEmbed.contentType },
				{ property: 'og:url', content: socialEmbed.url },
				{ property: 'og:image', content: socialEmbed.image }
      ]}
		>
			<link
				rel="icon"
				type="image/x-icon"
				href={__PATH_PREFIX__ + '/favicon.ico'}
			/>
    </Helmet>
    {children()}
  </div>
)

TemplateWrapper.propTypes = {
  children: PropTypes.func,
}

export default TemplateWrapper
