const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

module.exports = {
  request: rp
};
