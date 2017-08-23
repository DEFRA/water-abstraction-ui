/**
this file generates example content for dynamic content accessible from handlebars

example usage in Handlebars HTML template:

  {{#dynamicView viewType="ExampleType" viewData=this}}{{/dynamicView}}

**/
function getContent() {
  console.log('called example component')
  //look: here are the available arguments...
  console.log(arguments)
  var response = `Example component called with access to ${arguments[0].path} view context`
  return response
}

module.exports = {
  getContent: getContent
}
