const Boom = require('boom');
const { getSessionData } = require('./lib/session-helpers');
const { getViewData } = require('./lib/helpers');

/**
 * Redirects user to view return rather than edit
 */
const redirectToReturn = (request, h) => {
  const { returnId } = request.query;
  const isInternal = request.permissions.hasPermission('admin.defra');
  const path = `${isInternal ? '/admin' : ''}/returns/return?id=${returnId}`;
  return h.redirect(path).takeover();
};

const preHandler = async (request, h) => {
  const { returnId } = request.query;

  try {
    const data = getSessionData(request);
    const view = await getViewData(request, data);

    // If no return ID in session, then throw error
    if (returnId !== data.returnId) {
      throw Boom.notFound(`Session return ${data.returnId} does match return in query ${returnId}`);
    }

    request.returns = {
      data,
      view,
      isInternal: request.permissions.hasPermission('admin.defra')
    };
  } catch (err) {
    // Return data was not found in session
    if (returnId) {
      return redirectToReturn(request, h);
    }

    throw err;
  }

  return h.continue;
};

const returnsPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, h) => {
        if (!request.route.settings.plugins.returns) {
          return h.continue;
        }
        return preHandler(request, h);
      }
    });
  },

  pkg: {
    name: 'returnsPlugin',
    version: '2.0.0'
  }
};

module.exports = returnsPlugin;
