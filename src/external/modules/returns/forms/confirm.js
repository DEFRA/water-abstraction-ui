const { formFactory } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

exports.form = request => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getContinueField('Submit')
  ]
});
