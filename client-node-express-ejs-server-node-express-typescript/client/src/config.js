const config = {
	cognito: {
		REGION: "us-east-1",
		USER_POOL_ID: "XXXXXXX",
		WEB_CLIENT_ID: "XXXXXXX",
		SCOPES: "email+openid+phone+profile+aws.cognito.signin.user.admin",
		IDENTITY_BROKER_URL: "XXXXXXX"
	},
};

export default config;
