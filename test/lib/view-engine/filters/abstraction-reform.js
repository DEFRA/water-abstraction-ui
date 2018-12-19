'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  mapARComparisonTable,
  ARConditionDescription,
  ARConditionPlaceholder
} = require('../../../../src/lib/view-engine/filters/abstraction-reform.js');

lab.experiment('mapARComparisonTable', () => {
  const data = {
    base: {
      ID: 123,
      DESCR: 'description'
    },
    reform: {
      ID: 123,
      DESCR: 'new description'
    }
  };

  const result = mapARComparisonTable(data);

  lab.test('It should generate an object to pass to the GOV.UK table nunjucks component', async () => {
    expect(result).to.equal({
      'head': [
        {
          'text': 'NALD field'
        },
        {
          'text': 'NALD data'
        },
        {
          'text': 'New value'
        }
      ],
      'rows': [
        [
          {
            'text': 'ID'
          },
          {
            'text': data.base.ID
          },
          {
            'text': null
          }
        ],

        [
          {
            'text': 'DESCR'
          },
          {
            'text': data.base.DESCR
          },
          {
            'text': data.reform.DESCR
          }
        ]
      ]
    });
  });
});

lab.experiment('ARConditionDescription', () => {
  lab.test('It should replace placeholders with values', async () => {
    const str = 'Text [foo] placeholders [bar]';
    const html = ARConditionDescription(str, { foo: 'bar', bar: 'foo' });
    expect(html).to.equal('Text <strong>bar</strong> placeholders <strong>foo</strong>');
  });
  lab.test('It should encode HTML entities to avoid injection', async () => {
    const str = '&<>';
    const html = ARConditionDescription(str, {});
    expect(html).to.equal('&amp;&lt;&gt;');
  });
});

lab.experiment('ARConditionPlaceholder', () => {
  lab.test('It should bold placeholders', async () => {
    const str = 'Text [foo] placeholders [bar]';
    const html = ARConditionPlaceholder(str);
    expect(html).to.equal('Text <strong>[foo]</strong> placeholders <strong>[bar]</strong>');
  });
  lab.test('It should encode HTML entities to avoid injection', async () => {
    const str = '&<>';
    const html = ARConditionPlaceholder(str, {});
    expect(html).to.equal('&amp;&lt;&gt;');
  });
});
