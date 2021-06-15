const session = require('./session');

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request);

  if (checkStageReached === true) {
    return h.redirect(request.path.replace(/\/[^\/]*$/, '/check'));
  } else {
    return h.redirect(request.path.replace(/\/[^\/]*$/, '/alert-type'));
  }
};

exports.redirectTo = redirectTo;
