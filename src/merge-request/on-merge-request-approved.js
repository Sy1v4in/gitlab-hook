const slack = require('../slack')
const slackGitlab = require('../slack-gitlab')

async function onEvent (event) {
  const mrAuthor = await slackGitlab.getSlackUsernameByGitlabUserId(event.object_attributes.author_id)
  const mrId = event.object_attributes.iid
  const mrTitle = event.object_attributes.title
  const mrUrl = event.object_attributes.url
  const approver = event.user.name

  return slack.sendMessage({
    channel: `@${mrAuthor}`,
    text: `${approver} approved <${mrUrl}|merge request !${mrId}>: *${mrTitle}*`,
    username: 'Approved MR',
    emoji: ':white_check_mark:'
  })
}

module.exports = {
  onEvent
}
