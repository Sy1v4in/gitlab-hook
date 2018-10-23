const { notifyAssignee } = require('./common')

async function onEvent (event) {
  const newAssigneeId = event.changes.assignee_id && event.changes.assignee_id.current

  if (newAssigneeId) {
    await notifyAssignee({
      event,
      assigneeId: newAssigneeId
    })
  }
}

module.exports = {
  onEvent
}
