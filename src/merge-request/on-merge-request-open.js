const { notifyAssignee } = require('./common')

async function onEvent (event) {
  const assigneeId = event.object_attributes.assignee_id

  if (assigneeId) {
    await notifyAssignee({
      event,
      assigneeId
    })
  }
}

module.exports = {
  onEvent
}
