const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const xrpl = require("xrpl");
const { XummSdk } = require('xumm-sdk');

module.exports = {
    transfer_nft: async ({ params }) => {
        const { seed, tokenID, flags, amount, expiration, code } = params;

        const net = "wss://s.altnet.rippletest.net:51233"
        const client = new xrpl.Client(net)
        await client.connect()
        const standby_wallet = xrpl.Wallet.fromSeed(seed)

        const xumm = new XummSdk(process.env.XUMM_API_KEY_NFT, process.env.XUMM_API_SECRET_KEY_NFT);

        if (seed) {

            try {
                const net = "wss://s.altnet.rippletest.net:51233"
                const client = new xrpl.Client(net)
                await client.connect()
                const standby_wallet = xrpl.Wallet.fromSeed(seed)


                //----------- Prepare expiration -----------//
                var expirationDate = null

                var days = parseInt(expiration)
                let d = new Date()
                d.setDate(d.getDate() + parseInt(days))
                var expirationDate = xrpl.isoTimeToRippleTime(d)

                const customersWalletQuery = parseUtils.query("CustomersWallet");
                customersWalletQuery.equalTo("code", code);

                const walletInstance = await customersWalletQuery.first({ useMasterKey: true });
                if (walletInstance) {
                    const destination = walletInstance.get('walletAddress')
                    console.log("Wallet Address: " + destination)

                    //------------------------- Prepare transaction ---------------------------
                    let transactionBlob = {
                        "TransactionType": "NFTokenCreateOffer",
                        "Account": standby_wallet.classicAddress,
                        "NFTokenID": tokenID,
                        "Amount": amount,
                        "Flags": parseInt(flags),
                        "Destination": destination
                    }

                    transactionBlob.Destination = destination


                    const tx = await client.submitAndWait(transactionBlob, { wallet: standby_wallet })

                    let nftSellOffers;
                    try {
                        nftSellOffers = await client.request({
                            method: "nft_sell_offers",
                            nft_id: tokenID
                        })
                    } catch (err) {
                        nftSellOffers = "No sell offers."
                        console.log("Error", err)
                    }

                    if (nftSellOffers?.result?.offers) {
                        const request = {
                            txjson: {
                                Account: nftSellOffers.result.offers[0].destination,
                                NFTokenSellOffer: nftSellOffers.result.offers[0].nft_offer_index,
                                TransactionType: "NFTokenAcceptOffer"
                            }
                        }
                        const payload = await xumm.payload.create(request, true);
                        console.log("Payload", payload)
                        nftSellOffers.payload = payload;
                        console.log(nftSellOffers)

                    }

                    return nftSellOffers;

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
