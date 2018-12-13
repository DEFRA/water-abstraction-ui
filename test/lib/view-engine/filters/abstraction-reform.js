'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  mapARComparisonTable
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
