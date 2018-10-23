const onMergeRequestApproved = require('./on-merge-request-approved')
const onMergeRequestMerged = require('./on-merge-request-merged')
const onMergeRequestOpen = require('./on-merge-request-open')
const onMergeRequestUpdated = require('./on-merge-request-updated')

function getEventHandler (event) {
  switch (event.object_attributes.action) {
    case 'open':
    case 'reopen':
      return onMergeRequestOpen
    case 'update':
      return onMergeRequestUpdated
    case 'approved':
      return onMergeRequestApproved
    case 'merge':
      return onMergeRequestMerged
    default:
      return null
  }
}

module.exports = {
  getEventHandler
}
