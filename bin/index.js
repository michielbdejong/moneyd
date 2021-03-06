#!/usr/bin/env node
const fs = require('fs')
const inquirer = require('inquirer')

require('yargs')
  .option('parent', {
    description: 'BTP host of your parent connector, e.g. "client.scyl.la"'
  })
  .option('secret', {
    description: 'XRP secret, "s..."'
  })
  .option('config', {
    alias: 'c',
    description: 'JSON config file'
  })
  .option('address', {
    description: 'XRP address. Can be derived from secret.',
    default: ''
  })
  .option('rippled', {
    default: 'wss://s1.ripple.com',
    description: 'Rippled server. Uses S1 server provided by Ripple by default.'
  })
  .option('name', {
    default: '',
    description: 'Name to assign to this channel. Must be changed if other parameters are changed.'
  })
  .command('start', 'launch moneyd', {}, argv => {
    if (argv.config) {
      const config = JSON.parse(fs.readFileSync(argv.config).toString())
      process.env.BTP_NAME = config.name || ''
      process.env.PARENT_BTP_HOST = config.parent || ''
      process.env.XRP_SECRET = config.secret || ''
      process.env.XRP_ADDRESS = config.address || ''
      process.env.XRP_SERVER = config.rippled || argv.rippled || ''
    } else {
      process.env.BTP_NAME = argv.name
      process.env.PARENT_BTP_HOST = argv.parent
      process.env.XRP_SECRET = argv.secret
      process.env.XRP_ADDRESS = argv.address
      process.env.XRP_SERVER = argv.rippled
    }

    console.log('set environment; starting moneyd')
    require('..')
  })
  .command('topup', 'pre-fund your balance with connector', {
    amount: {
      description: 'amount (in drops) to send to connector',
      default: 1000
    }
  }, argv => {
    if (argv.config) {
      const config = JSON.parse(fs.readFileSync(argv.config).toString())
      process.env.BTP_NAME = config.name || ''
      process.env.PARENT_BTP_HOST = config.parent || ''
      process.env.XRP_SECRET = config.secret || ''
      process.env.XRP_ADDRESS = config.address || ''
      process.env.XRP_SERVER = config.rippled || argv.rippled || ''
    } else {
      process.env.BTP_NAME = argv.name
      process.env.PARENT_BTP_HOST = argv.parent
      process.env.XRP_SECRET = argv.secret
      process.env.XRP_ADDRESS = argv.address
      process.env.XRP_SERVER = argv.rippled
    }

    console.log('set environment; starting moneyd')
    require('./settle.js')
  })
  .command('cleanup', 'clean up unused payment channels', {}, argv => {
    if (argv.config) {
      const config = JSON.parse(fs.readFileSync(argv.config).toString())
      process.env.XRP_SECRET = config.secret || ''
      process.env.XRP_ADDRESS = config.address || ''
      process.env.XRP_SERVER = config.rippled || argv.rippled || ''
    } else {
      process.env.XRP_SECRET = argv.secret
      process.env.XRP_ADDRESS = argv.address
      process.env.XRP_SERVER = argv.rippled
    }
    require('./cleanup.js')
  })
  .command('info', 'get info about your XRP account and payment channels', {}, argv => {
    if (argv.config) {
      const config = JSON.parse(fs.readFileSync(argv.config).toString())
      process.env.XRP_SECRET = config.secret || ''
      process.env.XRP_ADDRESS = config.address || ''
      process.env.XRP_SERVER = config.rippled || argv.rippled || ''
    } else {
      process.env.XRP_SECRET = argv.secret
      process.env.XRP_ADDRESS = argv.address
      process.env.XRP_SERVER = argv.rippled
    }
    process.env.INFO_MODE = 'true'
    require('./cleanup.js')
  })
  .command('configure', 'generate a configuration file', {}, async argv => {
    if (!argv.config) {
      console.error('config file to output must be specified (--config)')
      process.exit(1)
    }

    if (!argv.secret) {
      console.error('XRP secret must be specified (--secret)')
      process.exit(1)
    }

    if (fs.existsSync(argv.config)) {
      console.error('config file already exists. file=' + argv.config)
      process.exit(1)
    }

    if (!argv.parent) {
      console.log('selecting a parent from connector list...')
    }

    const servers = require('../connector_list.json')
    const parent = argv.parent || servers[Math.floor(Math.random() * servers.length)]

    const config = {
      secret: argv.secret,
      rippled: argv.rippled,
      parent
    }

    if (argv.name) {
      config.name = argv.name
    }

    if (argv.address) {
      config.address = argv.address
    }

    console.log('writing config file...')
    fs.writeFileSync(argv.config, JSON.stringify(config, null, 2))
    console.log('written to', argv.config)
  })
  .argv
