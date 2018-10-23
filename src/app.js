const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').load()

const log = require('./log')
const dispatcher = require('./dispatcher')

const app = express()

// Parse JSON-encoded bodies
app.use(bodyParser.json({
  limit: '10mb'
}))

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
}))

app.post('/', async function (req, res) {
  const event = req.body

  log.debug('[NEW EVENT]', { event })

  res.status(200).send('OK')

  try {
    await dispatcher.dispatch(event)
  } catch (error) {
    log.error(`Error handling event`, error)
  }
})

// eslint-disable-next-line
app.use((error, req) => {
  const { method, url, headers, body } = req
  log.error('Global error', { error, method, url, headers, body })
})

app.listen (8182, () => {
  log.info('Application started.')
  log.info('Listening...')
})
