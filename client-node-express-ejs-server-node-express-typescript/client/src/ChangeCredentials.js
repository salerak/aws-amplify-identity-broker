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

function ChangeCredentials(props) {
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");

	const onClick = () => {
		props.onPasswordAccepted(password);
	}

	const onKeyPress = (e) => {
		if (props.digitsOnly) {
			if (e.charCode < 48 || e.charCode > 57) {
				e.preventDefault();
			}
		}
	}

	return (
		<Dialog aria-labelledby="simple-dialog-title" open={props.open}
				onClose={props.onClose}>
			<DialogTitle id="dialog-title">{props.title}</DialogTitle>
			<DialogContent>
				{(password.length < 6 || password !== confirmPassword) &&
				<Alert severity="error">Fields must match and be at least 6
					characters long</Alert>}
				<TextField
					autoFocus
					margin="dense"
					id="password"
					label="Password"
					fullWidth
					value={password}
					onKeyPress={onKeyPress}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<TextField
					margin="dense"
					id="confirm-password"
					label="Confirm Password"
					value={confirmPassword}
					fullWidth
					onKeyPress={onKeyPress}
					onChange={(e) => setConfirmPassword(e.target.value)}
				/>
				<DialogActions>
					<Button onClick={props.onClose} color="primary">
						Cancel
					</Button>
					<Button onClick={onClick} color="primary"
							disabled={password.length < 6 || password
							!== confirmPassword}>
						Change
					</Button>
				</DialogActions>
			</DialogContent>
		</Dialog>
	);
}

ChangeCredentials.propTypes = {
	open: PropTypes.bool.isRequired,
	digitsOnly: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	onPasswordAccepted: PropTypes.func.isRequired,
};

export default ChangeCredentials;
