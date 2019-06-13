const Lab = require('lab');
const { expect } = require('code');
const sinon = require('sinon');
const { find } = require('lodash');

const loader = require('../../../../../src/internal/modules/abstraction-reform/lib/loader');
const formGenerator = require('../../../../../src/internal/modules/abstraction-reform/lib/form-generator');

const {
  getSchema, findDataItem, getAddFormAndSchema, getEditFormAndSchema,
  getLicenceVersion, addActionFactory, editActionFactory, persistActions,
  flattenData
} = require('../../../../../src/internal/modules/abstraction-reform/lib/wr22-helpers');

const lab = exports.lab = Lab.script();

lab.experiment('getSchema', () => {
  const id = '/wr22/2.1';

  lab.test('It should get a dereferenced WR22 schema by ID', async () => {
    const schema = getSchema(id);
    expect(schema).to.be.an.object();
    expect(schema.id).to.equal(id);
  });

  lab.test('It should throw an error if schema not found', async () => {
    const func = () => {
      getSchema('invalid');
    };
    expect(func).to.throw();
  });
});

lab.experiment('findDataItem', () => {
  const id = '2a0c5083-522e-412e-b124-1306a5a49cf8';

  const data = {
    licence: {
      arData: [
        {
          id
        }
      ]
    }
  };

  lab.test('It should find the data item by ID', async () => {
    const item = findDataItem(data, id);
    expect(item.id).to.equal(id);
  });

  lab.test('It should throw an error if not found', async () => {
    const func = () => {
      findDataItem(data, 'invalid');
    };
    expect(func).to.throw();
  });
});

const testSchema = {
  type: 'object',
  properties: {
    str: {
      type: 'string'
    }
  }
};

