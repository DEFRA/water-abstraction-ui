

const pathToTemplates=__dirname+'/../views/partials/jsPartials/'


/**
dynamically require all .js files in views/partials/jsPartials/, for use in

  {{#dynamicView viewType="example" viewData=this}}{{/dynamicView}}

  Usage:

    {{#dynamicView viewType="[name of .js file]" viewData=[data to send to function]}}{{/dynamicView}}

handlebars templates
**/

require('fs').readdirSync(pathToTemplates).forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    console.log(`registered template ${pathToTemplates}${file} as ${name}`)
    exports[name] = require(pathToTemplates+file);
  }
});
