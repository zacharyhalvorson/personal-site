import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'

import Me from '../assets/images/me.png'

const PageTitle = styled.h1`
	font-weight: 900;
	text-transform: uppercase;
	position: relative;
	z-index: 2;
`

const ContentWrapper = styled.div`
	margin: 0 auto;
	padding: 1rem;
`

const MyPhoto = styled.img`
	transform: translateY(-20%);
	position: relative;
	display: block;
	z-index: 1;
	margin: 0 auto;
	width: 60%;
	opacity: 0.7;
`

const IndexPage = () => (
  <ContentWrapper>
    <PageTitle>Zachary Halvorson is a digital product designer.</PageTitle>

		<MyPhoto src={Me} alt="A photo of me." title="Nice to meet you!" />

    <p>I’ve worked on both web and native applications, and relish an opportunity to see a product through from research to implementation.</p>
    <p>Currently, I do the design stuff at a startup called <a target="_blank" href="https://dooly.ai">Dooly</a>. We make a note taking app that helps people sell.</p>
		<p>As a product designer at <a target="_blank" href="https://mobify.com">Mobify</a>, I helped develop their Progressive Web App Framework, launched a marketing engagement tool called Connection Center, and did UI design and development for several native app projects including <a target="_blank" href="https://itunes.apple.com/ca/app/ritchie-bros./id1068567213">Ritchie Brothers</a>.</p>

		<a href="mailto:hello@zacharyhalvorson.com">hello@zacharyhalvorson.com</a>
  </ContentWrapper>
)

export default IndexPage
