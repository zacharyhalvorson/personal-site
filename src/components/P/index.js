import React from 'react'
import styled from 'styled-components'

const P = styled.p`
	font-size: 1rem;
	line-height: 1.5;
	margin: 0;

	& + p {
		margin-top: 1rem;
	}
`

export default P
