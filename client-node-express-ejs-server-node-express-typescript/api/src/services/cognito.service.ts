import AWS from 'aws-sdk';
import crypto from 'crypto'

export default class CognitoService {
	private config = {
		apiVersion: '2016-04-18',
		region: 'us-east-1',
	}
	private clientSecret = 'XXXXXXXXXXXXXXXXX'
	private clientId = 'XXXXXXXXXXXXXXXXXX';
	private poolId = 'XXXXXXXXXXXXXXXXXX';

	private cognitoIdentity;

	constructor() {
		this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config)
	}

	public async signUpUser(username: string, password: string, userAttr: Array<any>): Promise<boolean> {

		const params = {
			ClientId: this.clientId, /* required */
			Password: password, /* required */
			Username: username, /* required */
			SecretHash: this.hashSecret(username),
			UserAttributes: userAttr,
		}

		try {
			const data = await this.cognitoIdentity.signUp(params).promise()
			console.log(data)
			return true
		} catch (error) {
			console.log(error)
			return false
		}
	}

	public async signInUser(username: string, password: string): Promise<boolean> {
		const params = {
			AuthFlow: 'USER_PASSWORD_AUTH', /* required */
			ClientId: this.clientId, /* required */
			AuthParameters: {
				'USERNAME': username,
				'PASSWORD': password,
				'SECRET_HASH': this.hashSecret(username)
			},
		}

		try {
			let data = await this.cognitoIdentity.initiateAuth(params).promise();
			console.log(data);
			return true;
		} catch (error) {
			console.log(error)
			return false;
		}
	}

	public async confirmSignUp(username: string, code: string): Promise<boolean> {
		const params = {
			ClientId: this.clientId,
			ConfirmationCode: code,
			Username: username,
			SecretHash: this.hashSecret(username),
		};

		try {
			const cognitoResp = await this.cognitoIdentity.confirmSignUp(params).promise();
			console.log(cognitoResp)
			return true
		} catch (error) {
			console.log("error", error)
			return false
		}
	}

	public async forgotPassword(username): Promise<boolean> {
		const params = {
			ClientId: this.clientId, /* required */
			Username: username, /* required */
			SecretHash: this.hashSecret(username),
		}

		try {
			const data = await this.cognitoIdentity.forgotPassword(params).promise();
			console.log(data);
			return true
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	public async confirmNewPassword(username: string, password: string, code: string): Promise<boolean> {
		const params = {
			ClientId: this.clientId, /* required */
			ConfirmationCode: code, /* required */
			Password: password, /* required */
			Username: username, /* required */
			SecretHash: this.hashSecret(username),
		};

		try {
			const data = await this.cognitoIdentity.confirmForgotPassword(params).promise();
			console.log(data);
			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	public async getUserAttributes(accessToken: string): Promise<JSON> {
		const params = {
			AccessToken: accessToken /* required */
		};

		/**ERROR of Access Token does not have required scopes  https://github.com/aws-amplify/amplify-js/issues/1906#issuecomment-434564110
		 * To fix I needed to enable aws.cognito.signin.user.admin in userpool for the app client dev-app-code-flow
		 */
		try {
			const cognitoResp = await this.cognitoIdentity.getUser(params).promise();
			console.log("cognitoResp")
			console.log(cognitoResp)
			return cognitoResp
		} catch (error) {
			console.log("error", error)
			return error
		}
	}

	public async adminSetUserPassword(username: string, newPassword: string): Promise<JSON> {
		const params = {
			UserPoolId: this.poolId,
			Username: username,
			Password: newPassword,
			Permanent: true,
		};

		console.log(params);

		try {
			const cognitoResp = await this.cognitoIdentity.adminSetUserPassword(params, (err, resp) => {
				console.log("error", err);
				console.log("resp", resp);
			})
			console.log("cognitoResp", cognitoResp)
			return cognitoResp
		} catch (error) {
			console.log("error", error)
		}
	}

	private hashSecret(username: string): string {
		return crypto.createHmac('SHA256', this.clientSecret)
		.update(username + this.clientId)
		.digest('base64')
	}
}
