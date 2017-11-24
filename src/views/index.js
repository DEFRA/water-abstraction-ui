const handlebars = require('handlebars')
const moment = require('moment')


console.log('working dir for views')
console.log(__dirname)

const Helpers = require('../lib/helpers')
const DynamicView = require('../lib/dynamicview')

handlebars.registerHelper('equal', require('handlebars-helper-equal'))

handlebars.registerHelper('concat', function () {
  var arg = Array.prototype.slice.call(arguments, 0)
  arg.pop()
  return arg.join('')
})

handlebars.registerHelper('dynamicView', function () {
  /**
  The dynamicView helper loads javascript renderers from the views/partials/jsPartials directory
  **/
  var args = Array.prototype.slice.call(arguments, 0).pop()
  var requestedFunction=args.hash.viewType
  if (DynamicView[requestedFunction]){
  return `${DynamicView[requestedFunction].getContent(args)}`
} else {
  return `Error: Unknown component: ${requestedFunction}`
}

})

handlebars.registerHelper('stringify', function (variable) {
  var arg = JSON.stringify(variable)
  return arg
})

handlebars.registerHelper('parse', function (variable) {
  try {
    var arg = JSON.parse(variable)
  } catch (e) {
    return variable
  }

  return arg
})
handlebars.registerHelper('showhide', function () {
  var arg = Array.prototype.slice.call(arguments, 0)
  arg.pop()
  var htmlContent = ''
  htmlContent += ''
  htmlContent += '<details>'
  htmlContent += '<summary><span class="summary" tabindex="0">' + arg[0] + '</span></summary>'
  htmlContent += '<div class="panel panel-border-narrow">'
  htmlContent += '<h3 class="heading-small">' + arg[1] + '</h3>'
  htmlContent += arg[2]
  htmlContent += '</div>'
  htmlContent += '</details>'
  return htmlContent
})

handlebars.registerHelper('guid', function () {
  return Helpers.createGUID()
})

handlebars.registerHelper('formatDate', function (dateInput) {
  console.log('formatDate')

  console.log(dateInput)
  var date = moment(dateInput, "MM/DD/YYYY")
  console.log(date)
  var isFutureDate = moment().isBefore(date);
  if(isFutureDate){
    date.subtract('year', 100)
  }
  console.log('Future date:' +isFutureDate)

  return date.isValid() ? date.format("D MMMM YYYY") : dateInput
})

handlebars.registerHelper('formatToDate', function (dateInput) {
  console.log('formatDate')

  console.log(dateInput)
  var date = moment(dateInput, "MM/DD/YYYY")

  return date.isValid() ? date.format("D MMMM YYYY") : dateInput
})

handlebars.registerHelper('formatPeriod', function (inputStart, inputEnd) {
  var tmp_inputStart=inputStart.split('-')[0]+'/'+inputStart.split('-')[1]+'/2000'
  var tmp_inputEnd=inputEnd.split('-')[0]+'/'+inputEnd.split('-')[1]+'/2000'
  var periodStart = moment(tmp_inputStart, "DD/MMM/YYYY")
  var periodEnd = moment(tmp_inputEnd, "DD/MMM/YYYY")
  return 'From ' + periodStart.format("D MMMM") + ' until ' + periodEnd.format("D MMMM")
})

handlebars.registerHelper('formatAddress', function (address) {
  var formattedAddress = address.addressLine1 + '<br/>'
  formattedAddress += address.addressLine2 ? address.addressLine2 + '<br/>' : ''
  formattedAddress += address.addressLine3 ? address.addressLine3 + '<br/>' : ''
  formattedAddress += address.addressLine4 ? address.addressLine4 + '<br/>' : ''
  formattedAddress += address.town ? address.town + '<br/>' : ''
  formattedAddress += address.county ? address.county + '<br/>' : ''
  formattedAddress += address.country ? address.country + '<br/>' : ''
  formattedAddress += address.postCode
  return formattedAddress
})

handlebars.registerHelper('ngrPoint', function (points) {
  function formatGridReference(reference) {
    // The length of one of the numbers in the NGR is the length of the whole thing
    // minus the two letters at the start, then divided by two (as there are two numbers)
    var accuracy = (reference.length - 2)/2
    return reference.substring(0, 2) + ' '
         + reference.substring(2, 2 + accuracy) + ' '
         + reference.substring(2 + accuracy);
  }

  var response = ''
  var point = points[0]

  if (point.ngr4) {
    response = `Within the area formed by the straight lines running between National Grid References `
      + formatGridReference(point.ngr1) + ', '
      + formatGridReference(point.ngr2) + ', '
      + formatGridReference(point.ngr3) + ' and '
      + formatGridReference(point.ngr4)
  } else if (point.ngr2) {
    response = `Between National Grid References ` + formatGridReference(point.ngr1) + ` and ` + formatGridReference(point.ngr2)
  } else {
    response = `At National Grid Reference ` + formatGridReference(point.ngr1)
  }

  return response
})

handlebars.registerHelper('maxQuantities', function (quantities) {
  return Number(quantities.maxDailyQuantity).toFixed(2) + ' cubic metres per day <br/>' + Number(quantities.maxAnnualQuantity).toFixed(2) + ' cubic metres per year'
})

handlebars.registerHelper('abstractionConditions', function (quantities) {
  return 'Abstraction conditions TODO:'
})

const Path = require('path')

const defaultContext = {
  assetPath: '/public/',
  topOfPage: 'Login Handler',
  head: '<link href="public/stylesheets/overrides.css" media="screen" rel="stylesheet" />',
  pageTitle: ' Generic Page',
  htmlLang: 'en',
  bodyClasses: 'some classes here',
  bodyStart: 'Body Start',
  skipLinkMessage: 'Skip to main content',
  cookieMessage: 'Cookie Message',
  headerClass: 'some classes here',
  homepageUrl: 'http://page/url',
  logoLinkTitle: 'Logo Link Title',
  globalHeaderText: 'GOV.UK',
  insideHeader: '',

  propositionHeader: '<div class="header-proposition"><div class="content"><nav id="proposition-menu"><a href="/?access=PB01" id="proposition-name">Manage your water abstraction or impoundment licence</a></nav></div></div>',
  afterHeader: '',
  footerTop: '',
  footerSupportLinks: '',
  licenceMessage: '<p>All content is available under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="license">Open Government Licence v3.0</a>, except where otherwise stated</p>',
  bodyEnd: ''
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
