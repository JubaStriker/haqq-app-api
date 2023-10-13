const { default: axios } = require("axios");
const errors = require("../../utils/error-handling/index");
const { exists } = require("../../utils/validate");


module.exports = {
    get_transactions: async ({ params }) => {
        const { walletAddress } = params;
        if (exists(walletAddress)) {
            try {
                console.log(walletAddress)
                const { data } = await axios.get(`https://explorer.testedge2.haqq.network/api/v2/addresses/${walletAddress}/transactions`);
                return data.items;

            } catch (e) {
                throw e;
            }
        } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
        }
    },
    initRoutes(req, res) {
        Parse.Cloud.define("get_transactions", async (req) => {
            try {
                const data = await this.get_transactions(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
