const { isInternal } = require('../../lib/permissions');

const index = async (request, h) => {
  if (isInternal(request)) {
    return h.redirect('/admin/licences');
  } else {
    return h.redirect('/licences');
  }
};

module.exports = {
  index
};
