'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../index')

lab.experiment('Before hook', () => {

  lab.before('Initialise server', (done) => {
    server.initialize()
      .then(done);
  });


});
