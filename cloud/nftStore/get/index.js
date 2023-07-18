const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const { exists } = require("../../utils/validate");

module.exports = {
    get_nfts: async ({ params }) => {
        const { shop } = params;
        if (exists(shop)) {
            try {
                console.log("api hit", shop);
                const nftsQuery = parseUtils.query("Nfts");
                nftsQuery.equalTo("shop", shop);


                const nftsInstance = await nftsQuery.find();

                if (nftsInstance) {
                    console.log(nftsInstance);
                    return nftsInstance;
                }
                else {
                    const { code, message } = errors.constructErrorObject(404);
                    throw new Parse.Error(code, message);
                }
            } catch (e) {
                throw e;
            }
        } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
        }
    },
    initRoutes(req, res) {
        Parse.Cloud.define('get_nfts', async (req) => {
            try {
                const { data } = await this.get_nfts(req);
                return data;
            } catch (e) {
                throw e
            }
        })
    }
}
