const { get } = require('lodash');
const { getContinueField, getCsrfTokenField, getHeadingField, getParagraphField } =
 require('shared/modules/returns/forms/common');

const { getLineFields, schema } = require('shared/modules/returns/forms/quantities');

const { formFactory, setValues } = require('shared/lib/forms');
const { getLineValues } = require('../lib/return-helpers');

exports.form = (request, data) => {
  const isMeasured = get(data, 'reading.type') === 'measured';

  const f = {
    ...formFactory(),
    fields: [
      getCsrfTokenField(request),
      getHeadingField('Your abstraction volumes'),
      ...getLineFields(data),
      getContinueField()
    ]
  };

  if (isMeasured) {
    f.fields.splice(2, 0, getParagraphField('Remember if you have a x10 meter you need to multiply your volumes.'));
  }

  const values = getLineValues(data.lines);

  return setValues(f, values);
};

exports.schema = schema;
