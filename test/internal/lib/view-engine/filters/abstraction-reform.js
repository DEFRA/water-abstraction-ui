'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  mapARComparisonTable,
  ARConditionPlaceholder
} = require('../../../../../src/internal/lib/view-engine/filters/abstraction-reform');

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
