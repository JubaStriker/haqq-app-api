const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");

module.exports = {
    nft_store: async ({ params }) => {
        const { title, description, image, token, shop } = params;

        if (exists(title)) {
            try {

                const nftsInstance = parseUtils.instance('Nfts')
                nftsInstance.set('name', title);
                nftsInstance.set('description', description);
                nftsInstance.set('image', image);
                nftsInstance.set('token', token);
                nftsInstance.set('shop', shop);

                const data = await nftsInstance.save(null);

                return data;
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
        Parse.Cloud.define("nft_store", async (req) => {
            try {
                const data = await this.nft_store(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
