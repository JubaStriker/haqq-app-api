const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const xrpl = require("xrpl");
const { XummSdk } = require('xumm-sdk');

module.exports = {
    create_nft: async ({ params }) => {
        const { account, uri, method } = params;

        if (exists(account)) {
            if (method === "create") {

                const Sdk = new XummSdk(process.env.XUMM_API_KEY_NFT, process.env.XUMM_API_SECRET_KEY_NFT);
                try {

                    const request = {
                        "TransactionType": "NFTokenMint",
                        "Account": account,
                        "TransferFee": 1,
                        "NFTokenTaxon": 0,
                        "Flags": 8,
                        "URI": xrpl.convertStringToHex(uri),
                    }

                    const subscription = await Sdk.payload.createAndSubscribe(request, event => {
                        // console.log('New payload event',event.data)  
                        if (Object.keys(event.data).indexOf('signed') > -1) {
                            return event.data
                        }
                    })

                    return {
                        qr: subscription.created.refs.qr_png,
                        status: subscription.created.refs.websocket_status,
                    };


                } catch (e) {
                    const { code, message } = errors.constructErrorObject(
                        e.code || e.statusCode || 500,
                        e
                    );
                    throw new Parse.Error(code, message);
                }
            }
            //----------- get token by seed -------------//
            else if (method === "get") {
                try {
                    const net = "wss://s.altnet.rippletest.net:51233"
                    const client = new xrpl.Client(net)
                    await client.connect()
                    const standby_wallet = xrpl.Wallet.fromSeed(seed);

                    const nfts = await client.request({
                        method: "account_nfts",
                        account: standby_wallet.classicAddress
                    })

                    return nfts;
                }
                catch (e) {
                    const { code, message } = errors.constructErrorObject(
                        e.code || e.statusCode || 500,
                        e
                    );
                    throw new Parse.Error(code, message);
                }
            }
        } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
        }
    },
    initRoutes(req, res) {
        Parse.Cloud.define("create_nft", async (req) => {
            try {
                const data = await this.create_nft(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