lab.experiment('getAddFormAndSchema', () => {
  let stub, result;

  const request = {
    params: {
      documentId: '18fd9617-0427-4cdd-9adc-28fc155031b1',
      schema: '/wr22/2.1'
    },
    view: {
      csrfToken: 'e50eb5fd-f1ac-41f6-8e67-cb3371d39f14'
    }
  };

  lab.before(async () => {
    stub = sinon.stub(formGenerator, 'dereference').resolves(testSchema);
    result = await getAddFormAndSchema(request);
  });

  lab.after(async () => {
    stub.restore();
  });

  lab.test('It should return the schema', async () => {
    expect(result.schema).to.equal(testSchema);
  });

  lab.test('The form should be an object', async () => {
    expect(result.form).to.be.an.object();
  });

  lab.test('The form should have the correct action attribute', async () => {
    expect(result.form.action).to.equal(`/digitise/licence/${request.params.documentId}/add-data/${request.params.schema}`);
  });

  lab.test('It should have a CSRF token field in the form', async () => {
    const csrf = find(result.form.fields, item => item.name === 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });
});

lab.experiment('getEditFormAndSchema', () => {
  let dereferenceStub, loaderStub, result;

  const id = '442c0cb7-72b4-4011-8295-4dd7373d48cf';

  const request = {
    params: {
      documentId: '18fd9617-0427-4cdd-9adc-28fc155031b1',
      id
    },
    view: {
      csrfToken: 'e50eb5fd-f1ac-41f6-8e67-cb3371d39f14'
    }
  };

  const finalState = {
    licence: {
      arData: [{
        id,
        schema: '/wr22/2.1',
        content: {
          str: 'test'
        }
      }]
    }
  };

  lab.before(async () => {
    dereferenceStub = sinon.stub(formGenerator, 'dereference').resolves(testSchema);
    loaderStub = sinon.stub(loader, 'load').resolves({ finalState });
    result = await getEditFormAndSchema(request);
  });

  lab.after(async () => {
    dereferenceStub.restore();
    loaderStub.restore();
  });

  lab.test('It should return the schema', async () => {
    expect(result.schema).to.equal(testSchema);
  });

  lab.test('The form should be an object', async () => {
    expect(result.form).to.be.an.object();
  });

  lab.test('The form should have the correct action attribute', async () => {
    expect(result.form.action).to.equal(`/digitise/licence/${request.params.documentId}/edit-data/${id}`);
  });

  lab.test('It should have a CSRF token field in the form', async () => {
    const field = find(result.form.fields, item => item.name === 'csrf_token');
    expect(field.value).to.equal(request.view.csrfToken);
  });

  lab.test('Values from the arData in the finalstate should populate the form', async () => {
    const field = find(result.form.fields, item => item.name === 'str');
    expect(field.value).to.equal('test');
  });
});

lab.experiment('getLicenceVersion', () => {
  const getData = (issueNumber, incrementNumber) => {
    return {
      licence_data_value: {
        data: {
          current_version: {
            licence: {
              ISSUE_NO: issueNumber,
              INCR_NO: incrementNumber
            }
          }
        }
      }
    };
  };

  lab.test('It should get the increment and issue number from the data', async () => {
    const data = getData(100, 5);
    const { issueNumber, incrementNumber } = getLicenceVersion(data);
    expect(issueNumber).to.equal(100);
    expect(incrementNumber).to.equal(5);
  });

  lab.test('It should always return integers', async () => {
    const data = getData('100', '5');
    const { issueNumber, incrementNumber } = getLicenceVersion(data);
    expect(issueNumber).to.equal(100);
    expect(incrementNumber).to.equal(5);
  });
});

const getLicenceData = (issueNumber, incrementNumber) => {
  return {
    licence_data_value: {
      data: {
        current_version: {
          licence: {
            ISSUE_NO: issueNumber,
            INCR_NO: incrementNumber
          }
        }
      }
    }
  };
};

const defra = {
  userId: 'b643ae0d-29dd-4d57-a475-98152dedbd42',
  userName: 'mail@example.com'
};

lab.experiment('addActionFactory', () => {
  const request = {
    params: {
      schema: 'xyz'
    },
    defra
  };

  lab.test('It should create an add data action', async () => {
    const action = addActionFactory(request, getLicenceData('100', '1'));
    expect(action).to.be.an.object();
    expect(action.type).to.equal('add.data');
  });
});

lab.experiment('editActionFactory', () => {
  const request = {
    params: {
      id: 'xyz'
    },
    defra
  };

  lab.test('It should create an edit data action', async () => {
    const action = editActionFactory(request, getLicenceData('100', '1'));
    expect(action).to.be.an.object();
    expect(action.type).to.equal('edit.data');
  });
});

lab.experiment('persistActions', () => {
  let stub;

  const licence = getLicenceData('100', '1');
  const arLicence = {
    licence_id: 123,
    licence_data_value: {
      actions: [ { type: 'existing-action' } ]
    }
  };

  lab.before(async () => {
    stub = sinon.stub(loader, 'update');
  });

  lab.after(async () => {
    stub.restore();
  });

  lab.test('It should update the AR licence with new actions', async () => {
    const newActions = [{ type: 'new-action' }];
    await persistActions(licence, arLicence, newActions);

    const [id, data] = stub.firstCall.args;
    expect(id).to.equal(arLicence.licence_id);
    expect(data.actions).to.equal([...arLicence.licence_data_value.actions, ...newActions]);
  });
});

lab.experiment('flattenData', () => {
  const data = {
    foo: 'bar',
    bar: {
      baz: 'x',
      bar: 'y'
    },
    picklistItem: {
      id: 'foo',
      value: 'bar'
    }
  };

  lab.test('It should flatten a nested object so all properties are at root level', async () => {
    const result = flattenData(data);
    expect(result).to.equal({
      foo: 'bar',
      baz: 'x',
      bar: 'y',
      picklistItem: {
        id: 'foo',
        value: 'bar'
      }
    });
  });
});

exports.lab = lab;
