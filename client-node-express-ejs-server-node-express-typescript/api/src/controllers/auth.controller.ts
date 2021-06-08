import * as express from 'express'
import {Request, Response} from 'express'
import {body, validationResult, query, header} from 'express-validator';
import CognitoService from '../services/cognito.service';
import TokenService from '../services/token.service';
const util = require('util')

class AuthController {
	public path = '/auth'
	public router = express.Router()

	constructor() {
		this.initRoutes()
	}

	public initRoutes() {
		this.router.post('/signup', this.validateBody('signUp'), this.signUp)
		this.router.post('/signin', this.validateBody('signIn'), this.signIn)
		this.router.post('/verify', this.validateBody('verify'), this.verify)
		this.router.post('/forgot-password', this.validateBody('forgotPassword'), this.forgotPassword)
		this.router.post('/confirm-password', this.validateBody('confirmPassword'), this.confirmPassword)
		this.router.post('/set-user-password', this.validateBody('setUserPassword'), this.setUserPassword)
		this.router.get('/user-attributes', this.validateBody('userAttributes'), this.userAttributes)
		this.router.get('/exchange', this.validateBody('exchange'), this.exchangeForJWTToken)
		this.router.get('/refresh', this.validateBody('refresh'), this.accessTokenFromRefreshToken)
		this.router.get('/member-banner', this.validateBody('memberBanner'), this.userFromMemberBanner)
	}


	// Signup new user
	signUp = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		console.log(req.body)
		const {username, password, email, gender, birthdate, name, family_name} = req.body;
		let userAttr = [];
		userAttr.push({Name: 'email', Value: email});
		userAttr.push({Name: 'gender', Value: gender});
		userAttr.push({Name: 'birthdate', Value: birthdate.toString()});
		userAttr.push({Name: 'name', Value: name});
		userAttr.push({Name: 'family_name', Value: family_name});


		let cognitoService = new CognitoService();
		cognitoService.signUpUser(username, password, userAttr)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		})
	}

	// Use username and password to authenticate user
	signIn = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		console.log(req.body);


		const {username, password} = req.body;
		let cognitoService = new CognitoService();
		cognitoService.signInUser(username, password)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		})
	}


	// confirm signup account with code sent to email
	verify = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		console.log(req.body)
		const {username, code} = req.body;

		let cognitoService = new CognitoService();
		cognitoService.confirmSignUp(username, code)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		})
	}

	confirmPassword = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		const {username, password, code} = req.body;

		let cognitoService = new CognitoService();
		cognitoService.confirmNewPassword(username, password, code)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		})
	}

	setUserPassword = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		const {username, password} = req.body;

		let cognitoService = new CognitoService();
		cognitoService.adminSetUserPassword(username, password)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		})
	}

	forgotPassword = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		const {username} = req.body;

		let cognitoService = new CognitoService();
		cognitoService.forgotPassword(username)
		.then(success => {
			success ? res.status(200).end() : res.status(400).end()
		});
	}

	userAttributes = (req: Request, res: Response) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		let token = req.header("Token")

		let cognitoService = new CognitoService();
		cognitoService.getUserAttributes(token)
		.then(data => {
			data ? res.send(data) : res.status(400).end()
		});
	}

	exchangeForJWTToken = (req: Request, res: Response) => {
		console.log("exchangeForJWTToken" + util.inspect(req.query.code, {
			showHidden: false,
			depth: null
		}))

		const result = validationResult(req);

		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}

		let grantCode = typeof req.query.code !== "undefined" ? req.query.code : "";

		let tokenService = new TokenService();
		if (typeof grantCode === "string") {
			tokenService.exchangeCodeForJWTToken(grantCode)
			.then(data => {
				res.send(data)
			}).catch(error => {
				res.status(400).send(error).end()
			});
		}
	}

	accessTokenFromRefreshToken = (req: Request, res: Response) => {
		console.log("req " + util.inspect(req.header("Token"), {showHidden: false, depth: null}))
		const result = validationResult(req);
		// console.log("result" + util.inspect(result, {showHidden: false, depth: 2}))
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		let token = req.header("Token")

		let tokenService = new TokenService();
		tokenService.accessTokenFromRefreshToken(token)
		.then(data => {
			console.log(data)
			data ? res.send(data) : res.status(400).end()
		});
	}

	userFromMemberBanner = (req: Request, res: Response) => {
		console.log("req" + util.inspect(req.query, {showHidden: false, depth: null}))
		const result = validationResult(req);
		// console.log("result" + util.inspect(result, {showHidden: false, depth: 2}))
		if (!result.isEmpty()) {
			return res.status(422).json({errors: result.array()});
		}
		let token = req.header("Token")
		let username = req.header("Username")
		let memberId = req.header("MemberId")

		let tokenService = new TokenService();
		tokenService.callMemberBanner(token, username, memberId)
		.then(data => {
			console.log(data)
			data ? res.send(data) : res.status(400).end()
		});

	}

	private validateBody(type: string) {
		switch (type) {
			case 'signUp':
				return [
					body('username').notEmpty().isLength({min: 5}),
					body('email').notEmpty().normalizeEmail().isEmail(),
					body('password').isString().isLength({min: 8}),
					body('birthdate').exists().isISO8601(),
					body('gender').notEmpty().isString(),
					body('name').notEmpty().isString(),
					body('family_name').notEmpty().isString()
				]
			case 'signIn':
				return [
					body('username').notEmpty().isLength({min: 5}),
					body('password').isString().isLength({min: 8}),
				]
			case 'verify':
				return [
					body('username').notEmpty().isLength({min: 5}),
					body('code').notEmpty().isString().isLength({min: 6, max: 6})
				]
			case 'forgotPassword':
				return [
					body('username').notEmpty().isLength({min: 5}),
				]
			case 'confirmPassword':
				return [
					body('password').exists().isLength({min: 8}),
					body('username').notEmpty().isLength({min: 5}),
					body('code').notEmpty().isString().isLength({min: 6, max: 6})
				]
			case 'setUserPassword':
				return [
					body('username').notEmpty(),
					body('password').exists().isLength({min: 6}),
				]
			case 'userAttributes':
				return [
					header('Token').notEmpty().isString().isLength({min: 150})
				]
			case 'exchange':
				return [
					query('code').notEmpty().isString().isLength({max: 36})
				]
			case 'refresh':
				return [
					header('Token').notEmpty().isString().isLength({min: 150})
				]
			case 'memberBanner':
				return [
					header('Token').notEmpty().isString().isLength({min: 150})
				]
		}
	}
}

export default AuthController
