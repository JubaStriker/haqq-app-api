const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");

module.exports = {
    customers_wallet: async ({ params }) => {
        const { code, walletAddress } = params;

        if (exists(code)) {
            try {
                console.log(code, walletAddress);
                const customersWallerInstance = parseUtils.instance('CustomersWallet')
                customersWallerInstance.set('code', code);
                customersWallerInstance.set('walletAddress', walletAddress);

                const data = await customersWallerInstance.save(null);

                return data;
            }
            catch (err) {
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
        Parse.Cloud.define("customer_wallet", async (req) => {
            try {
                const data = await this.customers_wallet(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
