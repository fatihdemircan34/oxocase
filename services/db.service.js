const DbService = require("moleculer-db");
const mongoose = require("mongoose");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const Redis = require("ioredis");

module.exports = {
	name: "db",
	mixins: [DbService],

	prisma: null,
	redis: null,
	pgPool: null,
	mongodb: null,

	async started() {
		// Prisma Client Bağlantısı
		this.prisma = new PrismaClient();

		// Redis Bağlantısı
		this.redis = new Redis({
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			// password gibi diğer Redis ayarları (eğer varsa)
		});

		// PostgreSQL Bağlantı Havuzu
		this.pgPool = new Pool({
			user: process.env.POSTGRES_USER,
			host: process.env.POSTGRES_HOST,
			database: process.env.POSTGRES_DATABASE,
			password: process.env.POSTGRES_PASSWORD,
			port: process.env.POSTGRES_PORT,
			idleTimeoutMillis: 30000, // Bağlantıların açık kalacağı süre (milisaniye cinsinden)
			connectionTimeoutMillis: 5000, // Bağlantının zaman aşımı süresi (milisaniye cinsinden)
		});

		// MongoDB Bağlantısı
		this.mongodb = await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
	},

	async stopped() {
		// MongoDB Bağlantısını Kapat
		await this.mongodb.disconnect();
	},

	methods: {
		getModel(collection) {
			// Modelin zaten tanımlanmış olup olmadığını kontrol et
			if (mongoose.models[collection]) {
				return mongoose.models[collection];
			}
			// Yeni bir model tanımla
			return mongoose.model(collection, new mongoose.Schema({}, { strict: false }));
		}
	},

	actions: {
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
					return result.rows; // Sorgu sonucundaki satırları döndür
				} catch (error) {
					this.logger.error("PostgreSQL query error:", error);

				}
			},
		},

		// Prisma ile Veritabanı İşlemleri
		find: {
			params: {
				entity: { type: "string", optional: false },
				query: { type: "object", optional: true },
			},
			async handler(ctx) {
				const { entity, query } = ctx.params;
				return this.prisma[entity].findMany(query);
			},
		},

		create: {
			params: {
				entity: { type: "string", optional: false },
				data: { type: "object", optional: false },
			},
			async handler(ctx) {
				const { entity, data } = ctx.params;
				return await this.prisma[entity].create({ data });
			},
		},

		update: {
			params: {
				entity: { type: "string", optional: false },
				id: { type: "number", convert: true, optional: false }, // ID'yi sayıya dönüştür
				data: { type: "object", optional: false },
			},
			async handler(ctx) {
				const { entity, id, data } = ctx.params;
				return await this.prisma[entity].update({ where: { id }, data });
			},
		},

		delete: {
			params: {
				entity: { type: "string", optional: false },
				id: { type: "number", convert: true, optional: false }, // ID'yi sayıya dönüştür
			},
			async handler(ctx) {
				const { entity, id } = ctx.params;
				await this.prisma[entity].delete({ where: { id } });
				return { message: `${entity} deleted successfully` };
			},
		},

		// MongoDB İşlemleri
		mongoFind: {
			params: {
				collection: { type: "string", optional: false },
				query: { type: "object", optional: true },
			},
			async handler(ctx) {
				const { collection, query } = ctx.params;
				const model = this.getModel(collection); // Modeli al
				return await model.find(query); // Verileri MongoDB'den çekme
			},
		},

		mongoCreate: {
			params: {
				collection: { type: "string", optional: false },
				data: { type: "object", optional: false },
			},
			async handler(ctx) {
				const { collection, data } = ctx.params;
				const model = this.getModel(collection); // Modeli al
				const newDocument = new model(data);
				return await newDocument.save(); // MongoDB'ye kaydetme
			},
		},

		mongoUpdate: {
			params: {
				collection: { type: "string", optional: false },
				filter: { type: "object", optional: false },
				update: { type: "object", optional: false },
				options: { type: "object", optional: true },
			},
			async handler(ctx) {
				const { collection, filter, update, options } = ctx.params;
				const model = this.getModel(collection); // Modeli al
				return await model.findOneAndUpdate(filter, update, options);
			},
		},

		mongoDelete: {
			params: {
				collection: { type: "string", optional: false },
				filter: { type: "object", optional: false },
			},
			async handler(ctx) {
				const { collection, filter } = ctx.params;
				const model = this.getModel(collection); // Modeli al
				return await model.findOneAndDelete(filter);
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
					return value ? JSON.parse(value) : null; // JSON verisini ayrıştır
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
				ttl: { type: "number", optional: true }, // Opsiyonel TTL (Time-To-Live)
			},
			async handler(ctx) {
				const { key, value, ttl } = ctx.params;
				try {
					if (ttl) {
						await this.redis.set(key, JSON.stringify(value), "EX", ttl); // TTL ile kaydet
					} else {
						await this.redis.set(key, JSON.stringify(value)); // TTL olmadan kaydet
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
