const { get } = require('lodash');
const { isHoF } = require('./conditions');
const helpers = require('shared/lib/view-licence-helpers');

/**
 * Gets the licence page title based on the view, licence number and custom title
 * @param {String} view - the handlebars view
 * @param {String} licenceNumber - the licence number
 * @param {String} [customTitle] - if set, the custom name given by user to licence
 * @return {String} page title
 */
function getLicencePageTitle (view, licenceNumber, customName) {
  const titles = {
    purposes: `Abstraction details`,
    points: `Abstraction points`,
    conditions: `Conditions held`,
    contact: `Contact details`,
    'gauging-station': `Gauging station`
  };

  const key = view.split('/').pop();

  if (!titles[key]) {
    return {
      pageTitle: `Licence number ${licenceNumber}`,
      pageHeading: `Licence number ${licenceNumber}`
    };
  }

  return {
    pageTitle: `${titles[key]} for ${customName || licenceNumber}`,
    pageHeading: `${customName ? 'Licence' : titles[key] + ' for licence'} number ${licenceNumber}`
  };
}

const getCommonViewContext = request => {
  const view = helpers.getCommonViewContext(request);
  view.summary.conditions = get(view, 'summary.conditions', []).map(condition => ({
    ...condition,
    isHof: isHoF(condition)
  }));
  return view;
};

exports.getLicencePageTitle = getLicencePageTitle;
exports.getCommonViewContext = getCommonViewContext;
