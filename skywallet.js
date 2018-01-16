const rp = require('request-promise');
const md5 = require('md5');
const crypto2 = require('crypto2');

class SkyWallet{

	constructor(apiKey, publicKey, reqUrl){
		this.token = apiKey;
		this.publicKey = publicKey;
		this.reqUrl = reqUrl;
	}

	/**
	 * @apiVersion 1.0.0
	 * @api {post} /order Add Order into the system
	 * @apiName CreateOrder
	 * @apiGroup Order
	 * @apiDescription
	 * Add an order into system based on specified amount, invoice number and SKU.
	 * The call besides creating the order, returns integratedAddress and paymentId associated with newly created order.
	 * This call also checks the validity of the IP address of the caller
	 *
	 * @apiParam {String} requestedAmount Amount for the Order.
	 * @apiParam {String} integratedAddress Integrated address of the user that pays. xxxx todo right comment ?
	 * @apiParam {String} paymentId Payment ID for the order.
	 * @apiParam {String} [invoiceNumber] Invoice number for the order specified by merchant, max 20 symbols.
	 * @apiParam {String} [SKU] SKU of the order specified by merchant, max 20 symbols.
	 *
	 * @apiParamExample {json} Request-Example:
	 *  {
 	 *	    "requestedAmount": "10.99",
 	 *	    "invoiceNumber": "code_4242424_po",
 	 *	    "SKU": "98987ABC879798",
 	 *  }
	 *
	 * @apiSuccess (CustomSuccess) {String} id Newly created unique Order id
	 *
	 * @apiSuccessExample Success-Response
	 *  {
 	 *      "status": true,
 	 *      "result": {
 	 *           "id": "5a219045538738d11a9be051",
 	 *           "userId": "5a2189719bf5c7d0d3031837",
 	 *           "requestedAmount": 10.5,
 	 *           "receivedAmount": 0,
 	 *           "receivedTransactions": [],
 	 *           "commissionAmount": 0.315,
 	 *           "integratedAddress": "ix12bxwtdiocQm4adwVnL1LGEj6FMU5E5B9fTYcqoP...",
 	 *           "paymentId": "d98f5143d7fd82c8",
 	 *           "supportId": "TPLGSLD6",
 	 *           "invoiceNumber": "code_4242424_po",
 	 *           "SKU": "98987ABC879798",
 	 *           "status": "new",
 	 *           "updated": "2017-12-01T17:24:21.309Z",
 	 *           "created": "2017-12-01T17:24:21.309Z"
 	 *      }
 	 * }
	 *
	 * @apiError (CustomError) VALIDATION Some request parameter was invalid
	 *
	 * @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Invalid invoice number",
 	 *      "code": 552
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Invalid SKU",
 	 *      "code": 552
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Invalid requested amount",
 	 *      "code": 552
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Invalid user ID",
 	 *      "code": 552
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "User is not found",
 	 *      "code": 404
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Only merchants may accept orders",
 	 *      "code": 553
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *      "status": false,
 	 *      "message": "Access IP address is not allowed",
 	 *      "code": 553
 	 *  }
	 *  @apiErrorExample Error-Response
	 *  {
 	 *	     "status": false,
 	 *      "message": "Failed to get new payment ID and integrated address. Reason: ",
 	 *      "code": 553
 	 *  }
	 *
	 */
	createOrder(args, callback) {

		if (!SkyWallet.isValidPositiveNumber(args.requestedAmount)) {
			return callback(SkyWallet.errorMessage('Invalid requested amount', 552));
		}

		if (!SkyWallet.isValidString(args.invoiceNumber) || args.invoiceNumber.length > 20) {
			return callback(SkyWallet.errorMessage('Invalid invoice number', 552));
		}

		if (!SkyWallet.isValidString(args.SKU) || args.SKU.length > 20) {
			return callback(SkyWallet.errorMessage('Invalid SKU', 552));
		}

		let data = {
			"requestedAmount": args.requestedAmount,
			"invoiceNumber": args.invoiceNumber,
			"SKU": args.sku
		};

		if(args.language) data.language = args.language;
		if(args.rate) data.rate = args.rate;
		if(args.price) data.price = args.price;
		if(args.currency) data.currency = args.currency;
		if(args.description) data.description = args.description;
		if(args.backToMerchantUrl) data.backToMerchantUrl = args.backToMerchantUrl;

		let options = this.requsetOptions('POST', '/order', data);

		rp(options)
			.then(function (orderData) {
				return callback(orderData);
			})
			.catch(function (err) {
				return callback(this.errorMessage(err, 552));
			});
	}

