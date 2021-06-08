import React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import {
	Button,
	DialogActions,
	DialogContent,
	TextField
} from "@material-ui/core";
import Alert from '@material-ui/lab/Alert';
import {Amplify, Auth} from 'aws-amplify';
import config from './config';

const getRandomCollectorNumber = () => {
	const min = 10 ** 11;
	const max = 10 ** 12 - 1;
	return Math.floor(Math.random() * (max - min) + min);
}

const getRandomPin = () => {
	const min = 10 ** 6;
	const max = 10 ** 7 - 1;
	return Math.floor(Math.random() * (max - min) + min);
}

function SignUpDialog(props) {
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState("");

	const doSignUp = async () => {
		setErrorMessage("");

		try {
			Amplify.configure({
				Auth: {
					region: config.cognito.REGION,
					userPoolId: config.cognito.USER_POOL_ID,
					userPoolWebClientId: config.cognito.APP_CLIENT_ID
				},
			});

			const collectorNumber = props.collectorNumber
				|| getRandomCollectorNumber().toString();

			const signUpResult = await Auth.signUp({
				username: `${collectorNumber}-converted`,
				password: password,
				attributes: {
					email: email,
					"custom:user_converted": "true",
					"custom:collector_number": collectorNumber,
				}
			});

			if (props.createCollectorRecord) {
				await Auth.signUp({
					username: collectorNumber,
					password: getRandomPin().toString(),
					attributes: {
						email: `${collectorNumber}@domain.com`,
						"custom:user_converted": "true",
						"custom:collector_number": collectorNumber,
					}
				});
			}

			props.onUserSignUp(signUpResult);
		} catch (error) {
			setErrorMessage(error.message);
		}
	}

	return (
		<Dialog aria-labelledby="simple-dialog-title" open={props.open}
				onClose={props.onClose}>
			<DialogTitle id="dialog-title">{props.title}</DialogTitle>
			<DialogContent>
				{errorMessage.length > 0 && <Alert
					severity="error">{errorMessage}</Alert>}
				<TextField
					autoFocus
					margin="dense"
					id="email"
					label="email"
					fullWidth
					value={email}
					type="email"
					onChange={(e) => setEmail(e.target.value)}
				/>
				<TextField
					margin="dense"
					id="password"
					label="Password"
					value={password}
					fullWidth
					onChange={(e) => setPassword(e.target.value)}
				/>
				<DialogActions>
					<Button onClick={props.onClose} color="primary">
						Cancel
					</Button>
					<Button onClick={doSignUp} color="primary"
							disabled={password.length === 0 || email.length
							=== 0}>
						Sign Up
					</Button>
				</DialogActions>
			</DialogContent>
		</Dialog>
	);
}

SignUpDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	collectorNumber: PropTypes.string.isRequired,
	onUserSignUp: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	createCollectorRecord: PropTypes.bool.isRequired,
};

export default SignUpDialog;
