const nodemailer = require('nodemailer')

function sendMail (receiverEmailAddress, title, body) {
	const transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT,
		secure: true,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD
		}
	})

	const message = {
		from: process.env.ADDRESS,
		to: receiverEmailAddress,
		subject: title,
		html: body
	}

	transporter.sendMail(message)
}

module.exports.sendMail = sendMail
