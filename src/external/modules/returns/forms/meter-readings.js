const { formFactory, setValues } = require('shared/lib/forms');
const { getMeter } = require('../lib/return-helpers');
const { get, set } = require('lodash');

const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common');
const { getStartReadingField, getLineFields, schema } =
  require('shared/modules/returns/forms/meter-readings');

const form = (request, data) => {
  const f = {
    ...formFactory(),
    fields: [
      getHeadingField('Enter your readings exactly as they appear on your meter'),
      getStartReadingField('Start reading (before you began abstracting in this period)'),
      ...getLineFields(data),
      getCsrfTokenField(request),
      getContinueField()
    ]
  };

  const readings = getMeter(data).readings || {};
  set(readings, 'startReading', get(data, 'meters[0].startReading'));
  return setValues(f, readings);
};

module.exports = { form, schema };
