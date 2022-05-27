const axios = require('axios')
const { URL } = require('url')
const fs = require('fs')

const authUrl = 'https://api.ready2order.com/v1/developerToken/grantAccessToken'
const apiUrl = 'https://api.ready2order.com/v1'

/**
 * Request authorization from r2o.
 *
 * @param devToken
 * @param callbackUrl
 * @returns {Promise<*>}
 */
async function auth (devToken, callbackUrl) {
	const grantAccessResponse = await axios
		.post(authUrl, {
			authorizationCallbackUri: callbackUrl
		}, {
			headers: {
				Authorization: 'Bearer ' + devToken,
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
		.then(r => r.data)
		.catch(_ => {
		})

	/* get access token and callback uri */
	const { grantAccessToken, grantAccessUri } = grantAccessResponse
	global.grantAccessToken = grantAccessToken
	return grantAccessUri
}

/**
 * Grant callback from r2o.
 *
 * @param url
 * @returns {boolean}
 */
function grant (url) {
	const parsedUrl = new URL(url)
	const params = parsedUrl.searchParams
	const status = params.get('status')
	const grantAccessToken = params.get('grantAccessToken')

	/* check if request is approved and grantAccessToken is valid */
	if (status !== 'approved' || global.grantAccessToken !== grantAccessToken) {
		return false
	}

	/* get account token and store it in global variable */
	global.accountToken = params.get('accountToken')
	return true
}

/**
 *
 * @param date in the format YYYY-MM-DD
 * @returns {Promise<*>}
 */
async function getOrders (date, cache = true) {
	const invoices = await axios
		.get(apiUrl + '/document/invoice?items=true&payments=false&dateFrom' + date, {
			headers: {
				Authorization: 'Bearer ' + global.accountToken,
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': 'r2o-order-mailer (github.com/jpkmiller)'
			}
		})
		.then(r => r.data.invoices)
		.catch(_ => [])

	const items = invoices.flatMap(invoice => invoice.items)
	const data = JSON.stringify(items)
	fs.writeFile('items.json', data, (err) => {
		if (err) {
			throw err
		}
		console.log('JSON data is saved.')
	})
}

module.exports.auth = auth
module.exports.grant = grant
module.exports.getOrders = getOrders
