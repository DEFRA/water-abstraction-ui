const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

exports.request = rp;
