import React from 'react'
import PropTypes from 'prop-types';

import Card from '../card'

import * as Styled from './style.js'

const propTypes = {
  posts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    teaser: PropTypes.string.isRequired,
  }))
}

const defaultProps = {
  posts: null,
}

export default function PostList({ posts }) {
  return posts
    ? (
      <Styled.List>
        {posts.map(post => (
          <Card
            key={post.id}
            to={post.slug}
            title={post.title}
            teaser="https://66.media.tumblr.com/da45dc3b8872b4c5290b638017ec5359/tumblr_pjm07kSNNQ1wks6iyo1_500.gif"
          />
        ))}
        {posts.map(post => (
          <Card
            key={post.id}
            to={post.slug}
            title={post.title}
            teaser="https://66.media.tumblr.com/da45dc3b8872b4c5290b638017ec5359/tumblr_pjm07kSNNQ1wks6iyo1_500.gif"
          />
        ))}
      </Styled.List>
    )
    : `There's no posts to display`
}

PostList.propTypes = propTypes
PostList.defaultProps = defaultProps
