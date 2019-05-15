const { expect } = require('code');
const { test, experiment } = exports.lab = require('lab').script();
const { mapFields } = require('../../../../src/external/lib/forms/mapFields');

const square = x => x ** 2;

experiment('mapFields', () => {
  test('applies the function to any top level fields', async () => {
    const form = { fields: [1, 2, 3] };
    const mapped = mapFields(form, square);
    expect(mapped.fields).to.only.include([1, 4, 9]);
  });

  test('applies the function to any child objects with fields', async () => {
    const form = {
      fields: [1, 2, 3],
      one: 'nothing here',
      two: {
        fields: [4, 5, 6],
        leave: 'this alone though'
      }
    };
    const mapped = mapFields(form, square);

    expect(mapped).to.equal({
      fields: [1, 4, 9],
      one: 'nothing here',
      two: {
        fields: [16, 25, 36],
        leave: 'this alone though'
      }
    });
  });

  test('does not mutate the form', async () => {
    const form = { fields: [1, 2, 3] };
    mapFields(form, square);
    expect(form.fields).to.only.include([1, 2, 3]);
  });

  test('handles objects without fields properties', async () => {
    const form = { one: 1, two: 2 };
    const mapped = mapFields(form, square);
    expect(mapped).to.equal(form);
  });
});
