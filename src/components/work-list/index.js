import React from 'react'
import PropTypes from 'prop-types';

import Card from '../card'

import * as Styled from './style.js'

const propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    teaser: PropTypes.string.isRequired,
  }))
}

const defaultProps = {
  items: null,
}

export default function WorkList({ items }) {
  return items
    ? (
      <Styled.List>
        {items.map(item => (
          <Card
            key={item.id}
            to={item.slug}
            title={item.title}
            teaser="https://66.media.tumblr.com/da45dc3b8872b4c5290b638017ec5359/tumblr_pjm07kSNNQ1wks6iyo1_500.gif"
          />
        ))}
        {items.map(item => (
          <Card
            key={item.id}
            to={item.slug}
            title={item.title}
            teaser="https://66.media.tumblr.com/da45dc3b8872b4c5290b638017ec5359/tumblr_pjm07kSNNQ1wks6iyo1_500.gif"
          />
        ))}
      </Styled.List>
    )
    : `There's no work to display`
}

WorkList.propTypes = propTypes
WorkList.defaultProps = defaultProps
