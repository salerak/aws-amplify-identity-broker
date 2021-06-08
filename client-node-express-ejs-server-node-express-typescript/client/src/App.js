import React from "react";
import axios from "axios";
import {Button, Chip, Grid, Paper} from '@material-ui/core';
import {withStyles} from "@material-ui/core/styles";
import ReactJson from "react-json-view";
import jwtDecode from "jwt-decode";
import SignUpDialog from "./SignUpDialog";
import {
	CognitoAccessToken,
	CognitoIdToken, CognitoRefreshToken,
	CognitoUser,
	CognitoUserPool,
	CognitoUserSession
} from 'amazon-cognito-identity-js';
import config from './config';
import ChangeCredentials from "./ChangeCredentials";

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

// const poolBaseUrl = `https://${config.cognito.POOL_NAME}.auth.us-east-1.amazoncognito.com`;
const poolBaseUrl = `https://${config.cognito.CLOUDFRONT_NAME}.cloudfront.net`;
const clientId = config.cognito.APP_CLIENT_ID;
const scope = config.cognito.SCOPES;
const redirectUri = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

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

		this.apiBaseUrl = config.api.baseUrl;
	}

	getTokens = async (url, apiOptions) => {
		const response = await axios.get(url, apiOptions);

		for (const [key, value] of Object.entries(response.data)) {
			sessionStorage.setItem(key, value)
		}

		let userAccessToken = sessionStorage.getItem("access_token");

		this.syncStateFromSessionStorage();

		await this.getUserAttributes(userAccessToken);
	}

	getAccessTokenWithRefreshToken = async (userRefreshToken) => {
		const accessTokenWithRefreshTokenUrl = `${this.apiBaseUrl}/auth/refresh`;

		await this.getTokens(accessTokenWithRefreshTokenUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Token': userRefreshToken,
			}
		});
	};

	getUserAttributes = async (userAccessToken) => {
		const userAttributesUrl = `${this.apiBaseUrl}/auth/user-attributes`;

		let response = await axios.get(userAttributesUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Token': userAccessToken,
			}
		});

		this.setState({
			userName: response.data.Username,
			userAttributes: response.data.UserAttributes,
		});
	};

	async componentDidMount() {
		const query = new URLSearchParams(window.location.search);
		const code = query.get('code') != null ? query.get('code') : ""

		let userAccessToken = sessionStorage.getItem("access_token");
		let userRefreshToken = sessionStorage.getItem("refresh_token");

		this.syncStateFromSessionStorage();

		if (code.length > 0 && (!userAccessToken || userAccessToken.length
			=== 0)) {
			const tokenExchangeUrl = `${this.apiBaseUrl}/auth/exchange`;

			await this.getTokens(tokenExchangeUrl, {
				headers: {
					'Content-Type': 'application/json'
				},
				params: {
					code: code
				}
			});
		} else if (userAccessToken && userAccessToken.length > 0) {
			await this.getAccessTokenWithRefreshToken(userRefreshToken);
			await this.getUserAttributes(userAccessToken);
		}
	}

	logout = () => {
		sessionStorage.removeItem("access_token");
		sessionStorage.removeItem("refresh_token");
		sessionStorage.removeItem("id_token");

		this.syncStateFromSessionStorage();

		setTimeout(() => {
			window.location.href = `${poolBaseUrl}/logout?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&logout_uri=${redirectUri}`;
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
			ClientId: config.cognito.APP_CLIENT_ID
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

	onUserConverted = () => {
		this.setState({
			openSignUpDialog: false,
		});

		const cognitoUser = this.getCognitoUser();

		cognitoUser.updateAttributes(
			[{Name: "custom:user_converted", Value: "true"}],
			(err, result) => {
				if (err) {
					console.log(err);
				} else {
					console.log(result);
					this.logout();
				}
			});
	}

	userConverted = () => {
		const userConvertedAttr = this.state.userAttributes.filter((attr, _) =>
			attr.Name === "custom:user_converted" && attr.Value === "true");

		return userConvertedAttr.length === 1;
	}

	changePassword = async (username, newPassword, logout) => {
		const setUserPasswordUrl = `${this.apiBaseUrl}/auth/set-user-password`;

		const resp = await axios.post(setUserPasswordUrl, {
			'username': username,
			'password': newPassword,
		}, {
			headers: {
				'Content-Type': 'application/json',
			}
		});

		if (logout) {
			this.logout();
		}

	}

	onPinEntered = async (newPin) => {
		this.setState({
			openChangePinDialog: false,
		});

		let username = this.state.userName;
		let logout = true;

		if (this.userConverted()) {
			const collectorNumber = this.state.userAttributes.filter(
				(attr, _) =>
					attr.Name === "custom:collector_number");

			username = collectorNumber[0].Value;
			logout = false;
		}

		await this.changePassword(username, newPin, logout);

	}

	onPasswordEntered = async (newPassword) => {
		this.setState({
			openChangePasswordDialog: false,
		});

		// Changing passwords is only allowed for converted users so we can go ahead a change it
		await this.changePassword(this.state.userName, newPassword, true);
	}

	render() {
		const {classes} = this.props;
		// const loginURL = `${poolBaseUrl}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;
		const loginURL = `${poolBaseUrl}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;

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
						<Button color="primary" variant="contained"
								onClick={() => this.setState(
									{openSignUpDialog: true})}>Sign Up</Button>
					</>
					}
					{userIsAuthenticated &&
					<>
						<Button color="primary" variant="contained"
								onClick={() => this.getAccessTokenWithRefreshToken(
									sessionStorage.getItem("refresh_token"))}>Refresh
							Tokens</Button>
						<Button color="primary" variant="contained"
								onClick={() => this.setState(
									{openChangePinDialog: true})}>Set
							Pin</Button>
						{!this.userConverted() &&
						<>
							<Button color="primary" variant="contained"
									onClick={() => this.setState(
										{openConvertDialog: true})}>Convert</Button>
						</>
						}
						{this.userConverted() &&
						<Button color="primary" variant="contained"
								onClick={() => this.setState(
									{openChangePasswordDialog: true})}>Set
							Password</Button>
						}
						<Button color="primary" variant="contained"
								onClick={this.logout}>Logout</Button>
					</>}
				</div>

				<SignUpDialog open={this.state.openConvertDialog}
							  collectorNumber={this.state.userName}
							  onUserSignUp={this.onUserConverted}
							  title={"Convert"}
							  createCollectorRecord={false}
							  onClose={() => this.setState(
								  {openConvertDialog: false})}/>
				<SignUpDialog open={this.state.openSignUpDialog}
							  collectorNumber={this.state.userName}
							  onUserSignUp={this.onUserSignUp} title={"Sign Up"}
							  createCollectorRecord={true}
							  onClose={() => this.setState(
								  {openSignUpDialog: false})}/>

				<ChangeCredentials open={this.state.openChangePinDialog}
								   title={"Change PIN"}
								   onPasswordAccepted={this.onPinEntered}
								   digitsOnly={true}
								   onClose={() => this.setState(
									   {openChangePinDialog: false})}/>
				<ChangeCredentials open={this.state.openChangePasswordDialog}
								   title={"Change Password"}
								   onPasswordAccepted={this.onPasswordEntered}
								   digitsOnly={false}
								   onClose={() => this.setState(
									   {openChangePasswordDialog: false})}/>

				{userIsAuthenticated && <Grid container>
					<Grid item xs={6}> r
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
			</div>
		);
	}

}

export default withStyles(styles)(App);
