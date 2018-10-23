const gitlab = require('../gitlab')
const log = require('../log')
const slack = require('../slack')
const slackGitlab = require('../slack-gitlab')

async function onEvent (event) {
  const slackUsersToNotify = await getSlackUsersToNotify(event)

  log.debug(`Notifying slack users:`, slackUsersToNotify)

  const commentAuthorId = event.object_attributes.author_id
  const commentAuthorSlackUsername = await slackGitlab.getSlackUsernameByGitlabUserId(commentAuthorId)

  const comment = event.object_attributes.note
  const commitHash = event.commit.id
  const commitShortHash = commitHash.slice(0, 8)
  const commitMessage = event.commit.message.split('\n')[0]
  const linkToComment = event.object_attributes.url

  return Promise.all(slackUsersToNotify.map(slackUser =>
    slack.sendMessage({
      channel: `@${slackUser}`,
      text: `${commentAuthorSlackUsername} <${linkToComment}|commented on commit ${commitShortHash}> *${commitMessage}*`,
      attachments: [
        {
          text: comment,
          color: '#36a64f'
        }
      ]
    }))
  )
}

async function getSlackUsersToNotify (event) {
  const commitAuthorSlackUsername = await getCommitAuthorSlackUsername(event)
  const commentParticipantsSlackUsernames = await getDiscussionParticipantsSlackUsernames(event)
  const mentionedSlackUsernames = await getMentionedSlackUsernames(event)

  const commentAuthorId = event.object_attributes.author_id
  const commentAuthorSlackUsername = await slackGitlab.getSlackUsernameByGitlabUserId(commentAuthorId)

  const slackUsersToNotify = [
    commitAuthorSlackUsername,
    ...commentParticipantsSlackUsernames,
    ...mentionedSlackUsernames
  ].filter(slackUser =>
    slackUser && slackUser !== commentAuthorSlackUsername
  )

  return [...new Set(slackUsersToNotify)]
}

async function getCommitAuthorSlackUsername (event) {
  const commitAuthorEmail = event.commit.author.email
  const commitAuthorName = event.commit.author.name
  const commitAuthorSlackUsername = await slack.getUsernameByEmail(commitAuthorEmail) ||
    await slack.getUsernameByRealname(commitAuthorName)

  if (!commitAuthorSlackUsername) {
    log.error(`Couldn't find any Slack user with email ${commitAuthorEmail} or name ${commitAuthorName}`)
  }

  return commitAuthorSlackUsername
}

async function getDiscussionParticipantsSlackUsernames (event) {
  const projectId = event.project_id
  const commitHash = event.commit.id
  const position = event.object_attributes.position // null when the comment is not on a specific line, but on the commit itself
  const commentedFile = position ? position.new_path : null
  const commentedLine = position ? position.new_line : null
  let commentParticipantsSlackUsernames

  try {
    const commentParticipantsGitlabUserIds = await gitlab.getCommentParticipantsIdsOnCommit({
      projectId,
      commitHash,
      commentedFile,
      commentedLine
    })
    commentParticipantsSlackUsernames = await Promise.all(commentParticipantsGitlabUserIds.map(slackGitlab.getSlackUsernameByGitlabUserId))
  } catch (error) {
    log.error(`Couldn't get comment participants on commit`, { error: error.message, projectId, commitHash, commentedFile, commentedLine })
    commentParticipantsSlackUsernames = []
  }
  return commentParticipantsSlackUsernames
}

async function getMentionedSlackUsernames (event) {
  const comment = event.object_attributes.note

  return slackGitlab.getSlackUsernamesMentionedOnComment(comment)
}

module.exports = {
  onEvent
}
