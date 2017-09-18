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
    <p>I’m currently with a start up in Vancouver, BC called Dooly. Building a business around a notes application that delivers realtime information to sales people to help them sell.</p>
    <p>At Mobify, I shipped numerous mobile web and native projects, as well as brought a</p>

		<a href="mailto:hello@zacharyhalvorson.com">hello@zacharyhalvorson.com</a>
  </ContentWrapper>
)

export default IndexPage
