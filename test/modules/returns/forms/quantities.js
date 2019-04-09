const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();
const { filter } = require('lodash');
const { quantitiesForm } = require('../../../../src/modules/returns/forms/quantities');

const createRequest = (isInternal = true) => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    query: {
      returnId: 'test-return-id'
    },
    auth: {
      credentials: {
        scope: isInternal ? 'internal' : 'external'
      }
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
  const expectedText = 'Remember if you have a x10 meter you need to multiply your volumes.';
  const internalExpectedText = ['Volumes entered should be calculated manually.', 'Take into consideration the x10 display.'];

  test('adds help text about x10 meters if external and measured volumes', async () => {
    const form = quantitiesForm(createRequest(false), createReturn());
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.include(expectedText);
  });

  test('does not add help text about x10 meters if estimated volumes', async () => {
    const form = quantitiesForm(createRequest(), createReturn('estimated'));
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.not.include(expectedText);
  });

  test('does not add help text about x10 meters if is internal user', async () => {
    const form = quantitiesForm(createRequest(), createReturn());
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.not.include(expectedText);
  });

  test('adds internal help text for internal users', async () => {
    const form = quantitiesForm(createRequest(), createReturn());
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.include(internalExpectedText[0]);
    expect(text).to.include(internalExpectedText[1]);
  });

  test('does not add internal help text for external users', async () => {
    const form = quantitiesForm(createRequest(false), createReturn());
    const text = filter(form.fields, isParagraph).map(row => row.options.text);
    expect(text).to.not.include(internalExpectedText[0]);
    expect(text).to.not.include(internalExpectedText[1]);
  });
});
