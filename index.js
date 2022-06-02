/* load config from .env file */
require('dotenv').config()

/* create express app */
const express = require('express')
const app = express()

/* import ready2order helper */
const {
	auth,
	grant,
	getOrders,
	orderMapper,
	revoke,
	countOrders,
	countedOrdersToHTML,
	registerWebhook
} = require('./ready2order')
const moment = require('moment')
const { sendMail } = require('./mail')

const baseUrl = ({ headers }) => headers['x-forwarded-host'] ?? headers.host

/* standard page */
app.get('/', (req, res) => {
	res.send('Call <a href="http://' + baseUrl(req) + '/auth">' + baseUrl(req) + '/auth</a>')
})

/* register this app at r2o */
app.get('/auth', async (req, res) => {
	const grantAccessResponse = await auth(process.env.DEVELOPER_TOKEN, 'http://' + baseUrl(req) + '/granted')
	if (grantAccessResponse === true) {
		/* already authorized */
		res.redirect('http://' + baseUrl(req) + '/orders')
		return
	}
	/* grantAccessResponse is a callback url */
	res.redirect(grantAccessResponse)
})

/* revoke access */
app.get('/revoke', async (_req, res) => {
	res.send(await revoke() ? 'Successfully logged out' : 'Failed logging out')
})

/* grant access to r2o */
app.get('/granted', (req, res) => {
	/* baseUrl is needed because grant is called with the full url */
	if (grant(baseUrl(req) + req.url)) {
		res.redirect('http://' + baseUrl(req) + '/orders')
	} else {
		res.send('Request not approved')
	}
})

/* get all orders */
app.get('/orders', async (_req, res) => {
	res.json(orderMapper(
		await getOrders(moment().format('YYYY-MM-DD')))
	)
})

app.get('/countOrders', async (_req, res) => {
	res.json(countOrders(
		orderMapper(
			await getOrders(moment().format('YYYY-MM-DD'), true)
		)
	))
})

app.get('/countOrdersAsHtml', async (_req, res) => {
	res.send(countedOrdersToHTML(
		countOrders(
			orderMapper(
				await getOrders(moment().format('YYYY-MM-DD'), true)
			)
		)
	))
})

app.get('/sendOrdersPerMail', async (_req, res) => {
	const countedOrders = countedOrdersToHTML(
		countOrders(
			orderMapper(
				await getOrders(moment().format('YYYY-MM-DD'), true)
			)
		)
	)
	res.json(await sendMail('', 'Endlicht Bestellungen', countedOrders))
})

app.get('/registerWebhook', async (req, res) => {
	res.json(await registerWebhook(baseUrl(req)) ? 'Webhook registered' : 'Webhook registration failed')
})

app.listen(8080)
