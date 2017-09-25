module.exports = {
  siteMetadata: {
    title: `Zachary Halvorson`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-styled-components`,
		{
			resolve: `gatsby-plugin-typography`,
			options: {
				pathToConfigModule: `src/utils/typography.js`,
			},
		},
  ],
  pathPrefix: `/`,
};