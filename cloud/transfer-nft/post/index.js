const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const xrpl = require("xrpl");
const { XummSdk } = require('xumm-sdk');

module.exports = {
    transfer_nft: async ({ params }) => {
        const { account, code, tokenID } = params;

        const Sdk = new XummSdk(process.env.XUMM_API_KEY_NFT, process.env.XUMM_API_SECRET_KEY_NFT);

        if (code) {
            try {

                const customersWalletQuery = parseUtils.query("CustomersWallet");
                customersWalletQuery.equalTo("code", code);

                const walletInstance = await customersWalletQuery.first({ useMasterKey: true });
                if (walletInstance) {
                    const destination = walletInstance.get('walletAddress')
                    // ------------------------- Prepare transaction ---------------------------//

                    const request = {
                        "TransactionType": "NFTokenCreateOffer",
                        "Account": account,
                        "NFTokenID": tokenID,
                        "Amount": "0",
                        "Flags": 1,
                        "Destination": destination
                    }

                    console.log(request)
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
                }
                else {
                    console.log("No wallet address found")
                    return {
                        errorCode: "404",
                        message: "No wallet address found"
                    };
                }

            }
            catch (e) {
                const { code, message } = errors.constructErrorObject(
                    e.code || e.statusCode || 500,
                    e
                );
                throw new Parse.Error(code, message);
            }
        } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
        }
    },
    initRoutes(req, res) {
        Parse.Cloud.define("transfer_nft", async (req) => {
            try {
                const data = await this.transfer_nft(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
