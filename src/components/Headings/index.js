import React from 'react'
import styled from 'styled-components'

import * as breaks from '../../constants/breaks'

const HeadingStyles = `
	font-weight: 900;
	text-transform: uppercase;
	position: relative;
	z-index: 2;
	border-bottom: none;
`

const H1 = styled.h1`
	${HeadingStyles}
	font-size: 1.25rem;

	@media (min-width: ${breaks.BREAK_ONE}) {
		font-size: 2rem;
	}
`

const H2 = styled.h2`
	${HeadingStyles}
	font-size: 1rem;

	@media (min-width: ${breaks.BREAK_ONE}) {
		font-size: 1.5rem;
	}
`

const Hero = H1.extend`
	font-size: 1.75rem;

	@media (min-width: ${breaks.BREAK_ONE}) {
		font-size: 3.5rem;
	}
`

export {
	Hero,
	H1,
}
