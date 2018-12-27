import React from 'react'

import * as Styled from './style.js'

export default ({ to, title }) =>
  <Styled.CardLink
    to={to}
    teaserImage="https://66.media.tumblr.com/da45dc3b8872b4c5290b638017ec5359/tumblr_pjm07kSNNQ1wks6iyo1_500.gif"
  >
    <h3>{title}</h3>
  </Styled.CardLink>
