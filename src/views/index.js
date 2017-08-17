const handlebars = require('handlebars')
console.log('working dir for views')
console.log(__dirname)

const Helpers = require('../lib/helpers')

handlebars.registerHelper("equal", require("handlebars-helper-equal"))

handlebars.registerHelper( 'concat', function(){
  var arg = Array.prototype.slice.call(arguments,0);
  arg.pop();
  return arg.join('');
})

handlebars.registerHelper( 'stringify', function(variable){
  var arg = JSON.stringify(variable);
  return arg;
})

handlebars.registerHelper( 'parse', function(variable){
  try{
  var arg = JSON.parse(variable);
} catch(e){
  return variable
}

  return arg;
})
handlebars.registerHelper( 'showhide', function(){
  var arg = Array.prototype.slice.call(arguments,0);
  arg.pop();
  var htmlContent='';
  htmlContent+=''
  htmlContent+='<details>'
  htmlContent+='<summary><span class="summary" tabindex="0">'+arg[0]+'</span></summary>'
  htmlContent+='<div class="panel panel-border-narrow">'
  htmlContent+='<h3 class="heading-small">'+arg[1]+'</h3>'
  htmlContent+=arg[2]
  htmlContent+='</div>'
  htmlContent+='</details>'
  return htmlContent;
})

handlebars.registerHelper( 'guid', function(){
  return Helpers.createGUID();
})

const Path = require('path')

module.exports = {
  engines: {
    html: handlebars
  },
  relativeTo: __dirname,
  path: Path.join(__dirname, ''),
  layoutPath: Path.join(__dirname, 'govuk_template_mustache/layouts'),
  layout: 'govuk_template',
  partialsPath: Path.join(__dirname, 'partials/')
}
