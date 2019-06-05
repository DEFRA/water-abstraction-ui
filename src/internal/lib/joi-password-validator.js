'use strict';
module.exports = (joi) => ({

  name: 'string',

  base: joi.string(),

  language: {
    uppercase: 'must contain an uppercase character',
    symbol: 'must contain a symbol',
    length: 'must be at least 8 characters long'
  },

  rules: [
    {
      name: 'requireUppercase',
      validate (params, value, state, options) {
        if (!/[A-Z]/.test(value)) {
          return this.createError('string.uppercase', {}, state, options);
        }
        return value;
      }
    },
    {
      name: 'requireSymbol',
      validate (params, value, state, options) {
        if (!/[^a-zA-Z\d\s]/.test(value)) {
          return this.createError('string.symbol', {}, state, options);
        }
        return value;
      }
    }
  ]

});
