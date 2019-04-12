const getWaiting = (request, h) => {
  const { eventId } = request.params;
  return `Waiting for event ${eventId}`;
};

exports.getWaiting = getWaiting;
