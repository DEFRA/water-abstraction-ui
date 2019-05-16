const Nunjucks = require('nunjucks');
const { addFilters } = require('./nunjucks-environment');

module.exports = {
  compile: (src, options) => {
    const template = Nunjucks.compile(src, options.environment);

    return (context) => {
      context.assetPath = '/public';
      return new Promise((resolve, reject) => {
        template.render(context, (err, str) => {
          if (!err) {
            return resolve(str);
          }
          reject(err);
        });
      });
    };
  },

  prepare: (options, next) => {
    const paths = [
      options.path,
      `${options.path}/nunjucks/macros/`,
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/'
    ];

    const config = {
      noCache: true
    };

    const env = Nunjucks.configure(paths, config);
    addFilters(env);

    options.compileOptions.environment = env;

    return next();
  }

};
