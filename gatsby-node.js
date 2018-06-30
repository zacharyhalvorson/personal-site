// Implement the Gatsby API “onCreatePage”. This is
// called after every page is created.
exports.onCreatePage = async ({ page, boundActionCreators }) => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    if (page.path.match(/^\/work/)) {
      // It's assumed that `landingPage.js` exists in the `/layouts/` directory
      page.layout = "work";

      // Update the page.
      createPage(page);
    }

    resolve();
  });
};
