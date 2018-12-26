import React from 'react'
import { Link } from 'gatsby'

export default ({ to, title }) =>
  <Link
    to={to}
  >
    <h3>{title}</h3>
  </Link>
