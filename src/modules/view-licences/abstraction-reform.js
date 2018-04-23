const Boom = require('boom');

const CRM = require('../../lib/connectors/crm');
const IDM = require('../../lib/connectors/idm');
const Permit = require('../../lib/connectors/permit');
const LicenceTransformer = require('../../lib/licence-transformer/');
//const errorHandler = require('../lib/error-handler');
const _ = require('lodash');
const moment = require('moment');

const {
  getLicences: baseGetLicences
} = require('./base');

/**
 * Gets list of licences in abstraction reform section
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} reply - the HAPI HTTP response
 */
async function getLicences(request, reply) {
  const {
    view
  } = request;

  // Only show result set if a query has been made
  if ('licenceNumber' in request.query) {
    view.showResults = true;
  }

  return baseGetLicences(request, reply);
}

/**
 * Main AR entry page
 */
function menu(request, reply) {
  const {
    view
  } = request;
  return reply.view('ar/main',view);
}

async function updateLicence(request, reply) {
  console.log("updateLicence")
  console.log("got payload")
  console.log(request.payload)
  // get current AR licence

  //fetch current AR data (if it exists)
  var {
    error: ARPermitError,
    data: ARPermitData
  } = await Permit.licences.findOne(request.payload.ar_licence_id);

  if (!ARPermitData) {
    //it doesn't exist so initialise empty
    ARPermitData = {}
    var AR_licence_data_value = {}
    console.log('***NO AR licence')
  } else {
    //it exists, get the licence data value
    console.log('***found existing AR licence')
    var AR_licence_data_value = ARPermitData.licence_data_value
  }

  //init object for licence_data_value object
  const new_licence_data_value = {};
  //merge payload objects into permit repo object
  for (var f in request.payload) {
    if (f == 'ar_licence_id') {
      //don't include licence id
    } else {
      pathArray = f.split('.').reverse()
      //  console.log(pathArray)
      var obj = request.payload[f]
      //console.log('rebuilding...')
      for (var p in pathArray) {
        if (p == -1) {

        } else {
          if (parseInt(pathArray[p]) == pathArray[p]) {
            //console.log('array')
            var newObj = []
          } else {
            //console.log('Object')
            var newObj = {}
          }
          newObj[pathArray[p]] = obj
          obj = newObj
        }

      }

      if (pathArray[p] == "licence") {
        _.merge(new_licence_data_value, {
          "AR_data": obj
        })
      } else if (pathArray[p] == "purposes") {
        _.merge(new_licence_data_value, {
          "AR_data": obj
        })
      } else if (pathArray[p] == "party") {
        _.merge(new_licence_data_value, {
          "AR_data": obj
        })
      } else if (pathArray[p] == "address") {
        _.merge(new_licence_data_value, {
          "AR_data": obj
        })
      }
    }

  }


  //compare
  const diff = deepCompare(AR_licence_data_value, new_licence_data_value)

  diff.changes = []

  for (var i in diff.missing_from_first) {
    var ref = `${diff.missing_from_first[i]}`
    refArray = ref.split('.')
    var ci = new_licence_data_value
    while (refArray.length > 0) {
      var el = refArray.shift()
      ci = ci[el]
    }
    diff.changes.push({
      action: 'add',
      ref: diff.missing_from_first[i],
      new: ci
    })
  }


  for (var i in diff.missing_from_second) {
    var ref = `${diff.missing_from_second[i]}`
    if (ref != 'AR_log' && ref != 'AR_state') {
      refArray = ref.split('.')
      var ci = AR_licence_data_value
      while (refArray.length > 0) {
        var el = refArray.shift()
        ci = ci[el]
      }
      diff.changes.push({
        action: 'remove',
        ref: diff.missing_from_second[i],
        old: ci
      })

    }
  }


  for (var i in diff.different) {
    var ref = `${diff.different[i]}`
    refArray = ref.split('.')
    var ci = new_licence_data_value
    var ci2 = AR_licence_data_value
    while (refArray.length > 0) {
      var el = refArray.shift()
      ci = ci[el]
      ci2 = ci2[el]
    }
    diff.changes.push({
      action: 'change',
      ref: diff.different[i],
      new: ci,
      old: ci2
    })
  }


  delete diff.different
  delete diff.missing_from_first
  delete diff.missing_from_second


  //get licence zero to ensure any key elements are included
  const {
    error: ARP0permitError,
    data: ARZeroPermitData
  } = await Permit.licences.findMany({
    licence_type_id: 9,
    licence_ref: '0'
  });

  const licenceZero = ARZeroPermitData[0]
  _.merge(licenceZero, new_licence_data_value)


  //  console.log(licence_data_value)
  //  console.log("NEW LICENCE =>")
  //  console.log(JSON.stringify(licence_data_value))






  delete ARPermitData.licence_search_key
  delete ARPermitData.is_public_domain
  ARPermitData.licence_start_dt = '2018-01-01'
  ARPermitData.licence_end_dt = '2098-01-01'
  delete ARPermitData.licence_id
  delete ARPermitData.licence_summary
  console.log('update ' + request.payload.ar_licence_id)



  ARPermitData.licence_ref = request.payload.licence_ref
  ARPermitData.licence_regime_id = licenceZero.licence_regime_id
  ARPermitData.licence_type_id = licenceZero.licence_type_id

  ARPermitData.licence_status_id = 1
  //add key elemets to permit repo data ... ARPermitData


  if (!new_licence_data_value.AR_log) {
    new_licence_data_value.AR_log = []
  }
  if (!new_licence_data_value.AR_state) {
    new_licence_data_value.AR_state = {}
  }


  if (request.payload.ar_licence_id == 0) {


    new_licence_data_value.AR_log.push({
      "data": diff.changes,
      "type": "INIT",
      "timestamp": moment()
    })
    new_licence_data_value.AR_state = {
      "comment": request.payload['AR_state.comment'],
      "state_code": request.payload['AR_state.state_code'],
      "modified_date": moment()
    }

    ARPermitData.licence_data_value = JSON.stringify(new_licence_data_value)


    var {
      data,
      error
    } = await Permit.licences.create(ARPermitData);
    console.log(data)
    console.log(error)
    console.log('created?')
    return reply.redirect('/AR/licences/' + request.params.licence_id);
  } else {
    new_licence_data_value.AR_log = AR_licence_data_value.AR_log
    new_licence_data_value.AR_log.push({
      "data": diff.changes,
      "type": "UPDATE",
      "timestamp": moment()
    })
    new_licence_data_value.AR_state = {
      "comment": request.payload['AR_state.comment'],
      "state_code": request.payload['AR_state.state_code'],
      "modified_date": moment()
    }

    ARPermitData.licence_data_value = JSON.stringify(new_licence_data_value)



    try {
      var {
        data,
        rowCount,
        error
      } = await Permit.licences.updateOne(request.payload.ar_licence_id, ARPermitData);
      console.log("data returned")
      console.log(data)
      console.log("rowCount")
      console.log(rowCount)
      console.log("error")
      if (error) {
        return reply(error)
      }
      console.log(error)
    } catch (e) {
      //  console.log(e)
    }
    return reply.redirect('/ar/licences/' + request.params.licence_id);
  }
  //TODO: identify changes...
  //TODO: add log entry...
  //TODO: use create when AR not defined
  //TODO: manage workflow with dropdowns
  //TODO: add new elements AND add new elements to nested objects

  //TODO: redirect after update...





}


