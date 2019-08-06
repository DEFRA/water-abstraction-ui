const { getManageTabConfig } = require('./lib/manage-nav');

/**
 * Renders manage tab
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply interface
 */
const getManageTab = async (request, h) => {
  const view = {
    ...request.view,
    ...getManageTabConfig(request)
  };
  return h.view('nunjucks/notifications/manage-tab.njk', view, { layout: false });
};

exports.getManageTab = getManageTab;
