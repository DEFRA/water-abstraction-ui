'use strict';

/**
 *
 * @param {*} request
 */
const getFormAction = request => {
  const { path } = request;
  const { check } = request.query;
  return check ? `${path}?check=1` : path;
};
