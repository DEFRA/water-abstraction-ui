'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const DOMParser = require('xmldom').DOMParser;

const { expect } = require('code');
const server = require('../../../index.js');
const { formFactory, fields } = require('../../../src/lib/forms');

const simple = ['Red', 'Green', 'Blue'];

const complex = [{
  id: 'r',
  value: 'Red'
}, {
  id: 'g',
  value: 'Green'
}, {
  id: 'b',
  value: 'Blue'
}];

// Add route to render form control
server.route({
  method: 'GET',
  path: '/test/forms/field/dropdown',
  handler: async (request, h) => {
    // Create form
    const form = formFactory('/submit');

    // Simple array dropdowns
    form.fields.push(fields.dropdown('dropdown_1', { label: 'Dropdown 1', choices: simple }));
    form.fields.push(fields.dropdown('dropdown_2', { label: 'Dropdown 2', choices: simple }, simple[1]));

    // Complex dropdowns
    form.fields.push(fields.dropdown('dropdown_3', { label: 'Dropdown 3', choices: complex, key: 'id', value: 'value' }));
    form.fields.push(fields.dropdown('dropdown_4', { label: 'Dropdown 4', choices: complex, key: 'id', value: 'value' }, complex[2]));

    // Error state
    const field = fields.dropdown('dropdown_5', { label: 'Dropdown 2', choices: complex, key: 'id', value: 'value' }, complex[2]);
    field.errors = [{
      field: 'dropdown_5',
      message: 'Error with dropdown 5',
      summary: 'Error with dropdown 5'
    }];
    form.fields.push(field);

    return h.view('test/forms', { form });
  },
  config: {
    auth: false
  }
});

lab.experiment('Dropdown fields', () => {
  let dom;

  lab.before(async () => {
    const response = await server.inject({
      url: '/test/forms/field/dropdown'
    });

    dom = new DOMParser().parseFromString(response.payload);
  });

  lab.test('It should render a dropdown with scalar values', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_1');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');
    expect(options).to.have.length(4);
    expect(options[1].firstChild.nodeValue).to.equal(simple[0]);
    expect(options[2].firstChild.nodeValue).to.equal(simple[1]);
    expect(options[3].firstChild.nodeValue).to.equal(simple[2]);

    const selected = options.map(option => option.getAttribute('selected'));
    expect(selected).to.equal([ '', '', '', '' ]);
  });

  lab.test('It should select the correct dropdown option', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_2');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');

    const selected = options.map(option => option.getAttribute('selected'));
    expect(selected).to.equal([ '', '', 'selected', '' ]);
  });
});
