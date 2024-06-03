const DbService = require("moleculer-db");

module.exports = {
	name: "apk",
	mixins: [DbService],
	actions: {
		fetchApkData: {
			params: {
				appName: "string",
				url: "string"
			},
			async handler(ctx) {
				await ctx.call("scraper.scrapeApkMirrorUploads", { url, appName });
			}
		},

		getVersions: {
			async handler(ctx) {
				const { appName, limit = 10 } = ctx.params;
				const apks = await ctx.call("db.mongoFind", {
					collection: "Apk",
					query: { appName }
				});

				return apks.slice(0, limit).map(apk => ({
					versionId: apk._id,
					releaseDate: apk.release_date,
					totalVariants: apk.variants.length
				}));
			}
		},

		getVersionDetails: {
			params: {
				id: "string"
			},
			async handler(ctx) {
				const { id } = ctx.params;
				const apk = await ctx.call("db.mongoFind", {
					collection: "Apk",
					query: { _id: id }
				});

				if (!apk) {
					throw new Error("APK not found");
				}

				return {
					versionId: apk._id,
					variants: apk.variants
				};
			}
		},

		updateVersion: {
			params: {
				id: "string",
				data: "object"
			},
			async handler(ctx) {
				const { id, data } = ctx.params;
				const updatedApk = await ctx.call("db.mongoUpdate", {
					collection: "Apk",
					filter: { _id: id },
					update: { $set: data }
				});
				return updatedApk;
			}
		},

		deleteVersion: {
			params: {
				id: "string"
			},
			async handler(ctx) {
				const { id } = ctx.params;
				await ctx.call("db.mongoDelete", {
					collection: "Apk",
					filter: { _id: id }
				});
				return { message: "APK deleted successfully" };
			}
		},

		checkCompatibility: {
			params: {
				agent: "string"
			},
			async handler(ctx) {
				const { agent } = ctx.params;
				const parsedData = this.parseAgentString(agent);

				const variant = await ctx.call("db.mongoFind", {
					collection: "Variant",
					query: { variant_id: parsedData.variantId }
				});

				if (!variant) {
					throw new Error("Variant not found");
				}

				const isCompatible = this.compareVersions(parsedData.android_version, variant.min_sdk_version) &&
					parsedData.dpi === variant.dpi;

				return {
					status: isCompatible ? "success" : "fail",
					message: isCompatible ? "Compatible" : `Minimum Android version required: ${variant.min_sdk_version}, DPI required: ${variant.dpi}`
				};
			}
		}
	},

	events: {
		'data.fetched'(data) {
			const { appName, version, releaseDate, variants } = data;

			this.broker.call("db.mongoCreate", {
				collection: "Apk",
				data: {
					app_name: appName,
					version,
					release_date: releaseDate,
					variants
				}
			}).then(createdApk => {
				this.broker.call("db.pgQuery", {
					query: 'INSERT INTO apk_distribution (distribution_number, mongodb_id) VALUES ($1, $2)',
					values: [version, createdApk._id]
				});

				this.broker.call("db.redisSet", {
					key: `last_checked:${appName}:${version}`,
					value: Date.now()
				});

				this.broker.emit("apk.newVersion", { appName, newVersion: version });
			}).catch(error => {
				console.error("Error saving APK data:", error);
			});
		},

		'variant.fetched'(data) {
			const { appName, version, releaseDate, variant } = data;

			this.broker.call("db.mongoUpdate", {
				collection: "Apk",
				filter: { app_name: appName, version },
				update: { $push: { variants: variant } }
			}).catch(error => {
				console.error("Error updating APK variants:", error);
			});
		}
	},

	methods: {
		parseAgentString(agentString) {
			const match = agentString.match(
				/Instagram (\S+) Android \((\S+); (\d+)dpi; \d+x\d+; \S+; \S+; \S+; \S+; (\d+)\)/
			);
			if (match) {
				return {
					versionId: match[1],
					androidVersion: match[2],
					dpi: match[3],
					variantId: match[4]
				};
			} else {
				throw new Error("Invalid agent string");
			}
		},

		compareVersions(agentVersion, minVersion) {
			return agentVersion >= minVersion;
		},

		isNewVersion(apkData) {
			return this.redisGet(`last_checked:${apkData.app_name}:${apkData.version}`).then(lastChecked => {
				return !lastChecked;
			});
		}
	},

	started() {
		const cron = require('node-cron');

		cron.schedule('*/2 * * * *', async () => {
			const apps = [
				{ appName: 'instagram', url: 'https://www.apkmirror.com/uploads/?appcategory=instagram-instagram' },
				{ appName: 'tiktok', url: 'https://www.apkmirror.com/uploads/?appcategory=tiktok' },
				{ appName: 'twitter', url: 'https://www.apkmirror.com/uploads/?appcategory=twitter' },
				{ appName: 'youtube', url: 'https://www.apkmirror.com/uploads/?appcategory=youtube' }
			];

			for (const app of apps) {
				await this.broker.call("scraper.scrapeApkMirrorUploads", app);
			}
		});
	}
};
