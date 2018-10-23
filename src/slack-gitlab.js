const gitlab = require('./gitlab')
const log = require('./log')
const slack = require('./slack')

// Cache of usernames, indexed by Gitlab user IDs
let slackUsernames = {}
let slackUsernamesPromise = null

async function getSlackUsernamesMap () {
  const [ gitlabUsers, slackUsers ] = await Promise.all([ gitlab.listUsers(), slack.listUsers() ])

  return gitlabUsers.reduce(
    (slackUsernames, gitlabUser) => {
      const slackUser = slack.findUserByEmail({ slackUsers, email: gitlabUser.email }) ||
        slack.findUserByName({ slackUsers, name: gitlabUser.name })

      return { ...slackUsernames, [gitlabUser.id]: slackUser && slackUser.name }
    },
    {}
  )
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function initSlackUsernames (retry = 10) {
  if (retry < 0) {
    return
  }

  try {
    slackUsernames = await getSlackUsernamesMap()
    log.info('Initialized Slack usernames cache:', slackUsernames)
  } catch (error) {
    log.error('Error initializing Slack usernames', { error })
    await sleep(1000)
    await initSlackUsernames(retry - 1)
  }
}

async function getSlackUsernameByGitlabUserId (gitlabUserId) {
  if (!slackUsernamesPromise) {
    slackUsernamesPromise = initSlackUsernames()
  }

  await slackUsernamesPromise

  const slackUsername = slackUsernames[gitlabUserId]

  if (slackUsername) {
    return slackUsername
  } else {
    const fetchedSlackUsername = await fetchSlackUsernameByGitlabUserId(gitlabUserId)
    slackUsernames[gitlabUserId] = fetchedSlackUsername
    return fetchedSlackUsername
  }
}

async function fetchSlackUsernameByGitlabUserId (gitlabUserId) {
  const gitlabUser = await gitlab.getUserByUserId(gitlabUserId)

  if (!gitlabUser) {
    return null
  }

  const slackUsername = await slack.getUsernameByEmail(gitlabUser.email) ||
    await slack.getUsernameByRealname(gitlabUser.name)

  if (!slackUsername) {
    log.error(`Couldn't find any Slack user with email ${gitlabUser.email} or name ${gitlabUser.name}`)
  }

  return slackUsername
}

async function getSlackUsernamesMentionedOnComment (comment) {
  const mentionedUsers = await gitlab.getMentionedUsers(comment)

  return Promise.all(mentionedUsers.map(user => getSlackUsernameByGitlabUserId(user.id)))
}

module.exports = {
  getSlackUsernameByGitlabUserId,
  getSlackUsernamesMap,
  getSlackUsernamesMentionedOnComment
}
