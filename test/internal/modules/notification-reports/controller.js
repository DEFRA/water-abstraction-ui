const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/notifications-reports/controller');
const services = require('internal/lib/connectors/services');

experiment('getNotification', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.water.events, 'findOne').resolves({
      data: {
        event_id: 'test-event-id',
        metadata: {
          taskConfigId: 'test-task-config-id'
        }
      }
    });

    sandbox.stub(services.water.taskConfigs, 'findOne').resolves({
      data: {
        id: 'test-task-id'
      }
    });

    sandbox.stub(services.water.notifications, 'findMany').resolves({
      data: [
        { status: 'delivered' }
      ]
    });

    request = {
      params: {
        id: 'test-params-id'
      },
      view: {}
    };

    h = sandbox.spy();
    h.view = sandbox.spy();

    await controller.getNotification(request, h);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the expected view template', async () => {
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/notifications-reports/report.njk');
  });

  test('gets the event using the id param from the request', async () => {
    expect(services.water.events.findOne.calledWith('test-params-id')).to.be.true();
  });

  test('adds the event to the view context', async () => {
    const [, viewContext] = h.view.lastCall.args;
    expect(viewContext.event.metadata.taskConfigId).to.equal('test-task-config-id');
  });

  test('uses the taskConfig id from the event to get the task config', async () => {
    expect(services.water.taskConfigs.findOne.calledWith('test-task-config-id')).to.be.true();
  });

  test('adds the task to the view context', async () => {
    const [, viewContext] = h.view.lastCall.args;
    expect(viewContext.task.id).to.equal('test-task-id');
  });

  test('gets the notitications using the event id', async () => {
    expect(services.water.notifications.findMany.calledWith({
      event_id: 'test-event-id'
    })).to.be.true();
  });

  test('adds the messages to the view context', async () => {
    const [, viewContext] = h.view.lastCall.args;
    expect(viewContext.messages[0].badgeStatus.text).not.to.be.undefined();
  });

  test('adds the back URL to the view context', async () => {
    const [, viewContext] = h.view.lastCall.args;
    expect(viewContext.back).to.equal('/notifications/report');
  });
});
