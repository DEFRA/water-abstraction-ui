const staticPage = async (request, h) => {
  return h.view(request.config.view, request.view, { layout: false });
};

exports.staticPage = staticPage;
