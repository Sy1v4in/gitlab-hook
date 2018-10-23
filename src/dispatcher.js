const log = require('./log')
const commentDispatcher = require('./comment/dispatcher')
const mergeRequestDispatcher = require('./merge-request/dispatcher')

async function dispatch (event) {
  const eventHandler = getEventHandler(event)

  if (eventHandler) {
    return eventHandler.onEvent(event)
  }
}

function getEventHandler (event) {
  const eventType = event.object_kind

  switch (eventType) {
    case 'merge_request':
      return mergeRequestDispatcher.getEventHandler(event)
    case 'note':
      return commentDispatcher.getEventHandler(event)
    default:
      log.warn(`Unhandled event type: ${eventType}`)
      return null
  }
}

module.exports = {
  dispatch
}
