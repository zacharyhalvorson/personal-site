import React from 'react'
import styled from 'styled-components'

import * as breaks from '../../constants/breaks'

const Heading = styled.h1`
	font-weight: 900;
	text-transform: uppercase;
	position: relative;
	z-index: 2;
	border-bottom: none;
	font-size: 1.75rem;

	@media (min-width: ${breaks.BREAK_ONE}) {
		font-size: 3.5rem;
	}
`

export default Heading
