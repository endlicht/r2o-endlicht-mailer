const nodemailer = require('nodemailer')

async function sendMail (receiverEmailAddress, title, body) {
	const transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT,
		secure: process.env.MAIL_PORT === 465,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD
		}
	})

	const message = {
		from: process.env.MAIL_ADDRESS,
		to: process.env.MAIL_RECEIVER ?? receiverEmailAddress,
		subject: title,
		html: body
	}

	return transporter.sendMail(message)
}

module.exports.sendMail = sendMail
