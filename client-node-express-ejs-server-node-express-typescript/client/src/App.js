import React from "react";
import {Button, Chip, Grid, Paper} from '@material-ui/core';
import {withStyles} from "@material-ui/core/styles";
import ReactJson from "react-json-view";
import jwtDecode from "jwt-decode";
import {
	CognitoAccessToken,
	CognitoIdToken, CognitoRefreshToken,
	CognitoUser,
	CognitoUserPool,
	CognitoUserSession
} from 'amazon-cognito-identity-js';
import config from './config';
import crypto from "crypto";

const styles = theme => ({
	actionButtons: {
		'& > *': {
			margin: theme.spacing(1),
		},
	},
	tokenDetails: {
		padding: theme.spacing(1),
	},
	header: {
		backgroundColor: "#282c34",
		minHeight: "10vh",
		color: "white",
		display: 'flex',
		justifyContent: 'center',
		flexWrap: 'wrap',
		'& > *': {
			margin: theme.spacing(0.5),
		},
	},
});

const clientId = config.cognito.WEB_CLIENT_ID;
const scope = config.cognito.SCOPES;
const redirectUri = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/`;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			userName: '',
			userAttributes: [],
			userAccessToken: '',
			userRefreshToken: '',
			userIdToken: '',
			userIsAuthenticated: false,
			openConvertDialog: false,
			openSignUpDialog: false,
			openChangePinDialog: false,
			openChangePasswordDialog: false,
		}
	}

	base64URLEncode = (buffer) => {
		return buffer.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
	}

	sha256 = str => {
		return crypto.createHash("sha256").update(str).digest();
	}

	getTokens = async (url, body) => {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams(body),
		})

		const jsonData = await response.json();

		for (const [key, value] of Object.entries(jsonData)) {
			sessionStorage.setItem(key, value)
		}

		let userAccessToken = sessionStorage.getItem("access_token");

		this.syncStateFromSessionStorage();

		await this.getUserAttributes(userAccessToken);
	}

	// getAccessTokenWithRefreshToken = async (userRefreshToken) => {
	//   const accessTokenWithRefreshTokenUrl = `${this.apiBaseUrl}/auth/refresh`;
	//
	//   await this.getTokens(accessTokenWithRefreshTokenUrl, {
	//     headers: {
	//       'Content-Type': 'application/json',
	//       'Token': userRefreshToken,
	//     }
	//   });
	// };

	getUserAttributes = async (userAccessToken) => {
		const userAttributesUrl = `${config.cognito.IDENTITY_BROKER_URL}/oauth2/userInfo`;

		let response = await fetch(userAttributesUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'access_token': userAccessToken,
			}
		});

		this.setState({
			userAttributes: await response.json(),
		});
	};

	async componentDidMount() {
		const query = new URLSearchParams(window.location.search);
		const code = query.get('code') != null ? query.get('code') : ""

		let userAccessToken = sessionStorage.getItem("access_token");
		// let userRefreshToken = sessionStorage.getItem("refresh_token");

		this.syncStateFromSessionStorage();

		if (code.length > 0 && (!userAccessToken || userAccessToken.length
			=== 0)) {
			const tokenExchangeUrl = `${config.cognito.IDENTITY_BROKER_URL}/oauth2/token`;

			await this.getTokens(tokenExchangeUrl, {
				grant_type: 'authorization_code',
				client_id: config.cognito.WEB_CLIENT_ID,
				redirect_uri: redirectUri,
				code: code,
				code_verifier: sessionStorage.getItem('code_verifier'),
			});
		} else if (userAccessToken && userAccessToken.length > 0) {
			// await this.getAccessTokenWithRefreshToken(userRefreshToken);
			await this.getUserAttributes(userAccessToken);
		}
	}

	logout = () => {
		sessionStorage.removeItem("access_token");
		sessionStorage.removeItem("refresh_token");
		sessionStorage.removeItem("id_token");

		this.syncStateFromSessionStorage();

		setTimeout(() => {
			window.location.href = `${config.cognito.IDENTITY_BROKER_URL}/logout?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&logout_uri=${redirectUri}`;
		}, 500);
	}

	syncStateFromSessionStorage = () => {
		let userAccessToken = sessionStorage.getItem("access_token");

		this.setState({
			userAccessToken: userAccessToken,
			userRefreshToken: sessionStorage.getItem("refresh_token"),
			userIdToken: sessionStorage.getItem("id_token"),
			userIsAuthenticated: userAccessToken && userAccessToken.length > 0
		});
	}

	onUserSignUp = () => {
		this.setState({
			openSignUpDialog: false,
		});
	}

	getCognitoUser = () => {
		const cognitoUserPool = new CognitoUserPool({
			UserPoolId: config.cognito.USER_POOL_ID,
			ClientId: config.cognito.WEB_CLIENT_ID
		});
		const cognitoUser = new CognitoUser(
			{Pool: cognitoUserPool, Username: this.state.userName});
		cognitoUser.setSignInUserSession(new CognitoUserSession({
			IdToken: new CognitoIdToken(
				{IdToken: sessionStorage.getItem("id_token")}),
			AccessToken: new CognitoAccessToken(
				{AccessToken: sessionStorage.getItem("access_token")}),
			RefreshToken: new CognitoRefreshToken(
				{RefreshToken: sessionStorage.getItem("refresh_token")}),
		}));

		return cognitoUser;
	}

	render() {
		// Generate a random 32 bytes string and encode
		let codeVerifier = sessionStorage.getItem('code_verifier')
		if (!sessionStorage.getItem('code_verifier')) {
			codeVerifier = this.base64URLEncode(crypto.randomBytes(128));
			sessionStorage.setItem('code_verifier', codeVerifier)
		}

		// Generate the code challenge from the verifier
		const codeChallenge = this.base64URLEncode(this.sha256(codeVerifier));

		const {classes} = this.props;
		const loginURL = [`${config.cognito.IDENTITY_BROKER_URL}/oauth2/authorize?`,
			`client_id=${clientId}&`, `response_type=code&`, `scope=${scope}&`,
			`redirect_uri=${redirectUri}&`,
			`code_challenge=${codeChallenge}&`,
			`code_challenge_method=S256`].join('');

		const {userName, userAttributes, userIsAuthenticated, userAccessToken, userIdToken} = this.state;

		return (
			<div className="App">
				<header className={classes.header}>
					<h2>User Data</h2>
					{userIsAuthenticated && <>
						<Chip label={`Username ${userName}`} disabled/>
						{userAttributes.map(
							(userAttribute, idx) => <Chip key={idx}
														  label={`${userAttribute.Name} ${userAttribute.Value}`}
														  disabled/>)}
					</>}
				</header>
				<div className={classes.actionButtons}>
					{!userIsAuthenticated &&
					<>
						<Button color="primary" variant="contained"
								href={loginURL}>Login</Button>
					</>
					}
					{userIsAuthenticated &&
					<>
						<Button color="primary" variant="contained"
								onClick={this.logout}>Logout</Button>
					</>}
				</div>
				{userIsAuthenticated && <Grid container>
					<Grid item xs={6}>
						<Paper className={classes.tokenDetails}>
							<ReactJson src={jwtDecode(userAccessToken)}/>
						</Paper>
					</Grid>
					<Grid item xs={6}>
						<Paper className={classes.tokenDetails}>
							<ReactJson src={jwtDecode(userIdToken)}/>
						</Paper>
					</Grid>
				</Grid>
				}
				{/*<iframe title={"silent-long"} src={loginURL} width={0} height={0}/>*/}
			</div>
		);
	}

}

export default withStyles(styles)(App);
