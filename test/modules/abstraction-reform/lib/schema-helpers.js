const Lab = require('lab');
const { expect } = require('code');

const lab = exports.lab = Lab.script();

const {
  getSchemaCategories
} = require('../../../../src/modules/abstraction-reform/lib/schema-helpers');

lab.experiment('getSchemaCategories', () => {
  const schema = [
    {
      id: 'id-1',
      category: 'Category A',
      title: 'Schema A'
    },
    {
      id: 'id-2',
      category: 'Category A',
      subcategory: 'Subcategory A',
      title: 'Schema B'
    },
    {
      id: 'id-3',
      category: 'Category A',
      subcategory: 'Subcategory A',
      title: 'Schema C'
    },
    {
      id: 'id-4',
      category: 'Category B',
      title: 'Schema D'
    }
  ];

  lab.test('It should get a report filename', async () => {
    const result = getSchemaCategories(schema);

    expect(result).to.equal([{
      'title': 'Category A',
      'slug': 'category-a',
      'subcategories': [
        {
          'title': '',
          'schemas': [
            'id-1'
          ]
        },
        {
          'title': 'Subcategory A',
          'schemas': [
            'id-2',
            'id-3'
          ]
        }
      ]
    },
    {
      'title': 'Category B',
      'slug': 'category-b',
      'subcategories': [
        {
          'title': '',
          'schemas': [
            'id-4'
          ]
        }
      ]
    }
    ]);
  });
});
