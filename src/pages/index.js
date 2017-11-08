import React from 'react'
import Link from 'gatsby-link'
import styled, { extend } from 'styled-components'

import Me from '../assets/images/me.png'

import * as breaks from '../constants/breaks';

import P from '../components/P';
import ContentWrapper from '../components/ContentWrapper';
import Heading from '../components/Heading';

const HomePageTitle = Heading.extend`
	
`

const HomePagePhoto = styled.img`
	transform: translateY(-20%);
	position: relative;
	display: block;
	z-index: 1;
	margin: 0 auto;
	width: 60%;
	opacity: 0.7;

	@media (min-width: ${breaks.BREAK_ONE}) {
		float: left;
		width: 16rem;
		transform: initial;

	}
`

const HomePageText = styled.div`
	@media (min-width: ${breaks.BREAK_ONE}) {
		padding-left: 2rem;
		float: right;
		width: calc(100% - 16rem);
	}
`

const IndexPage = () => (
  <ContentWrapper>
    <HomePageTitle>Zachary Halvorson is a digital product designer.</HomePageTitle>

		<HomePagePhoto src={Me} alt="A photo of me." title="Nice to meet you!" />

		<HomePageText>
			<P>I’ve worked on both web and native applications, and relish an opportunity to see a product through from research to implementation.</P>
			<P>Currently, I lead design at <a target="_blank" href="https://dooly.ai">Dooly</a>. We make a notetaking app that helps people sell.</P>
			<P>As a product designer at <a target="_blank" href="https://mobify.com">Mobify</a>, I helped develop their Progressive Web App framework, launched a marketing engagement tool called Connection Center, and did UI design and development for several native app projects including <a target="_blank" href="https://itunes.apple.com/ca/app/ritchie-bros./id1068567213">Ritchie Bros.</a> for iOS and Android.</P>
			<P>Feel free to get in touch! 👋</P>
			<a href="mailto:hello@zacharyhalvorson.com">hello@zacharyhalvorson.com</a>
		</HomePageText>
  </ContentWrapper>
)

export default IndexPage
