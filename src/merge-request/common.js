const slack = require('../slack')
const slackGitlab = require('../slack-gitlab')

async function notifyAssignee ({ event, assigneeId }) {
  const assignee = await slackGitlab.getSlackUsernameByGitlabUserId(assigneeId)

  const mrId = event.object_attributes.iid
  const mrTitle = event.object_attributes.title
  const mrUrl = event.object_attributes.url

  await slack.sendMessage({
    channel: `@${assignee}`,
    text: `You've been assigned to the <${mrUrl}|merge request !${mrId}>: *${mrTitle}*`,
    emoji: ':spock-hand:'
  })
}

module.exports = {
  notifyAssignee
}
