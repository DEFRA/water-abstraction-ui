const Code = require('code')
const DOMParser = require('xmldom').DOMParser
const parser = new DOMParser()


module.exports = {

  /**
   * A helper method to check the response for the standard error page
   * and 500 status code
   */
  expect404Error : (res) => {

    // Check for 500 status code
    Code.expect(res.statusCode).to.equal(404);

    // Expect error page to have been rendered
    const doc = parser.parseFromString(res.payload, 'text/html')
    const elements = doc.getElementsByTagName('h1')
    Code.expect(elements).to.exist();

    // Check for the H1 title text on 500 page
    Code.expect(elements[0].firstChild.nodeValue).to.equal(`We can’t find that page`);

  },

  /**
   * A helper method to check the response for the standard error page
   * and 500 status code
   */
  expect500Error : (res) => {

    // Check for 500 status code
    Code.expect(res.statusCode).to.equal(500);

    // Expect error page to have been rendered
    const doc = parser.parseFromString(res.payload, 'text/html')
    const elements = doc.getElementsByTagName('h1')
    Code.expect(elements).to.exist();

    // Check for the H1 title text on 500 page
    Code.expect(elements[0].firstChild.nodeValue).to.equal('Something went wrong');

  }
}
