const staticPage = async (request, h) => {
  return h.view(request.config.view, request.view);
};

module.exports = {
  staticPage
};
