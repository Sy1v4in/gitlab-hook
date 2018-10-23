const request = require('request-promise')
const gitlab = require('../gitlab')
const slack = require('../slack')
const slackGitlab = require('../slack-gitlab')

const RELEASE_NOTIFY_WEBHOOK = 'https://release-notify.codingame.com/webhook'

async function onEvent (event) {
  const targetBranch = event.object_attributes.target_branch
  const mergeStatus = event.object_attributes.state

  if (mergeStatus === 'merged' && targetBranch === 'master') {
    await notifyReleaseHook(event)
    await notifyMrAuthor(event)
  }
}

async function notifyReleaseHook (event) {
  const mrAuthor = await slackGitlab.getSlackUsernameByGitlabUserId(event.object_attributes.author_id)

  const payload = {
    type: 'merge_request_accepted',
    message: event.object_attributes.title,
    author: mrAuthor
  }
  await request.post({
    uri: RELEASE_NOTIFY_WEBHOOK,
    json: true,
    body: payload
  })
}

async function notifyMrAuthor (event) {
  const mrAuthor = await slackGitlab.getSlackUsernameByGitlabUserId(event.object_attributes.author_id)
  const mergerUsername = event.user.username
  const mergerUser = await gitlab.getUserByUsername(mergerUsername)

  const mergerSlackUsername = await slackGitlab.getSlackUsernameByGitlabUserId(mergerUser.id)

  if (mergerSlackUsername !== mrAuthor) {
    const mrId = event.object_attributes.iid
    const mrTitle = event.object_attributes.title
    const mrUrl = event.object_attributes.url
    const merger = event.user.name

    await slack.sendMessage({
      channel: `@${mrAuthor}`,
      text: `${merger} merged <${mrUrl}|merge request !${mrId}>: *${mrTitle}*`,
      username: 'Merged MR',
      emoji: ':merge:'
    })
  }
}

module.exports = {
  onEvent
}
