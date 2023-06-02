const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const { exists } = require("../../utils/validate");
const shopifyInstance = require("../../utils/shopify-instance");

module.exports = {
  post_webhooks: async ({ params, user }) => {
    const { webhook, shop } = params;
    if (exists(shop, webhook)) {
      try {
        const webhooksInstance = parseUtils.instance("Webhooks");
        webhooksInstance.set("webhook", webhook);
        webhooksInstance.set("shop", shop);
        const data = await webhooksInstance.save(null);
        return data;
      } catch (e) {
        const { code, message } = errors.constructErrorObject(500);
        throw new Parse.Error(code, message);
      }
    } else {
      const { code, message } = errors.constructErrorObject(400);
      throw new Parse.Error(code, message);
    }
  },
  initRoutes(req, res) {
    Parse.Cloud.define("post_webhooks", async (req) => {
      try {
        const data = await this.post_webhooks(req);
        return { data };
      } catch (e) {
        throw e;
      }
    });
  },
};
