const path = require('path');
const Nunjucks = require('nunjucks');

module.exports = {
  compile: (src, options) => {
    console.log(options);

    const template = Nunjucks.compile(src, options.environment);

    return (context) => {
      return template.render(context);
    };
  },

  prepare: (options, next) => {
    const paths = [
      options.path,
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/'
    ];
    const config = {
      noCache: true
    };
    options.compileOptions.environment = Nunjucks.configure(paths, config);
    return next();
  }

};
