const session = require('./session');

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request);

  if (checkStageReached === true) {
    // eslint-disable-next-line no-useless-escape
    return h.redirect(request.path.replace(/\/[^\/]*$/, '/check'));
  } else {
    // eslint-disable-next-line no-useless-escape
    return h.redirect(request.path.replace(/\/[^\/]*$/, path));
  }
};

exports.redirectTo = redirectTo;
