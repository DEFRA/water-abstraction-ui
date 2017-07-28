const handlebars = require('handlebars')
const Path = require('path')

const defaultContext = {
  assetPath: '/public/govuk_template/',
  topOfPage: 'Login Handler',
  head: '<link href="public/stylesheets/overrides.css" media="screen" rel="stylesheet" />',
  pageTitle: ' Generic Page',
  htmlLang: 'en',
  bodyClasses: 'some classes here',
  bodyStart: 'Body Start',
  skipLinkMessage: 'Skip Link Message',
  cookieMessage: 'Cookie Message',
  headerClass: 'some classes here',
  homepageUrl: 'http://page/url',
  logoLinkTitle: 'Logo Link Title',
  globalHeaderText: 'Global Header Text',
  insideHeader: 'Inside Header',
  propositionHeader: 'Proposition Header',
  afterHeader: 'After Header',
  footerTop: 'Footer Top',
  footerSupportLinks: 'Support links',
  licenceMessage: 'Licence Message',
  bodyEnd: 'Body End'
}

module.exports = {
  engines: {
    html: handlebars
  },
  relativeTo: __dirname,
  path: Path.join(__dirname, ''),
  layoutPath: Path.join(__dirname, 'govuk_template_mustache/layouts'),
  layout: 'govuk_template',
  partialsPath: Path.join(__dirname, 'partials/'),
  context: defaultContext
}
