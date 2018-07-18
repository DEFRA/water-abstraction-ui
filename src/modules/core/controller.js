const index = async (request, h) => {
  const { permissions } = request;
  if (permissions && permissions.admin.defra) {
    return h.redirect('/admin/licences');
  } else {
    return h.redirect('/licences');
  }
};

module.exports = {
  index
};
