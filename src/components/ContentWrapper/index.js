import React from 'react'
import styled from 'styled-components'

import * as breaks from '../../constants/breaks';

const ContentWrapper = styled.div`
	margin: 0 auto;
	margin-bottom: 2rem;
	padding: 1rem;
	max-width: 27rem;

	@media (min-width: ${breaks.BREAK_ONE}) {
		max-width: 52rem;
		padding: 2rem;
	}
`

export default ContentWrapper;
