const onCommentOnCommit = require('./on-comment-on-commit')
const onCommentOnMergeRequest = require('./on-comment-on-merge-request')

function getEventHandler (event) {
  switch (event.object_attributes.noteable_type) {
    case 'MergeRequest':
      return onCommentOnMergeRequest
    case 'Commit':
      return onCommentOnCommit
    default:
      return null
  }
}

module.exports = {
  getEventHandler
}
