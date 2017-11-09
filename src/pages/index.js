import React from 'react'
import Link from 'gatsby-link'
import styled, { extend } from 'styled-components'

import Me from '../assets/images/me.png'

import * as breaks from '../constants/breaks';

import * as Headings from '../components/Headings';
import P from '../components/P';
import ContentWrapper from '../components/ContentWrapper';

const SAMPLES = [
	{
		name: 'Dooly',
		url: 'dooly',
	},
	{
		name: 'Connection Center',
		url: 'connection-center',
	},
	{
		name: 'Ritchie Bros.',
		url: 'ritchie-bros',
	},
]

const HomePagePhoto = styled.img`
	transform: translateY(-20%);
	position: relative;
	display: block;
	z-index: 1;
	margin: 0 auto;
	width: 60%;
	opacity: 0.9;

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

const ResetList = styled.ul`
	list-style-type: none;
	margin: 0;
`

const WorkSamples = ({ samples }) =>
	<ResetList>
		{samples.map((sample, index) =>
			<li key={index}>
				<Link to={sample.url}>{sample.name}</Link>
			</li>
		)}
	</ResetList>

export default ({ data }) =>
  <ContentWrapper>
    <Headings.Hero>Zachary Halvorson is a digital product designer.</Headings.Hero>

		<HomePagePhoto src={Me} alt="A photo of me." title="Nice to meet you!" />

		<HomePageText>
			<P>I’ve worked on both web and native applications, and relish an opportunity to see a product through from research to implementation.</P>
			<P>Currently, I lead design at <a target="_blank" href="https://dooly.ai">Dooly</a>. We make a notetaking app that helps people sell.</P>
			<P>As a product designer at <a target="_blank" href="https://mobify.com">Mobify</a>, I helped develop their Progressive Web App framework, launched a marketing engagement tool called Connection Center, and did UI design and development for several native app projects including <a target="_blank" href="https://itunes.apple.com/ca/app/ritchie-bros./id1068567213">Ritchie Bros.</a> for iOS and Android.</P>
			<P>Feel free to get in touch! 👋</P>
			<Headings.H1>Work</Headings.H1>
			<h4>
        {data.allMarkdownRemark.totalCount} Posts
      </h4>
      {data.allMarkdownRemark.edges.map(({ node }) =>
				<div key={node.id}>
					<Link
						to={node.fields.slug}
						>
							<h2>
								{node.frontmatter.title}{" "}
								<span>— {node.frontmatter.date}</span>
							</h2>
							<p>
								{node.excerpt}
							</p>
						</Link>
				</div>
      )}
			<a href="mailto:hello@zacharyhalvorson.com">hello@zacharyhalvorson.com</a>
		</HomePageText>
  </ContentWrapper>

export const query = graphql`
  query IndexQuery {
    allMarkdownRemark(sort: {fields: [frontmatter___date], order: DESC}) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "DD MMMM, YYYY")
          }
					fields {
						slug
					}
          excerpt
        }
      }
    }
  }
`
