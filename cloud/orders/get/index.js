const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const { exists } = require("../../utils/validate");
const shopifyInstance = require('../../utils/shopify-instance')

module.exports = {
    get_orders: async ({ params, }) => {
        const { shop } = params;
        if (exists(shop)) {
            try {

                console.log("API hit!");
                const shopQuery = parseUtils.query('Shop');
                shopQuery.equalTo('shop', shop);
                let shopInstance = await shopQuery.first({ useMasterKey: true });

                if (shopInstance) {
                    const accessToken = shopInstance.get('accessToken')
                    console.log(accessToken, "Access token")

                    const shopifyNodeInstance = shopifyInstance({
                        shopName: shop,
                        accessToken: shopInstance.get('accessToken'),
                    });

                    // shopifyNodeInstance.order
                    //     .list({ limit: 5 })
                    //     .then((orders) => console.log(orders, "Orders"))
                    //     .catch((err) => console.error(err));

                    const orders = await shopifyNodeInstance.order.list({ limit: 50 });

                    console.log(orders, "Orders");
                    // return products
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
        Parse.Cloud.define("get_orders", async (req) => {
            try {
                const data = await this.get_orders(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
