const { formFactory } = require('shared/lib/forms');
const { getHiddenField, getContinueField, getCsrfTokenField, getHeadingField, getParagraphField } =
 require('shared/modules/returns/forms/common');

exports.form = (request, data) => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getHeadingField('Delete return'),
    getParagraphField(`Are you sure you would like to erase this return? (${data.id})`),
    getHiddenField('returnId', data.id),
    getContinueField('Delete return')
  ]
});
