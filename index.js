/* load config from .env file */
require('dotenv').config()

/* create express app */
const express = require('express')
const app = express()

/* import ready2order helper */
const { auth, grant } = require('./ready2order')

const baseUrl = ({ headers }) => headers['x-forwarded-host'] ?? headers.host

/* standard page */
app.get('/', (req, res) => {
  res.send('Call ' + baseUrl(req) + '/register')
})

/* register this app at r2o */
app.get('/register', async (req, res) => {
  const grantAccessUri = await auth(process.env.DEVELOPER_TOKEN, 'http://' + baseUrl(req) + '/granted')
  res.redirect(grantAccessUri)
})

/* grant access to r2o */
app.get('/granted', (req, res) => {
  /* baseUrl is needed because grant is called with the full url */
  if (grant(baseUrl(req) + req.url)) {
    res.send('App registered successfully!')
  }
})

app.listen(8080)
