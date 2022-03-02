const { v4: uuid } = require('uuid');
const { get } = require('lodash');
const noteSession = require('../../../modules/notes/lib/session');
const routing = require('../lib/routing');

const getChargeVersionWorkflowId = (request, sessionData = {}) => {
  const { query = {}, params = {} } = request;
  return [sessionData.chargeVersionWorkflowId, query.chargeVersionWorkflowId, params.chargeVersionWorkflowId].find(chargeVersionWorkflowId => chargeVersionWorkflowId);
};

const getNote = async (request, h) => {
  const { licenceId, noteId = uuid() } = request.params;
  const { draftChargeInformation = {}, licence = {} } = request.pre;
  const { userName, userId } = request.defra;
  const sessionData = noteSession.get(request, noteId) || {};
  const { note = get(draftChargeInformation, 'note.text'), redirectPath, status } = sessionData;
  const chargeVersionWorkflowId = getChargeVersionWorkflowId(request, sessionData);
  // When returning from the note page the redirectPath would have been set
  if (redirectPath) {
    // Set the draft information and redirect back to the review or check page
    request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, {
      note: {
        id: noteId,
        text: note,
        typeId: chargeVersionWorkflowId,
        user: {
          email: userName,
          id: userId
        }
      }
    });

    const checkAnswersRoute = status === 'review'
      ? routing.postReview(chargeVersionWorkflowId, licenceId)
      : routing.getCheckData(licenceId, { chargeVersionWorkflowId });

    return h.redirect(checkAnswersRoute);
  } else {
    // Prior to redirecting to the note page, retrieve the note
    const back = request.pre.draftChargeInformation.status === 'review'
      ? routing.postReview(chargeVersionWorkflowId, licenceId)
      : routing.getCheckData(licenceId, { chargeVersionWorkflowId });

    noteSession.set(request, noteId, {
      note,
      back,
      chargeVersionWorkflowId,
      pageTitle: 'Add a note',
      caption: `Licence ${licence.licenceNumber}`,
      hint: 'Provide a short explanation about the setup of this charge.',
      redirectPath: `${routing.getNote(licenceId)}/${noteId}`,
      status: draftChargeInformation.status
    });
    return h.redirect(`/note/${noteId}`);
  }
};

const deleteNote = async (request, h) => {
  const { licenceId, noteId = uuid() } = request.params;
  const sessionData = noteSession.get(request, noteId) || {};
  const chargeVersionWorkflowId = getChargeVersionWorkflowId(request, sessionData);
  await request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, { note: undefined });
  noteSession.clear(request, noteId);
  const checkAnswersRoute = request.pre.draftChargeInformation.status === 'review'
    ? routing.postReview(chargeVersionWorkflowId, licenceId)
    : routing.getCheckData(licenceId, { chargeVersionWorkflowId });
  return h.redirect(checkAnswersRoute);
};

module.exports.getNote = getNote;
module.exports.deleteNote = deleteNote;
