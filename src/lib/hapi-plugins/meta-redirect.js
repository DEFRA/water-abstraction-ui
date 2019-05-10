const { get } = require('lodash');

/**
 * Performs a redirection using a script/meta tag rather than HTTP header
 * This gets around issue where some browsers won't set cookies on non-200
 * status codes
 * @param  {String} redirectPath - path to redirect to
 */
const metaRedirect = function (redirectPath) {
  const nonce = get(this, 'request.plugins.blankie.nonces.script', {});
  const meta = `<meta http-equiv="refresh" content="0; url=${redirectPath}" />`;
  const script = `<script nonce=${nonce}>location.href='${redirectPath}';</script>`;
  const html = meta + script;
  return this.response(html);
};

module.exports = {
  register: (server, options) => {
    server.decorate('toolkit', 'metaRedirect', metaRedirect);
  },

  pkg: {
    name: 'metaRedirectPlugin',
    version: '1.0.0'
  }

};
