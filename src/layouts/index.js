import React from 'react'
import PropTypes from 'prop-types'
import Link from 'gatsby-link'
import Helmet from 'react-helmet'

import './index.css'

const TemplateWrapper = ({ children }) => (
  <div>
    <Helmet
      title="Zachary Halvorson"
      meta={[
        { name: 'description', content: 'Zachary Halvorson is a digital designer focused on digital interaction and product design.' },
        { name: 'keywords', content: 'product, product design, ui design, ux design, design, vancouver' },
				{ name: 'viewport', content: 'width=device-width' }
      ]}
    />
    {children()}
  </div>
)

TemplateWrapper.propTypes = {
  children: PropTypes.func,
}

export default TemplateWrapper
