import React from 'react'
import { StaticQuery, graphql } from "gatsby"

import SocialImage from '../../images/socials'

import * as Styled from './style.js'

const SocialsListItem = ({
  url,
  name,
}) =>
  <li>
    <Styled.SocialsLink href={url} target="_blank" rel="noopener noreferrer">
      <img src={SocialImage[name.replace(/\s/g, '')]} />
      {name}
    </Styled.SocialsLink>
  </li>

export default () =>
  <StaticQuery
    query={graphql`
      query {
        site {
          siteMetadata {
            socials {
              name
              url
            }
          }
        }
        profileImage: file(relativePath: {eq: "it-me.jpg"}) {
          childImageSharp {
            fluid(maxWidth: 300) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    `}
    render={data => (
      <Styled.BioWrapper>
        <Styled.Intro>
          <p>
            {`Hey there, I'm `}
            <Styled.Name>Zachary Halvorson.</Styled.Name>
          </p>
          <p>I design and code for kicks, but also cash.</p>
          <p>I tend to focus on product strategy, prototyping, design systems, and interaction design.</p>
          <p>I'm currently leading design at <a href="https://dooly.ai" target="_blank" rel="noopener noreferrer">Dooly</a>, a note-taking app that serves real-time enablement information people on customer calls.</p>
        </Styled.Intro>


        <h2>Follow me</h2>

        <Styled.List>
          {data.site.siteMetadata.socials.map(item =>
            <SocialsListItem
              name={item.name}
              url={item.url}
            />
          )}
        </Styled.List>
      </Styled.BioWrapper>
    )}
  />
