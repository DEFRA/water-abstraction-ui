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
        if (res.isBoom) {
          // ALWAYS Log the error
          server.log('error', res);

          // Output error page
          const view = contextDefaults(request);
          view.title = 'Something went wrong';
          return reply.view('water/error.html', view).code(res.output.statusCode);
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
