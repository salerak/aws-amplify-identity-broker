import App from './app'

import * as bodyParser from 'body-parser'
import cors from 'cors';

import HomeController from './controllers/home.controller'
import AuthController from './controllers/auth.controller'
import ProtectedController from './controllers/protected.controller';

let clientPort = 5000;
const app = new App({
	port: clientPort,
	controllers: [
		new HomeController(),
		new AuthController(),
		new ProtectedController()
	],
	middleWares: [
		// parse application/json
		// parse application/x-www-form-urlencoded
		bodyParser.json(),
		bodyParser.urlencoded({extended: true}),
		cors()
	]
})

app.listen()
