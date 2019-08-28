const { formFactory, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');
const { getIsNilField } =
  require('shared/modules/returns/forms/amounts');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getIsNilField('Has water been abstracted in this return period?'),
    getContinueField()
  ]
}, { isNil: data.isNil });
