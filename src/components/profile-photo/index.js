import React from 'react'
import { StaticQuery, graphql } from "gatsby"

import SocialImage from '../../images/socials'

import * as Styled from './style.js'

export default () =>
  <StaticQuery
    query={graphql`
      query {
        profileImage: file(relativePath: {eq: "it-me.jpg"}) {
          childImageSharp {
            fluid(maxWidth: 600) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    `}
    render={data => (
      <Styled.ProfilePhotoWrapper>
        <Styled.Image
          alt="A photo of me."
          title="👋 Nice to meet you!"
          fluid={data.profileImage.childImageSharp.fluid}
        />
      </Styled.ProfilePhotoWrapper>
    )}
  />
