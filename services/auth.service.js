const { ServiceBroker } = require("moleculer");

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const DbService  = require("./../mixin/db.mixin");
module.exports = {
	name: "auth",
	mixins: [DbService],

	actions: {
		// User registration
		register: {
			params: {
				email: "string",
				password: "string"
			},
			async handler(ctx) {
				const { email, password,name } = ctx.params;
				// Check if user already exists
				const userExists = await prisma.user.findUnique({ where: { email } });
				if (userExists) {
					throw new Error("User already exists.");
				}
				// Hash password
				const hashedPassword = await bcrypt.hash(password, 10);
				// Create user
				const user = await prisma.user.create({
					data: {
						name,
						email,
						password: hashedPassword
					},
				});
				return { email: user.email, id: user.id };
			},
		},

		// User login
		login: {
			params: {
				email: "string",
				password: "string"
			},
			async handler(ctx) {
				const { email, password } = ctx.params;
				const user = await prisma.user.findUnique({ where: { email } });
				if (!user) {
					throw new Error("User not found.");
				}
				// Verify password
				const isMatch = await bcrypt.compare(password, user.password);
				if (!isMatch) {
					throw new Error("Password is incorrect.");
				}
				// Generate JWT token
				const token = jwt.sign({ id: user.id, email: user.email }, 's3cr3tKEY', { expiresIn: '1d' });
				return { token };
			},
		},
	},
};
