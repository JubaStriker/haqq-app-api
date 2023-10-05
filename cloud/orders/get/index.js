const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const { exists } = require("../../utils/validate");
const shopifyInstance = require('../../utils/shopify-instance')

module.exports = {
    get_orders: async ({ params, }) => {
        const { shop } = params;
        if (exists(shop)) {
            try {

                const shopQuery = parseUtils.query('Shop');
                shopQuery.equalTo('shop', shop);
                let shopInstance = await shopQuery.first({ useMasterKey: true });

                if (shopInstance) {
                    const accessToken = shopInstance.get('accessToken')

                    const shopifyNodeInstance = shopifyInstance({
                        shopName: shop,
                        accessToken: accessToken,
                    });
                    const shopifyShopData = await shopifyNodeInstance.shop.get();

                    console.log(accessToken, shopifyShopData);

                    // shopifyNodeInstance.order
                    //     .list()
                    //     .then((orders) => console.log(orders, "Orders"))
                    //     .catch((err) => console.log(err, "Error"));

                    // const orders1 = await shopifyNodeInstance.order.list({ limit: 50 });
                    const orders = [
                        {
                            billing_address: {
                                first_name: "John Doe",
                            },
                            contact_email: "johndoe@gmail.com",
                            shipping_address: {
                                address1: 'Dhaka, Bangladesh'
                            },
                            discount_codes: [
                                { code: 'ctbfpd' }
                            ]
                        },
                        {
                            billing_address: {
                                first_name: "Jane Doe",
                            },
                            contact_email: "janedoe@gmail.com",
                            shipping_address: {
                                address1: 'Dhaka, Bangladesh'
                            },
                            discount_codes: [
                                { code: 'yyhzfw' }
                            ]
                        }
                    ];

                    return orders;
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
