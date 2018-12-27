import React from 'react'

import * as Styled from './style.js'

export default ({
  to,
  title,
  teaser,
}) =>
  <Styled.CardLink
    to={to}
    teaser={teaser}
  >
    <h3>{title}</h3>
  </Styled.CardLink>
