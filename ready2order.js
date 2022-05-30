const axios = require('axios')
const { URL } = require('url')
const fs = require('fs')

const authUrl = 'https://api.ready2order.com/v1/developerToken/grantAccessToken'
const apiUrl = 'https://api.ready2order.com/v1'

/**
 * Request dev authorization from r2o API.
 *
 * @param devToken developer token (should be kept secret)
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
		.catch(_ => ({}))

	/* get access token and callback uri */
	const { grantAccessToken, grantAccessUri } = grantAccessResponse
	global.grantAccessToken = grantAccessToken
	return grantAccessUri
}

/**
 * Revoke dev authorization from r2o API.
 *
 * @returns {Promise<*>}
 */
async function revoke () {
	const revokeResponse = await axios
		.post(apiUrl + '/access/revoke', {}, {
			headers: {
				Authorization: 'Bearer ' + global.accountToken ?? '',
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
		.then(r => r.data)
		.catch(_ => ({}))

	/* get access token and callback uri */
	const { error, success } = revokeResponse
	return !error && success
}

/**
 * Grant callback from r2o API.
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
 * Get orders from r2o API.
 *
 * @param date in the format YYYY-MM-DD.
 * @param fromCache if orders should be read from a file.
 * @returns {Promise<*>}
 */
async function getOrders (date, fromCache = false) {
	if (fromCache) {
		return JSON.parse(fs.readFileSync('items.json', 'utf8'))
	}

	const invoices = await axios
		.get(apiUrl + '/document/invoice?items=true&payments=false&dateFrom' + date ?? '', {
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
	fs.writeFile('items.json', JSON.stringify(items), (err) => {
		if (err) {
			throw err
		}
		console.log('JSON data is saved.')
	})
	return items
}

/**
 * Maps orders to remove all redundant information.
 *
 * @param orders
 * @returns {{quantity: number, price: number, name: string, id: string, time: string}[]}
 */
function orderMapper (orders) {
	return orders.map(order => ({
		id: order.item_id ?? '',
		price: order.item_product_price ?? 0,
		name: order.item_product_name ?? order.item_name ?? '',
		quantity: order.item_qty ?? 0,
		time: order.item_timestamp ?? ''
	}))
}

/**
 * Count orders by name.
 *
 * @param orders
 * @returns {{}}
 */
function countOrders (orders) {
	const ordersCounter = {}
	orders.forEach(order => {
		let cleanedItemName = order.name
		let increment = true

		/* if “zurück” is found then decrement */
		if (cleanedItemName.includes('zurück')) {
			increment = false
			cleanedItemName = cleanedItemName.split('zurück')[0].trim()
		}

		/* create key-value pair in map */
		if (!(cleanedItemName in ordersCounter)) {
			ordersCounter[cleanedItemName] = 0
		}

		/* increment or decrement amount depending on state */
		ordersCounter[cleanedItemName] = increment ? ordersCounter[cleanedItemName] + order.quantity : ordersCounter[cleanedItemName] - order.quantity
	})
	return ordersCounter
}

/**
 * Print orders as HTML.
 *
 * @param countedOrders
 * @returns {string}
 */
function countedOrdersToHTML (countedOrders) {
	const ordersAsList = Object.entries(countedOrders).map(([orderName, quantity]) => '<li>' + orderName + ': ' + quantity + '</li>')
	return 'Folgende Bestellungen wurden getätigt' +
		'<br/>' +
		'<ul>' + ordersAsList.join('') + '</ul>'
}

module.exports.auth = auth
module.exports.revoke = revoke
module.exports.grant = grant
module.exports.getOrders = getOrders
module.exports.orderMapper = orderMapper
module.exports.countOrders = countOrders
module.exports.countedOrdersToHTML = countedOrdersToHTML
