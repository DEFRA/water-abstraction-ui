const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { sortIcon } = require('shared/view/handlebars/helpers/sort');

experiment('shared/view/handlebars/helpers/sort', () => {
  experiment('sortIcon', () => {
    test('returns expected html for ascending sort', async () => {
      const args = {
        hash: {
          direction: 1,
          sort: 'same-value',
          field: 'same-value'
        }
      };

      const expectedHtml = '<span class="sort-icon" aria-hidden="true">&#x25B2;</span><span class="sr-only">descending</span>';
      const result = sortIcon(args);

      expect(result).to.equal(expectedHtml);
    });

    test('returns expected html for descending sort', async () => {
      const args = {
        hash: {
          direction: -1,
          sort: 'same-value',
          field: 'same-value'
        }
      };

      const expectedHtml = '<span class="sort-icon" aria-hidden="true">&#x25BC;</span><span class="sr-only">ascending</span>';
      const result = sortIcon(args);

      expect(result).to.equal(expectedHtml);
    });

    test('returns undefined when the sort does not equal the field', async () => {
      const args = {
        hash: {
          direction: 1,
          sort: 'test-sort',
          field: 'test-field'
        }
      };

      expect(sortIcon(args)).to.be.undefined();
    });
  });
});
