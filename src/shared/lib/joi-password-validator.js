'use strict';

const createRegexRule = (name, regex, key) => ({
  name,
  validate (params, value, state, options) {
    if (!regex.test(value)) {
      return this.createError(key, {}, state, options);
    }
    return value;
  }
});

module.exports = (joi) => ({

  name: 'string',

  base: joi.string(),

  language: {
    uppercase: 'must contain an uppercase character',
    symbol: 'must contain a symbol',
    length: 'must be at least 8 characters long'
  },

  rules: [
    createRegexRule('requireUppercase', /[A-Z]/, 'string.uppercase'),
    createRegexRule('requireSymbol', /[^a-zA-Z\d\s]/, 'string.symbol')
  ]

});