	/**
	 * @apiVersion 1.0.0
	 * @api {get} /rate/:base/:quote
	 * @apiName GetRate
	 * @apiGroup Rate
	 * @apiDescription
	 * Get rate for certain base
	 *
	 * @apiParam {Number} base Base currency
	 * @apiParam {Number} quote Quote currency
	 *
	 * @apiSuccess (CustomSuccess) {Number} price base/quote
	 *
	 * @apiSuccessExample Success-Response
	 * {
 	 *   "status": true,
 	 *   "result": {
 	 *     "rate": 0
 	 *   }
 	 * }
	 *
	 * @apiError (CustomError) VALIDATION Some request parameter was invalid
	 * @apiError (CustomError) SYSTEM Some request parameter was invalid
	 *
	 * @apiErrorExample Error-Response
	 * {
 	 *     "status": false,
 	 *      "message": "Invalid base currency",
 	 *      "code": 552
 	 * }
	 *
	 * @apiErrorExample Error-Response
	 * {
 	 *     "status": false,
 	 *      "message": "Invalid quote currency",
 	 *      "code": 552
 	 * }
	 *
	 * @apiErrorExample Error-Response
	 * {
 	 *     "status": false,
 	 *      "message": "Could not get rates",
 	 *      "code": 552
  	 * }
	 *
	 */
	getExchangeRate(base, quote, callback){
		if (!SkyWallet.isValidString(base)) {
			return callback(SkyWallet.errorMessage('Invalid base currency', 552));
		}

		if (!SkyWallet.isValidString(quote)) {
			return callback(SkyWallet.errorMessage('Invalid quote currency', 552));
		}

		let options = this.requsetOptions('GET', '/rate/' +base+ '/' + quote);

		rp(options)
			.then(function (repos) {
				return callback(repos);
			})
			.catch(function (err) {
				return callback(SkyWallet.errorMessage(err, 552));
			});
	}


	verify(reqBody, callback){
		let body = reqBody;
		let signature = body.signature;
		delete body.signature;
		let bodyHash = md5(JSON.stringify(body));
		crypto2.verify(bodyHash, this.publicKey, signature, (err, isSignatureValid) => {
			if(isSignatureValid){
				return callback(SkyWallet.successMessage(body));
			}else{
				return callback(SkyWallet.errorMessage('Verification failed', 552));
			}
		});
	}

	requsetOptions(type, url, data){
		let options = {};
		options.method = type;
		options.url = this.reqUrl + url;
		options.headers = {'Authorization': "sky-wallet <"+this.token+">"};
		if(type === "POST"){
			options.body = data;
		}
		options.json = true;

		return options;
	}

	static errorMessage(message, errorCode) {
		if(!message) message = "Unknown error";
		if(!errorCode) errorCode = 552;

		return {
			"status": false,
			"message": message,
			"code": errorCode
		};
	}

	static successMessage(message) {
		if(!message) message = "Success";
		return {
			"status": true,
			"result": message
		};
	}

	static isSet(data) {
		return data != undefined && data != null;
	}

	static isValidPositiveNumber(data) {
		return (SkyWallet.isSet(data) && (data === parseInt(data, 10) || data === parseFloat(data, 10)) && data > 0);
	}

	static isValidString(data) {
		return (SkyWallet.isSet(data) && (data || data === "") && typeof data === "string");
	}

	static setConfigs(config) {
		if(!config.url){
			config.url = 'https://app.skywallet.com:9018/api';
		}

		if(!config.apiKey){
			throw new Error('You must set API KEY');
		}

		if(!config.publicKey){
			throw new Error('You must set publicKey');
		}

		return new SkyWallet(config.apiKey, config.publicKey, config.url);
	}
}

module.exports = SkyWallet;