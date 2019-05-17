/**
 * Gets the smallest object that currently works as a test stub when
 * testing controller functions.
 *
 * It adds the most minimal content to meet the expectations of the
 * viewContextDefaults function in /src/external/lib/view.js.
 */
const getMinimalRequest = () => ({
  labels: {},
  url: {},
  auth: {},
  view: {}
});

module.exports = {
  getMinimalRequest
};
