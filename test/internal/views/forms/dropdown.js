'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const DOMParser = require('xmldom').DOMParser;

const { expect } = require('code');
const server = require('../../../../server-internal');
const { formFactory, fields } = require('../../../../src/shared/lib/forms');

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

  lab.test('It should render a dropdown with simple values', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_1');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');
    expect(options).to.have.length(4);

    const text = options.map(option => option.firstChild.nodeValue);
    expect(text).to.equal(['(Select)', 'Red', 'Green', 'Blue']);

    // Check no option selected
    const selected = options.map(option => option.getAttribute('selected'));
    expect(selected).to.equal([ '', '', '', '' ]);

    // Check option values
    const values = options.map(option => option.getAttribute('value'));
    expect(values).to.equal([ '', 'Red', 'Green', 'Blue' ]);
  });

  lab.test('It should select the correct dropdown option for simple values', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_2');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');

    const selected = options.map(option => option.getAttribute('selected'));
    expect(selected).to.equal([ '', '', 'selected', '' ]);
  });

  lab.test('It should render a dropdown with complex values', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_3');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');
    expect(options).to.have.length(4);

    const text = options.map(option => option.firstChild.nodeValue);
    expect(text).to.equal(['(Select)', 'Red', 'Green', 'Blue']);

    // Check no option selected
    const selected = options.map(option => option.getAttribute('selected'));
    expect(selected).to.equal([ '', '', '', '' ]);

    // Check option values
    const values = options.map(option => option.getAttribute('value'));
    expect(values).to.equal([ '', 'r', 'g', 'b' ]);
  });

  lab.test('It should select the correct dropdown option for complex values', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_4');
    const options = Object.values(dropdown.childNodes).filter(ele => ele.tagName === 'option');

    const selected = options.map(option => option.getAttribute('selected'));

    expect(selected).to.equal([ '', '', '', 'selected' ]);
  });

  lab.test('It should render a field in an error state', async () => {
    const dropdown = dom.getElementById('dropdown-dropdown_5');

    // Dropdown should have error class
    expect(dropdown.getAttribute('class').split(' ').includes('form-control-error')).to.equal(true);

    // Parent should have error class
    const parent = dropdown.parentNode;
    expect(parent.getAttribute('class').split(' ').includes('form-group-error')).to.equal(true);

    // Error message should appear
    const label = parent.getElementsByTagName('label')[0];
    const error = label.getElementsByTagName('span')[0];

    expect(error.getAttribute('class')).to.equal('error-message');
    expect(error.firstChild.nodeValue).to.equal('Error with dropdown 5');
  });
});
