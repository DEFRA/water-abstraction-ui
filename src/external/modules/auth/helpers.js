const destroySession = async (request) => {
  try {
    await request.yar.destroy();
  } catch (err) {
    if (err.name !== 'NotFoundError' && err.name !== 'NoSessionCookieError') {
      throw err;
    }
  }
};

const authValidationErrorResponse = async (request, reply) => {
  return reply.view('water/auth/signin', {
    ...request.view,
    errors: {
      authentication: 1
    }
  });
};

module.exports = {
  destroySession,
  authValidationErrorResponse
};
