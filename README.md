# SkyWallet SDK

## Installation
~~~
npm install skywallet-sdk
~~~

## Usage

To be able to use SkyWallet sdk need to initialize it first. For that purpose need to get corresponding token and publicKey from your merchant account on https://skywallet.com.
For testing purposes need to add additional property to config:
~~~ javascript
'url':'https://stage.skywallet.com:9018/api'
~~~
~~~ javascript
const SkyWallet = require('skywallet-sdk');

const config = {
	'apiKey': 'API_KEY',
	'publicKey': 'PUBLIC_KEY',
}
const order = SkyWallet.setConfigs(config);
~~~


## Create new order

Once Customer is trying to pay for some item by X12 the following call should be made. Need to provide corresponding amount in X12 that customer need to pay. Invoice number on merchant side and item SKU.
This call registers the order request in our system and provides corresponding integrated address from SkyWallet main wallet. Integrated address should be provided to customer to make required payment to that address. 
Once above mentioned called is successfully made it should register corresponding order in SkyWallet system and information about that will be available in corresponding section on skywallet.com.

~~~ javascript

const data = {
    'requestedAmount': 5.00,
    'invoiceNumber': 'invoice number',
    'SKU': 'sku',
    'language': 'en',
    'rate': 5.00,
    'price': 25.00,
    'currency': 'USD',
    'description': 'test description',
    'backToMerchantUrl': 'http://merchant.com/webhook'
}

order.createOrder(data, (orderData) => {
	console.log(orderData);
});
~~~

## Get exchange rate

This call will provide capability to convert between your currency and X12 and back the amount that needed to pay.

~~~ javascript
order.getExchangeRate('X12', 'EUR', (response) => {
	console.log(response);
});
~~~

## Webhook

Webhook is defined to notify merchant about order status changes. It should be called in following cases:
1. Order status changed to “fulfilled” and has transactions with less than 10 blocks behind. Considering orders still unverified.
2. Order status is “fulfilled” and transactions have more than 10 blocks behind. Considering order as verified.
3. Order is “expired” but has transactions with 10 blocks behind. Considering order as  verified.
4. Order status is “expired” but no transaction received for it. 
When calling provided webhook making a POST request to given url from merchant and sending the following information:
~~~ javascript
{
    transactionStatus: unverified,
    orderStatus: fulfilled,
    paymentId: "3a1a12cfcf01de09",
    supportId: "TLIH2JXD",
    invoiceNumber: "code_finalflow_po",
    SKU: "98987ABC879798",
	Signature: "asdf23qafds9j29ajfas9fj29fajsa9fj29fwajfao9j"
}
~~~
Once all the transfers related to given order are verified (more than 10 blocks behind)  the transactionStatus field will be equal to “verified”.
Signature should be used to verify the JSON data in response with public key provided to merchant. 
So far webhook is getting called for each order maximum two times.
If webhook is not available for some reasons retrying to call it 20 times. In case of failure order status is switching to “failed”. And email will be send to merchant requesting some action.
The following response from webhook is expected:
	Http status code: 200 
~~~ javascript
{
	status: true
}
~~~
Marking order as “failed” in case of getting following response:
	Http status code: 200 
~~~ javascript
{
	status: false
}
~~~
Need to use following call to verify that the data received on webhook is originally from SkyWallet:

~~~ javascript
let skyWalletRequest = req.body;

order.verify(skyWalletRequest, (response) => {
	console.log(response);
});
~~~