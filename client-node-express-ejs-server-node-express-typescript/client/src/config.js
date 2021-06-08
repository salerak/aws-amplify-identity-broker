const config = {
	api: {
		baseUrl: "http://localhost:5000",
	},
	cognito: {
		REGION: "us-east-1",
		USER_POOL_ID: "XXXXXXXXXXXX",
		APP_CLIENT_ID: "XXXXXXXXXXXXX",
		SCOPES: "email+openid+phone+profile+profile.audience.loyalty.com/profile:read+aws.cognito.signin.user.admin",
		POOL_NAME: "loyaltyoneidbroker-devpoc",
		CLOUDFRONT_NAME: "XXXXXXXXXXXX"
	},
};

export default config;
