
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { withQueryStringSubset } = require('external/lib/url');

experiment('external/lib/url', () => {
  experiment('withQueryStringSubset', () => {
    test('returns the path only for an empty query string', async () => {
      const url = withQueryStringSubset('/test');
      expect(url).to.equal('/test');
    });

    test('returns the path only for an empty query string when includedKeys are passed', async () => {
      const url = withQueryStringSubset('/test', {}, ['one']);
      expect(url).to.equal('/test');
    });

    test('returns the path only for unmatched params', async () => {
      const url = withQueryStringSubset('/test', { two: 2 }, ['one']);
      expect(url).to.equal('/test');
    });

    test('includes the stated param when available', async () => {
      const url = withQueryStringSubset('/test', { one: 1 }, ['one']);
      expect(url).to.equal('/test?one=1');
    });

    test('includes multiple stated params', async () => {
      const query = { one: 1, two: 2 };
      const url = withQueryStringSubset('/test', query, ['one', 'two']);
      expect(url).to.equal('/test?one=1&two=2');
    });

    test('includes the stated subset params when many params on query string', async () => {
      const query = { one: 1, two: 2, three: 3, four: 4 };
      const url = withQueryStringSubset('/test', query, ['one', 'two']);
      expect(url).to.equal('/test?one=1&two=2');
    });

    test('can spread the subset keys', async () => {
      const query = { one: 1, two: 2 };
      const url = withQueryStringSubset('/test', query, 'one', 'two');
      expect(url).to.equal('/test?one=1&two=2');
    });
  });
});
