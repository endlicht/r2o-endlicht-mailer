const axios = require('axios');
const {URL} = require('url');

const auth_url = 'https://api.ready2order.com/v1/developerToken/grantAccessToken';

async function auth(dev_token, callback_uri) {
    const grantAccessResponse = await axios
        .post(auth_url, {
            'authorizationCallbackUri': callback_uri
        }, {
            headers: {
                'Authorization': 'Bearer ' + dev_token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(r => r.data)
    const {grantAccessToken, grantAccessUri} = grantAccessResponse;
    global.grantAccessToken = grantAccessToken
    return grantAccessUri
}

function grant(url) {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    const status = params.get('status');
    const grantAccessToken = params.get('grantAccessToken')

    /* check if request is approved and grantAccessToken is valid */
    if (status !== 'approved' || global.grantAccessToken !== grantAccessToken) {
        return false;
    }

    /* get account token and store it in global variable */
    global.accountToken = params.get('accountToken');
    return true;
}

module.exports.auth = auth;
module.exports.grant = grant;