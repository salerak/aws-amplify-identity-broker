const util = require('util')
import axios from "axios";
import crypto from "crypto";


export default class TokenService {
	private clientSecret = 'XXXXXXXXXXXXXXXXXX'
	private clientId = 'XXXXXXXXXXXXXXXX';
	private poolName = 'XXXXXXXXXXXXXXXX';


	public async exchangeCodeForJWTToken(code: string): Promise<string> {
		let clientid_clientsecret = this.clientId.concat(":").concat(this.clientSecret);
		let buff = Buffer.from(clientid_clientsecret, "utf8");
		let base64clientid_clientsecret = buff.toString('base64');
		const tokenOptions = {
			headers: {
				"Authorization": "Basic ".concat(base64clientid_clientsecret),
				"Content-Type": "application/x-www-form-urlencoded"
			}
		};
		console.log("tokenOptions" + util.inspect(tokenOptions, {showHidden: false, depth: null}))

		const dataOptions = {
			grant_type: "authorization_code",
			redirect_uri: "http://localhost:3000/",
			client_id: this.clientId,
			code: code,
		}

		const dataEncoded = Object.keys(dataOptions)
		.map((key) => `${key}=${encodeURIComponent(dataOptions[key])}`)
		.join('&');
		console.log("dataEncoded" + util.inspect(dataEncoded, {showHidden: false, depth: null}))

		return await axios.post(`https://${this.poolName}-domain.auth.us-east-1.amazoncognito.com/oauth2/token`, dataEncoded,
			tokenOptions).then(response => {
			console.log("SuccessConfig" + util.inspect(response.config, {
				showHidden: false,
				depth: null
			}))
			console.log("SuccessData" + util.inspect(response.data, {
				showHidden: false,
				depth: null
			}))
			return response.data;
		}).catch(error => {
			console.log("ErrorConfig" + util.inspect(error.config, {
				showHidden: false,
				depth: null
			}));
			console.log("ErrorData" + util.inspect(error.response.data, {
				showHidden: false,
				depth: null
			}));
			return Promise.reject(error.response.data)
		})
	}

	public async accessTokenFromRefreshToken(token: string): Promise<string> {
		let clientid_clientsecret = this.clientId.concat(":").concat(this.clientSecret);
		let buff = Buffer.from(clientid_clientsecret, "utf8");
		let base64clientid_clientsecret = buff.toString('base64');
		const tokenOptions = {
			headers: {
				"Authorization": "Basic ".concat(base64clientid_clientsecret),
				"Content-Type": "application/x-www-form-urlencoded"
			}
		};
		console.log("tokenOptions" + util.inspect(tokenOptions, {showHidden: false, depth: null}))

		const dataOptions = {
			grant_type: "refresh_token",
			redirect_uri: "http://localhost:3000/",
			client_id: this.clientId,
			refresh_token: token,
		}

		const dataEncoded = Object.keys(dataOptions)
		.map((key) => `${key}=${encodeURIComponent(dataOptions[key])}`)
		.join('&');
		console.log("dataEncoded" + util.inspect(dataEncoded, {showHidden: false, depth: null}))

		return await axios.post(`https://${this.poolName}-domain.auth.us-east-1.amazoncognito.com/oauth2/token`, dataEncoded,
			tokenOptions).then(response => {
			console.log("SuccessConfig" + util.inspect(response.config, {
				showHidden: false,
				depth: null
			}))
			console.log("SuccessData" + util.inspect(response.data, {
				showHidden: false,
				depth: null
			}))
			return response.data;
		}).catch(error => {
			console.log("ErrorConfig" + util.inspect(error.config, {
				showHidden: false,
				depth: null
			}));
			console.log("ErrorData" + util.inspect(error.data, {showHidden: false, depth: null}));
			return Promise.reject(error)
		})


	}


	public async callMemberBanner(token: string, username: string, memberId: string): Promise<string> {
		let authorizationToken: string = "".concat(token)

		const apiGatewayOptions = {
			headers: {
				"Content-Type": 'application/json',
				"Collector-Number": username,
				"Member-Id": memberId,
				"Authorization": authorizationToken,
			}

		};

		return await axios.get('https://bn32vt86me.execute-api.us-east-1.amazonaws.com/main',
			apiGatewayOptions).then(function (response) {
			console.log("SuccessConfig" + util.inspect(response.config, {
				showHidden: false,
				depth: null
			}))
			console.log("SuccessData" + util.inspect(response.data, {
				showHidden: false,
				depth: null
			}))
			return response.data
		}).catch(function (error) {
			console.log("ErrorConfig" + util.inspect(error.config, {
				showHidden: false,
				depth: null
			}));
			console.log("ErrorData" + util.inspect(error.data, {showHidden: false, depth: null}));
			return Promise.reject(error)
		})

	}

	private hashSecret(username: string): string {
		return crypto.createHmac('SHA256', this.clientSecret)
		.update(username + this.clientId)
		.digest('base64')
	}
}
