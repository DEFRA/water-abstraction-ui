const footerSupportLinks = `
  <h2 class="sr-only">Support Links</h2>
  <ul>
    <li><a href="/cookies">Cookies</a></li>
    <li><a href="/privacy-policy">Privacy</a></li>
    <li><a href="/accessibility">Accessibility</a></li>
  </ul>
`;

const defaultContext = {
  assetPath: '/public/',
  topOfPage: null,
  head: '<link href="public/stylesheets/overrides.css" media="screen" rel="stylesheet" />',
  pageTitle: ' Generic Page',
  htmlLang: 'en',
  bodyClasses: 'some classes here',
  bodyStart: null,
  skipLinkMessage: 'Skip to main content',
  cookieMessage: 'GOV.UK use cookies to make the site simpler. <a href="/cookies">Find out more about cookies.</a>',
  headerClass: 'some classes here',
  homepageUrl: 'https://www.gov.uk/',
  logoLinkTitle: 'Logo Link Title',
  globalHeaderText: 'GOV.UK',
  insideHeader: '',

  propositionLinks: [],

  afterHeader: '',
  footerTop: '',
  footerSupportLinks,
  licenceMessage: '<p>All content is available under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="license">Open Government Licence v3.0</a>, except where otherwise stated</p>',
  bodyEnd: ''
};

module.exports = defaultContext;
