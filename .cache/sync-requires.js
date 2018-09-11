// prefer default export if available
const preferDefault = m => m && m.default || m


exports.components = {
  "component---src-pages-404-js": preferDefault(require("/Users/zachary/Documents/GitHub/personal-site/src/pages/404.js")),
  "component---src-pages-index-js": preferDefault(require("/Users/zachary/Documents/GitHub/personal-site/src/pages/index.js")),
  "component---src-pages-resume-js": preferDefault(require("/Users/zachary/Documents/GitHub/personal-site/src/pages/resume.js"))
}

exports.json = {
  "layout-index.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/layout-index.json"),
  "404.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/404.json"),
  "layout-index.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/layout-index.json"),
  "index.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/index.json"),
  "layout-index.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/layout-index.json"),
  "resume.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/resume.json"),
  "layout-index.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/layout-index.json"),
  "404-html.json": require("/Users/zachary/Documents/GitHub/personal-site/.cache/json/404-html.json")
}

exports.layouts = {
  "component---src-layouts-index-js": preferDefault(require("/Users/zachary/Documents/GitHub/personal-site/.cache/layouts/index.js"))
}