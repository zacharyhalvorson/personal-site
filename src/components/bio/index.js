import React from 'react'
import { StaticQuery, graphql } from "gatsby"

import * as Styled from './style.js'

export default () =>
  <StaticQuery
    query={graphql`
      query {
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
        <Styled.Image
          alt="👋 Nice to meet you!" fluid={data.profileImage.childImageSharp.fluid}
        />

        <Styled.Intro>
          {`Hi, my name is `}
          <Styled.Name><span>Zach</span>ary Halvorson</Styled.Name>
        </Styled.Intro>

        <p>I design and code for kicks, but also cash.</p>
        <p>I tend to focus on product thinking, design systems, prototyping, and interaction design.</p>
        <p>I'm currently leading design at Dooly, a note-taking that serves real-time enablement information people on customer calls.</p>
      </Styled.BioWrapper>
    )}
  />
