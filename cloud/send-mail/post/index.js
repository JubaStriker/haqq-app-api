const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const xrpl = require("xrpl");
const { XummSdk } = require('xumm-sdk');

module.exports = {
    send_mail: async ({ params }) => {
        const { code, name, email, txid } = params;
        const Sdk = new XummSdk(process.env.XUMM_API_KEY_NFT, process.env.XUMM_API_SECRET_KEY_NFT);
        const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
        await client.connect();
        const customersWalletQuery = parseUtils.query("CustomersWallet");
        customersWalletQuery.equalTo("code", code);
        const walletInstance = await customersWalletQuery.first({ useMasterKey: true });
        const account = walletInstance.get('walletAddress')

        if (exists(email)) {
            try {
                const response = await client.request({
                    "id": 1,
                    "command": "tx",
                    "transaction": String(txid),
                    "binary": false
                })
                const offerId = response.result.meta.offer_id;
                const tokenId = response.result.NFTokenID;

                if (account) {
                    const request = {
                        "Account": account,
                        "NFTokenSellOffer": offerId,
                        "TransactionType": "NFTokenAcceptOffer"
                    }

                    const subscription = await Sdk.payload.createAndSubscribe(request, event => {
                        // console.log('New payload event',event.data)  
                        if (Object.keys(event.data).indexOf('signed') > -1) {
                            return event.data
                        }
                    })

                    const nftsQuery = parseUtils.query("Nfts");
                    nftsQuery.equalTo("token", tokenId);
                    const nftsInstance = await nftsQuery.first();
                    console.log(nftsInstance)
                    nftsInstance.set('transferred', true);
                    // const data = await nftsInstance.destroy();
                    const data = await nftsInstance.save(null);


                    return {
                        qr: subscription.created.refs.qr_png,
                        status: subscription.created.refs.websocket_status,
                        email: email,
                        name: name,
                        data: data
                    };

                } else {
                    const code = 404;
                    const message = "Account not found"
                    throw new Parse.Error(code, message);
                }

            }
            catch (e) {
                const { code, message } = errors.constructErrorObject(
                    e.code || e.statusCode || 500,
                    e
                );
                throw new Parse.Error(code, message);
            };
        } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
        }
    },
    initRoutes(req, res) {
        Parse.Cloud.define("send_mail", async (req) => {
            try {
                const data = await this.send_mail(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
