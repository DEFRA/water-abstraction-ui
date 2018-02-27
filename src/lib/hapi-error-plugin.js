/**
* HAPI error plugin
* allows us to handle Joi errors and display an error page to the user
* this is based on the hapi-error plugin: https://github.com/dwyl/hapi-error
* however we needed a method to alter the view context being sent to the template
*
* @module lib/hapi-error-plugin
*/
const {contextDefaults} = require('./view');
const errorPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreResponse',
      method: (request, reply) => {
        const res = request.response;

        // ALWAYS Log the error
        server.log('error', res);

        // Create view context
        const view = contextDefaults(request);

        // Boom errors
        if (res.isBoom) {
          const {statusCode} = res.output;

          // Unauthorised
          if (statusCode >= 401 && statusCode <= 403) {
            return reply.redirect('/signin');
          }
          // Not found
          if (statusCode === 404) {
            view.pageTitle = "We can't find that page";
            return reply.view('water/404.html', view).code(statusCode);
          }
          // Other errors
          view.pageTitle = 'Something went wrong';
          return reply.view('water/error.html', view).code(statusCode);
        }

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

errorPlugin.register.attributes = {
  name: 'errorPlugin',
  version: '1.0.0'
};

module.exports = errorPlugin;
