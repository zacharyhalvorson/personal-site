import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'

import Me from '../assets/images/me.jpg'

const BREAK_ONE = '40rem';

const PageTitle = styled.h1`
	font-weight: 900;
	position: relative;
	z-index: 2;
	border-bottom: none;

	@media (min-width: ${BREAK_ONE}) {
		font-size: 3rem;
    margin-bottom: 4rem;
	}
`

const ContentWrapper = styled.div`
	margin: 0 auto;
	margin-bottom: 2rem;
	padding: 1rem;
	max-width: 27rem;

	@media (min-width: ${BREAK_ONE}) {
		max-width: 52rem;
		padding: 2rem;
	}
`

const MyPhoto = styled.img`
	transform: translateY(-20%);
	position: relative;
	display: block;
	z-index: 1;
	margin: 0 auto;
	width: 60%;

	@media (min-width: ${BREAK_ONE}) {
		float: left;
		width: 16rem;
		transform: initial;

	}
`

const Text = styled.div`
	@media (min-width: ${BREAK_ONE}) {
		padding-left: 2rem;
		float: right;
		width: calc(100% - 16rem);
	}
`

const IndexPage = () => (
  <ContentWrapper>
    <PageTitle>Zachary Halvorson is a digital product designer.</PageTitle>

		<MyPhoto src={Me} alt="A photo of me." title="Nice to meet you!" />

		<Text>
      <p>I lead design at <a target="_blank" href="https://dooly.ai">Dooly</a>. We’re a note taking and productivity tool to help customer-facing people have better meetings. I also teach Web Development at <a target="_blank" href="https://brainstation.io">BrainStation</a> once a week in the evenings.</p>
			<p>As a product designer at <a target="_blank" href="https://mobify.com">Mobify</a>, I helped develop their Progressive Web App framework, launched a marketing engagement tool called Connection Center, and did UI design and development for several native app projects including <a target="_blank" href="https://itunes.apple.com/ca/app/ritchie-bros./id1068567213">Ritchie Bros.</a> for iOS and Android.</p>
			<p>Feel free to get in touch!</p>
			<a href="mailto:hello@zacharyhalvorson.com">hello@zacharyhalvorson.com</a>
		</Text>
  </ContentWrapper>
)

export default IndexPage
