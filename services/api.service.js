const ApiGateway = require("moleculer-web");
const jwt = require("jsonwebtoken");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	settings: {
		port: 8080,
		routes: [{
			path: "/api/auth",
			aliases: {
				"POST register": "auth.register",
				"POST login": "auth.login",
			}
		}, {
			path: "/api",
			aliases: {
				"GET /versions": "apk.getVersions",
				"GET /versions/:id": "apk.getVersionDetails",
				"PUT /versions/:id": "apk.updateVersion",
				"DELETE /versions/:id": "apk.deleteVersion",
				"POST /check-compatibility": "apk.checkCompatibility"
			},
			authorization: true,
		}],
		JWT_SECRET: process.env.JWT_SECRET || "s3cr3tKEY",

		assets: {
			folder: "public",
		}
	},

	methods: {
		authorize(ctx, route, req, res) {
			let auth = req.headers["authorization"];
			if (auth && auth.startsWith("Bearer ")) {
				let token = auth.slice(7);
				try {
					let decoded = jwt.verify(token, this.settings.JWT_SECRET);
					ctx.meta.user = decoded;
					return Promise.resolve(ctx);
				} catch (err) {
					return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN));
				}
			} else {
				return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN));
			}
		}
	}
};
