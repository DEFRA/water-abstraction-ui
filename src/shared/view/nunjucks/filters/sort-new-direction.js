const sortNewDirection = (query, field) => {
  const { direction, sort } = query;
  return (direction === 1) && (sort === field) ? -1 : 1;
};

exports.sortNewDirection = sortNewDirection;
