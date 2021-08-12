// import * as cors from 'cors';
//
//
//
// class CorsMiddleware {
//   private poolRegion: string = 'XXXXXXXXXX';
//   private userPoolId: string = 'XXXXXXXXXXXX';
//   private API_URL: string = "http://localhost:5000";
//
//   constructor() {
//     this.setUp()
//   }
//
//   private async setUp() {
//     //options for cors midddleware
//     const options: cors.CorsOptions = {
//       allowedHeaders: [
//         'Origin',
//         'X-Requested-With',
//         'Content-Type',
//         'Accept',
//         'X-Access-Token',
//       ],
//       credentials: true,
//       methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
//       origin: this.API_URL,
//       preflightContinue: false,
//     };
//   }
// }
//
// export default CorsMiddleware