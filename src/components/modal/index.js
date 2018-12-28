import React from 'react'

import * as Styled from './style.js'

export default ({ children }) =>
  <React.Fragment>
    <Styled.Overlay to="/" />
    <Styled.Modal>
      {children}
    </Styled.Modal>
  </React.Fragment>