var deepCompare = function(a, b) {

  var result = {
    different: [],
    missing_from_first: [],
    missing_from_second: []
  };

  _.reduce(a, function(result, value, key) {
    if (b.hasOwnProperty(key)) {
      if (_.isEqual(value, b[key])) {
        return result;
      } else {
        if (typeof(a[key]) != typeof({}) || typeof(b[key]) != typeof({})) {
          //dead end.
          result.different.push(key);
          return result;
        } else {
          var deeper = deepCompare(a[key], b[key]);
          result.different = result.different.concat(_.map(deeper.different, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_second = result.missing_from_second.concat(_.map(deeper.missing_from_second, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_first = result.missing_from_first.concat(_.map(deeper.missing_from_first, (sub_path) => {
            return key + "." + sub_path;
          }));
          return result;
        }
      }
    } else {
      result.missing_from_second.push(key);
      return result;
    }
  }, result);

  _.reduce(b, function(result, value, key) {
    if (a.hasOwnProperty(key)) {
      return result;
    } else {
      result.missing_from_first.push(key);
      return result;
    }
  }, result);

  return result;
}


async function getLicence(request, reply) {
  const {
    view
  } = request;
    const { entity_id: entityId } = request.auth.credentials;
    view.activeNavLink = 'view';


    var ARLicence={}

    // Get filtered list of licences
    const filter = {
      entity_id: entityId,
      document_id: request.params.licence_id
    };


    try {
      // Get CRM data
      const response = await CRM.documents.getLicences(filter);

      if (response.error) {
        throw Boom.badImplementation(`CRM error`, response);
      }
      if (response.data.length !== 1) {
        throw new Boom.notFound('Document not found in CRM', response);
      }
      view.crmData = response.data[0];

      // Get permit repo data
      const {error: permitError, data: permitData} = await Permit.licences.findOne(response.data[0].system_internal_id);


      if (permitError) {
        throw permitError;
      }

      // Handle object/JSON string
      const {licence_data_value: licenceData} = permitData;


      //load permit zero (baseplate for all AR permits)
      const {error: AR0permitError, data: ARZeroPermitData} = await Permit.licences.findMany({licence_type_id:9,licence_ref:'0'});
      //load AR permit (if it exists)
      const {error: ARpermitError, data: ARpermitData} = await Permit.licences.findMany({licence_type_id:9,licence_ref:response.data[0].system_external_id});


      if(ARpermitData){

    console.log('***existing AR licence')
      } else {
    console.log('***NO AR licence')
      }




      const data = typeof (licenceData) === 'string' ? JSON.parse(licenceData) : licenceData;

      // base AR licence
      const ARZero = ARZeroPermitData[0].licence_data_value;
      // any entered AR licence data

      try{

        ARLicence = ARpermitData[0].licence_data_value;


      } catch(e){
      }


      // nald licence
      const NALDlicence = data;
// not to self : licence_data is where the lcence goes - to leave room for ARZero (baseplate) and ARLicence (overlay)

//      view.megalicence={...NALDlicence,...ARZero,...ARLicence}


        const ARlicence_full=_.merge(ARZero, ARLicence);



if(ARpermitData && ARpermitData[0] && ARpermitData[0].licence_data_value){
        view.licenceAR=ARpermitData[0].licence_data_value
}else {
          view.licenceAR={licence:{},AR_state: {comment: "", state_code: "NEW", modified_date: ""}}
}

        view.licenceNALD=data





        const megalicence=_.merge({},NALDlicence, {data:{current_version:ARlicence_full.AR_data}});



//      Object.assign(NALDlicence,ARZero,ARLicence)


      require('fs').writeFileSync('../nald-licence.json', JSON.stringify(data, null, 2));

      const transformer = new LicenceTransformer();
      await transformer.load(data);


      view.megalicence=megalicence

//      view.licenceRaw=data
      view.licence_id = request.params.licence_id;

      console.log("ARlicence_id")
      console.log(JSON.stringify(ARpermitData))
      if (ARpermitData[0] && ARpermitData[0].licence_id){
      view.ar_licence_id = ARpermitData[0].licence_id;
    } else {
      view.ar_licence_id = 0;
    }

      view.licenceData = transformer.export();



      // Page title
      const { document_custom_name: customName } = view.crmData;
      const { licenceNumber } = view.licenceData;
      view.pageTitle = _getLicencePageTitle(view, licenceNumber, customName);
      view.name = 'name' in view ? view.name : customName;

      return reply.view('AR/licence',view);
    } catch (error) {
      return reply(new Boom.badImplementation('CRM error', error));
    }
  }


  /**
   * Gets the licence page title based on the view, licence number and custom title
   * @param {String} view - the handlebars view
   * @param {String} licenceNumber - the licence number
   * @param {String} [customTitle] - if set, the custom name given by user to licence
   * @return {String} page title
   */
  function _getLicencePageTitle (view, licenceNumber, customName) {
    if (view === 'water/licences_purposes') {
      return `Abstraction purposes for ${customName || licenceNumber}`;
    }
    if (view === 'water/licences_points') {
      return `Abstraction points for ${customName || licenceNumber}`;
    }
    if (view === 'water/licences_conditions') {
      return `Conditions held for ${customName || licenceNumber}`;
    }
    if (view === 'water/licences_contact') {
      return 'Your licence contact details';
    }
    // Default view/rename
    return customName ? `Licence name ${customName}` : `Licence number ${licenceNumber}`;
  }

module.exports = {
  getLicences,
  menu,
  updateLicence,
  getLicence
};
