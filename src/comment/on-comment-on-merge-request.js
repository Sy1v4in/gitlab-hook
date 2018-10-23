const gitlab = require('../gitlab')
const log = require('../log')
const slack = require('../slack')
const slackGitlab = require('../slack-gitlab')

async function onEvent (event) {
  const slackUsersToNotify = await getSlackUsersToNotify(event)

  const commentAuthorId = event.object_attributes.author_id
  const commentAuthorSlackUsername = await slackGitlab.getSlackUsernameByGitlabUserId(commentAuthorId)

  const mrId = event.merge_request.iid
  const mrTitle = event.merge_request.title
  const comment = event.object_attributes.note
  const linkToComment = event.object_attributes.url

  return Promise.all(slackUsersToNotify.map(slackUser =>
    slack.sendMessage({
      channel: `@${slackUser}`,
      text: `${commentAuthorSlackUsername} <${linkToComment}|commented on merge request !${mrId}> *${mrTitle}*`,
      attachments: [
        {
          text: comment,
          color: '#36a64f'
        }
      ]
    })
  ))
}

async function getSlackUsersToNotify (event) {
  const mrAuthorSlackUsername = await getMrAuthorSlackUsername(event)
  const discussionParticipantsSlackUsernames = await getDiscussionParticipantsSlackUsernames(event)
  const mentionedSlackUsernames = await getMentionedSlackUsernames(event)

  const commentAuthorId = event.object_attributes.author_id
  const commentAuthorSlackUsername = await slackGitlab.getSlackUsernameByGitlabUserId(commentAuthorId)

  const slackUsersToNotify = [
    mrAuthorSlackUsername,
    ...discussionParticipantsSlackUsernames,
    ...mentionedSlackUsernames
  ].filter(slackUser => slackUser && slackUser !== commentAuthorSlackUsername)

  return [...new Set(slackUsersToNotify)]
}

async function getMrAuthorSlackUsername (event) {
  const mrAuthorId = event.merge_request.author_id
  return await slackGitlab.getSlackUsernameByGitlabUserId(mrAuthorId)
}

async function getDiscussionParticipantsSlackUsernames (event) {
  const projectId = event.project_id
  const mrId = event.merge_request.iid
  const discussionId = event.object_attributes.discussion_id
  const commentedLine = event.object_attributes.line_code

  let discussions = []
  try {
    discussions = await gitlab.getDiscussionsOnMergeRequest({ projectId, mrId })
  } catch (error) {
    log.error('Error getting comments on MR', { error })
  }
  log.debug('called getDiscussionsOnMergeRequest()', { discussions })

  let discussionComments
  const isCommentOnSpecificLine = commentedLine != null
  if (isCommentOnSpecificLine) {
    discussionComments = discussions.find(discussion => discussion.id === discussionId).notes
  } else {
    discussionComments = discussions
      .filter(discussion => discussion.individual_note)
      .map(discussion => discussion.notes)
      .reduce((acc, notes) => acc.concat(notes)) // flatten
  }

  log.debug('found discussionComments', { discussionComments })

  const discussionGitlabUserIds = [...new Set(
    discussionComments.map(comment => comment.author.id)
  )]

  return Promise.all(discussionGitlabUserIds.map(slackGitlab.getSlackUsernameByGitlabUserId))
}

async function getMentionedSlackUsernames (event) {
  const comment = event.object_attributes.note

  return slackGitlab.getSlackUsernamesMentionedOnComment(comment)
}

module.exports = {
  onEvent
}
