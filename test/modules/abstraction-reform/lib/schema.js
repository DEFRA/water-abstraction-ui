const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const schema = require('../../../../src/modules/abstraction-reform/lib/schema');

/*
 * When the json ref parser dereferences data the original schema object was mutated.
 *
 * This test ensures that next time the schema is requested, a new copy of the schema is
 * returned to prevent the caching effect of the singleton.
 */
experiment('getWR22', () => {
  test('returns clones of the data to protect against mutations', async () => {
    // get the schema
    const schemaA = schema.getWR22();

    // update the ref to a fake resolved value
    schemaA[0].properties.nald_condition.$ref = 'some data';

    // ensure that the original schema is returned without the mutation
    const schemaB = schema.getWR22();
    expect(schemaB[0].properties.nald_condition.$ref).to.equal('water://licences/conditions.json');
  });
});
