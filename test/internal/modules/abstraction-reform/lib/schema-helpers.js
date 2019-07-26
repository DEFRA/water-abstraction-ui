const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');

const lab = exports.lab = Lab.script();

const {
  getSchemaCategories,
  getSchemaCategory
} = require('internal/modules/abstraction-reform/lib/schema-helpers');

const schemas = [
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

const categories = [{
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
];

lab.experiment('getSchemaCategories', () => {
  lab.test('It should categorise an array of WR22 schemas by category and subcategory', async () => {
    const result = getSchemaCategories(schemas);
    expect(result).to.equal(categories);
  });
});

lab.experiment('getSchemaCategory', () => {
  lab.test('It should find the category of a WR22 schema by ID in an array of categories', async () => {
    const result = getSchemaCategory(categories, 'id-4');
    expect(result).to.equal(categories[1]);
  });

  lab.test('It should return undefined if not found', async () => {
    const result = getSchemaCategory(categories, 'not-in-list');
    expect(result).to.equal(undefined);
  });
});
