const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const { exists } = require("../../utils/validate");

module.exports = {
  put_shop: async ({ params, user }) => {
    const { shop, walletAddress, walletToken, blockchain } = params;
    console.log(params)
    if (exists(shop)) {
      try {
        console.log("BLCHN", blockchain)
        const shopQuery = parseUtils.query("Shop");
        shopQuery.equalTo("shop", shop);
        const shopInstance = await shopQuery.first({ useMasterKey: true });
        if (shopInstance && walletAddress) {
          shopInstance.set("walletAddress", walletAddress);
          shopInstance.set('walletToken', walletToken);
          shopInstance.set('blockchain', blockchain);
          const savedShopInstance = await shopInstance.save(null, {
            useMasterKey: true,
          });
          console.log(savedShopInstance)
          return savedShopInstance;
        } else {
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
    Parse.Cloud.define("put_shop", async (req) => {
      try {
        const data = await this.put_shop(req);
        return { data };
      } catch (e) {
        throw e;
      }
    });
  },
};
