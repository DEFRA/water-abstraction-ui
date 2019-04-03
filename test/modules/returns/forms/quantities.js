const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();
const { filter } = require('lodash');
const { quantitiesForm } = require('../../../../src/modules/returns/forms/quantities');

const createRequest = () => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    query: {
      returnId: 'test-return-id'
    }
  };
};

const createReturn = (type = 'measured') => {
  return {
    reading: {
      units: 'l',
      type
    },
    lines: [],
    requiredLines: []
  };
};
const isParagraph = (field) => {
  return field.options.widget === 'paragraph';
};

experiment('quantitiesForm', () => {
  test('adds help text about x10 meters if measured volumes', async () => {
    const form = quantitiesForm(createRequest(), createReturn());
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.include('Remember if you have a x10 meter you need to multiply your volumes.');
  });

  test('does not add help text about x10 meters if measured volumes', async () => {
    const form = quantitiesForm(createRequest(), createReturn('estimated'));
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.not.include('Remember if you have a x10 meter you need to multiply your volumes.');
  });
});
