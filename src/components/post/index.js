import React from 'react'
import PropTypes from 'prop-types';

const propTypes = {
  post: PropTypes.shape({
    title: PropTypes.string.isRequired,
    html: PropTypes.string.isRequired,
  })
}

export default function Post({ post }) {
  return (
    <React.Fragment>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </React.Fragment>
  )
}

Post.propTypes = propTypes
