const postReport = async (request, h) => {
  request.log(['warn', 'csp'], request.payload.toString('utf-8'));
  return h.response('logged').code(201);
};

module.exports = {
  postReport
};
