const socialEmbed = {
	cardType: "summary",
	contentType: "website",
	url: "http://www.zacharyhalvorson.com",
	site: "@zachhalvorson",
	title: "Zachary Halvorson",
	description: "I'm a designer focused on digital interaction and product design.",
	image: "http://zacharyhalvorson.com/embed-image.png"
};

module.exports = {
  siteMetadata: {
    title: `Zachary Halvorson 🐔`,
		meta: [
			{ name: 'description', content: 'Zachary Halvorson is a digital designer focused on digital interaction and product design.' },
			{ name: 'keywords', content: 'product, product design, ui design, ux design, design, vancouver' },
			{ name: 'viewport', content: 'width=device-width' },
			{ name: 'twitter:card', content: socialEmbed.cardType },
			{ name: 'twitter:site', content: socialEmbed.site },
			{ name: 'twitter:title', content: socialEmbed.title },
			{ name: 'twitter:description', content: socialEmbed.description },
			{ name: 'twitter:image', content: socialEmbed.image },
			{ property: 'og:title', content: socialEmbed.title },
			{ property: 'og:description', content: socialEmbed.description },
			{ property: 'og:type', content: socialEmbed.contentType },
			{ property: 'og:url', content: socialEmbed.url },
			{ property: 'og:image', content: socialEmbed.image }
		]
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
