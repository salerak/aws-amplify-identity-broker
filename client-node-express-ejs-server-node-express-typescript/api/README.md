# Node Express TypeScript Cognito JWT
  A backend server configured to point to Cognito for authentication and do JWT access and refresh token exchanges and verification
 

# Getting started
 1. npm install
 2. modify cognito variables in `src/services/cognito.service.ts`
 3. modify cognito variables in `src/services/token.service.ts`
 4. modify cognito variables in `src/middleware/auth.middleware.ts`
 5. npm run build
 6. npm start


## Available endpoints

#### 1. auth/signup
  Registers a new user and sends a verification code to email/phone number
  
#### 2. auth/signin
  Takes registered username and password and returns secure jwt tokens
  
#### 3. auth/verify
  Takes a username and code to verify registered account

#### 4. auth/forgot-password
  Intiates a forgot password workflow
  
#### 5. auth/confirm-password
  Confirms that old password has changed

#### 6. auth/user-attributes
  Takes an access token and obtains user data from Cognito

#### 7. auth/exchange
  Takes a code grant and exchanges it for a JWT tokens
  
#### 8. auth/refresh
  Accepts a refresh token and exchanges it for a JWT token

#### 9. auth/member-banner
  Accepts a JWT access token and obtains user data from Member Banner behind API Gateway with Cognito Authorizer
