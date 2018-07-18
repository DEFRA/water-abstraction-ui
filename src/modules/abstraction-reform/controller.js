const { loadLicence } = require('./lib/loader');
const { stateManager } = require('./lib/state-manager');
const { EDIT_PURPOSE } = require('./lib/action-types');
const { filterScalars } = require('./lib/helpers');

const actions = [{
  type: EDIT_PURPOSE,
  payload: {
    purposeId: 23376,
    data: {
      NOTES: 'Here are some lovely notes',
      ANNUAL_QTY: 1000000000
    },
    user: {
      id: 1234,
      email: 'jamescarmichael.defra@gmail.com'
    }
  }
}];

const getLicence = async (request, h) => {
  const { documentId } = request.params;

  // Load licence / AR licence from CRM
  const { licence, arLicence } = await loadLicence(documentId);

  // Setup initial state
  const initialState = {
    licence: licence.licence_data_value
  };

  const finalState = stateManager(initialState, actions);

  // Prepare purposes
  // @TODO - we will need to compare to check for deleted/added items
  const purposes = licence.licence_data_value.data.current_version.purposes.map((purpose, index) => {
    return {
      base: filterScalars(purpose),
      reform: filterScalars(finalState.licence.data.current_version.purposes[index])
    };
  });

  const view = {
    documentId,
    ...request.view,
    licence: licence.licence_data_value,
    purposes
  };

  return h.view('water/abstraction-reform/licence', view);
  // // const view = {
  // //   ...request.view,
  // //   licence: licence.licence_data_value,
  // //   arLicence: finalState.licence
  // // };
  //
  // console.log(purposes);
};

module.exports = {
  getLicence
};
