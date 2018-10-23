const request = require('request-promise')
const { URL } = require('url')
const log = require('./log')

const GITLAB_API_URL = process.env.GITLAB_API_URL
const GITLAB_API_KEY = process.env.GITLAB_API_KEY // access token created on user Administrator

async function getCommentParticipantsIdsOnCommit ({ projectId, commitHash, commentedFile, commentedLine }) {
  const comments = await getCommentsOnCommit({ projectId, commitHash })

  const authorIds = comments
    .filter(comment => comment.path === commentedFile && comment.line === commentedLine)
    .map(comment => comment.author.id)

  return [...new Set(authorIds)]
}

async function getCommentsOnCommit ({ projectId, commitHash }) {
  return apiCallUnpaginated(`/projects/${projectId}/repository/commits/${commitHash}/comments`)
}

async function getDiscussionsOnMergeRequest ({ projectId, mrId }) {
  return apiCallUnpaginated(`/projects/${projectId}/merge_requests/${mrId}/discussions`)
}

async function listUsers () {
  return apiCallUnpaginated(`/users`)
}

async function getUserByUserId (userId) {
  try {
    const user = await apiCall(`/users/${userId}`)
    log.debug(`Fetched Gitlab user with ID: ${userId}`, user)
    return user
  } catch (error) {
    switch (error.statusCode) {
      case 404:
        log.error(`Couldn't find any Gitlab user with ID ${userId}`)
        return null
      default:
        throw error
    }
  }
}

async function getUserByUsername (username) {
  const users = await apiCall(`/users?username=${username}`)
  log.debug(`Fetched Gitlab user with username: ${username}`, { users })
  return users[0]
}

async function apiCallUnpaginated (path) {
  let allResults = []
  let currentPageResults = []

  let page = 1
  const perPage = 100 // maximum

  do {
    currentPageResults = await apiCall(path, { page, perPage })
    allResults = [...allResults, ...currentPageResults]
    page++
  } while (currentPageResults.length === perPage)

  return allResults
}

async function apiCall (path, options = {}) {
  log.debug('Calling Gitlab API:', { path })

  const url = new URL(GITLAB_API_URL + path)
  const searchParams = url.searchParams
  if (options.page != null) {
    searchParams.set('page', options.page)
  }
  if (options.perPage != null) {
    searchParams.set('per_page', options.perPage)
  }

  return request.get(url.toString(), {
    headers: {
      'PRIVATE-TOKEN': GITLAB_API_KEY
    },
    json: true
  })
}

function getMentionedUsernames (comment) {
  const mentionRegex = /(?:^|[\s(,])@(\w+)/g

  let matches
  const users = []

  // eslint-disable-next-line
  while (matches = mentionRegex.exec(comment)) {
    const user = matches[1]
    users.push(user)
  }

  return users
}

async function getMentionedUsers (comment) {
  const mentionedUsernames = getMentionedUsernames(comment)
  const mentionedUsers = await Promise.all(mentionedUsernames.map(getUserByUsername))
  return mentionedUsers.filter(user => user != null)
}

module.exports = {
  getCommentParticipantsIdsOnCommit,
  getCommentsOnCommit,
  getDiscussionsOnMergeRequest,

  getMentionedUsernames,
  getMentionedUsers,

  getUserByUserId,
  getUserByUsername,
  listUsers
}
