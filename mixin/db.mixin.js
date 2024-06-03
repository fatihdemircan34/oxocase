const DbService = require("moleculer-db");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const Redis = require("ioredis");
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

module.exports = {
	name: "DbMixin",

	adapter: new PrismaClient(),

	settings: {
		// Veritabanı bağlantı ayarları buraya eklenebilir
	},

	async started() {
		// Redis Bağlantısı
		this.redis = new Redis({
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
		});

		// PostgreSQL Bağlantı Havuzu
		this.pgPool = new Pool({
			user: process.env.POSTGRES_USER,
			host: process.env.POSTGRES_HOST,
			database: process.env.POSTGRES_DATABASE,
			password: process.env.POSTGRES_PASSWORD,
			port: process.env.POSTGRES_PORT,
		});

		// MongoDB Bağlantısı
		this.mongodb = await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
	},

	async stopped() {
		// Redis ve PostgreSQL bağlantı kapatma işlemleri
		await this.pgPool.end();
		await this.redis.disconnect();
		// MongoDB Bağlantısını Kapat
		await this.mongodb.disconnect();
	},

	actions: {
		// MongoDB İşlemleri
		mongoFind: {
			params: {
				collection: { type: "string", optional: false },
				query: { type: "object", optional: true },
			},
			async handler(ctx) {
				const { collection, query } = ctx.params;
				const model = mongoose.model(collection, this.adapter[collection]);
				return await model.find(query);
			},
		},

		mongoCreate: {
			params: {
				collection: { type: "string", optional: false },
				data: { type: "object", optional: false },
			},
			async handler(ctx) {
				const { collection, data } = ctx.params;
				const model = mongoose.model(collection, this.adapter[collection]);
				const newDocument = new model(data);
				return await newDocument.save();
			},
		},

		// PostgreSQL İşlemleri
		pgQuery: {
			params: {
				query: { type: "string", optional: false },
				values: { type: "array", optional: true },
			},
			async handler(ctx) {
				const { query, values } = ctx.params;
				try {
					const result = await this.pgPool.query(query, values);
					return result.rows;
				} catch (error) {
					this.logger.error("PostgreSQL query error:", error);
					throw new Error("PostgreSQL query failed");
				}
			},
		},

		// Redis İşlemleri
		redisGet: {
			params: {
				key: { type: "string", optional: false },
			},
			async handler(ctx) {
				const { key } = ctx.params;
				try {
					const value = await this.redis.get(key);
					return value ? JSON.parse(value) : null;
				} catch (error) {
					this.logger.error("Redis get error:", error);
					throw new Error("Redis get failed");
				}
			},
		},

		redisSet: {
			params: {
				key: { type: "string", optional: false },
				value: { type: "any", optional: false },
				ttl: { type: "number", optional: true },
			},
			async handler(ctx) {
				const { key, value, ttl } = ctx.params;
				try {
					if (ttl) {
						await this.redis.set(key, JSON.stringify(value), "EX", ttl);
					} else {
						await this.redis.set(key, JSON.stringify(value));
					}
					return { message: "Redis set successful" };
				} catch (error) {
					this.logger.error("Redis set error:", error);
					throw new Error("Redis set failed");
				}
			},
		},
	},
};
