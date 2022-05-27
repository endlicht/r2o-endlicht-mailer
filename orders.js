const cron = require('node-cron')

/* schedule cron job everyday at 6 pm */
cron.schedule('0 18 * * *', () => {

})
