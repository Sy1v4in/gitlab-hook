const latinize = require('latinize')
const request = require('request-promise')
const log = require('./log')

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN // Slack bot's token

async function sendMessage ({ channel, text, attachments = null, username = 'Gitlab', emoji = ':gitlab:' }) {
  log.debug('Sending message on Slack', { channel, text, attachments })

  const payload = {
    channel,
    text,
    attachments,
    username,
    icon_emoji: emoji,
    as_user: false
  }

  return request.post({
    uri: SLACK_WEBHOOK_URL,
    json: true,
    body: payload
  })
}

function findUserByEmail ({ slackUsers, email }) {
  return email && slackUsers.find(slackUser => slackUser.profile.email === email)
}

function findUserByName ({ slackUsers, name }) {
  return name && slackUsers.find(slackUser => {
    const slackFullName = slackUser.real_name || slackUser.profile.real_name
    return slackFullName && latinize(slackFullName).toLowerCase() === latinize(name).toLowerCase()
  })
}

async function getUsernameByEmail (email) {
  const slackUsers = await listUsers()

  const user = findUserByEmail({ slackUsers, email })

  if (!user) {
    log.error(`No user found on Slack for email ${email}`)
    return null
  }

  log.info(`User ${user.name} found for email ${email}`)

  return user.name
}

async function getUsernameByRealname (name) {
  const slackUsers = await listUsers()

  const user = findUserByName({ slackUsers, name })

  if (!user) {
    log.error(`No user found on Slack for name ${name}`)
    return null
  }

  log.info(`User ${user.name} found for name ${name}`)

  return user.name
}

async function listUsers () {
  const { ok, error, members } = await request.post({
    uri: 'https://slack.com/api/users.list',
    json: true,
    form: {
      token: SLACK_API_TOKEN
    }
  })
  if (!ok) {
    log.error(`Couldn't list slack users`, { error })
    throw new Error(error)
  }
  return members
}

module.exports = {
  findUserByEmail,
  findUserByName,
  getUsernameByEmail,
  getUsernameByRealname,
  listUsers,
  sendMessage
}
