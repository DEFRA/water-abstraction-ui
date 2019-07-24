const { formFactory, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common');
const { getIsNilField } =
  require('shared/modules/returns/forms/amounts');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getHeadingField('Have you abstracted water in this return period?'),
    getIsNilField(data.isNil),
    getContinueField()
  ]
}, { isNil: data.isNil });
