module.exports = {
  siteMetadata: {
    title: `Zachary Halvorson | Digital Product Designer`,
    description: `This is my website. I like it quite a lot.`,
    socials: [
      {
        name: 'Github',
        url: 'https://github.com/zacharyhalvorson',
      },
      {
        name: 'Dribbble',
        url: 'https://dribbble.com/zacharyhalvorson',
      },
      {
        name: 'Twitter',
        url: 'https://twitter.com/zachhalvorson',
      },
      {
        name: 'Apple Music',
        url: 'https://itunes.apple.com/profile/zacharyhalvorson',
      },
    ]
  },
  plugins: [
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-39400249-1`,
        anonymize: true,
        respectDNT: true,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images/`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Zachary Halvorson`,
        short_name: `zachary`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#8899ff`,
        display: `minimal-ui`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/src/`,
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-styled-components`,
    `gatsby-transformer-remark`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
  `gatsby-plugin-offline`,
    `gatsby-plugin-netlify`
  ],
}
