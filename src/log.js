const winston = require('winston')

const consoleTransport = new winston.transports.Console({
  level: 'debug',
  timestamp: true,
  colorize: true,
  prettyPrint: true
})

const fileTransport = new winston.transports.File({
  filename: '/var/log/gitlab-hook/application.log',
  tailable: true,
  maxsize: 20 * 1024 * 1024,
  maxFiles: 10,
  level: 'debug',
  timestamp: true,
  json: false,
  colorize: true,
  prettyPrint: true
})

const logger = new winston.Logger({
  transports: [
    consoleTransport,
    fileTransport
  ]
})

module.exports = logger
