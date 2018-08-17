const Text = require('../types/text');

class Csrf {
  constructor (token) {
    this.token = token;
  }

  register (form) {
    form.add(new Text('csrf_token'));
    form.values.csrf_token = this.token;
  }
}

module.exports = Csrf;
