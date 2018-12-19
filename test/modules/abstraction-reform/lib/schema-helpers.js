const Lab = require('lab');
const { expect } = require('code');

const lab = exports.lab = Lab.script();

const {
  getSchemaCategories
} = require('../../../../src/modules/abstraction-reform/lib/schema-helpers');

lab.experiment('getSchemaCategories', () => {
  const schema = [
    {
      category: 'Category A',
      title: 'Schema A'
    },
    {
      category: 'Category A',
      subcategory: 'Subcategory A',
      title: 'Schema B'
    },
    {
      category: 'Category A',
      subcategory: 'Subcategory A',
      title: 'Schema C'
    },
    {
      category: 'Category B',
      title: 'Schema D'
    }
  ];

  lab.test('It should get a report filename', async () => {
    const result = getSchemaCategories(schema);
    expect(result).to.equal({
      'Category A': {
        '-': [
          0
        ],
        'Subcategory A': [
          1,
          2
        ]
      },
      'Category B': {
        '-': [
          3
        ]
      }
    });
  });
});
