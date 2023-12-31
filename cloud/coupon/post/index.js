const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");
const generator = require("generate-password");
const shopifyInstance = require("../../utils/shopify-instance");
const { get_looks } = require("../../looks/get");
const axios = require("axios");

module.exports = {
  post_coupon: async ({ params }) => {
    const { txid, shop, lookId } = params;
    if (exists(txid, shop, lookId)) {
      try {
        // const verificationStatus = await verify_hbar_payment({
        //   params: { txid },
        // });
        const shopQuery = parseUtils.query("Shop");
        shopQuery.equalTo("shop", shop);
        let shopInstance = await shopQuery.first({ useMasterKey: true });
        if (shopInstance) {
          const shopifyNodeInstance = shopifyInstance({
            shopName: shop,
            accessToken: shopInstance.get("accessToken"),
          });

          const look = await get_looks({ params: { shop, id: lookId } });
          const discountCode = generator.generate({
            symbols: false,
            uppercase: false,
            numbers: false,
            lowercase: true,
            excludeSimilarCharacters: true,
            length: 6,
            strict: true,
          });

          const getPriceRule = async () => {
            try {
              const priceRule = await shopifyNodeInstance.priceRule.create({
                target_type: "line_item",
                allocation_method: "across",
                target_selection: "all",
                customer_selection: "all",
                starts_at: new Date().toISOString(),

                once_per_customer: true,
                title: discountCode,
                value: "-100",
                value_type: "percentage",
              });
              const webhookQuery = parseUtils.query("Webhooks");
              webhookQuery.equalTo("shop", shop);
              webhookQuery
                .find()
                .then((webhooks) => {

                  if (webhooks.length) {
                    webhooks.map((webhook) => {
                      const url = webhook.get("webhook");
                      ;
                      axios
                        .post(url, { txid, shop, lookId })
                        .then((res) => console.log(res))
                        .catch((err) => console.error(err));
                    });
                  }
                })
                .catch((e) => {
                  console.error("Webhook error");
                });
              return priceRule;
            } catch (e) {
              console.error(e);
              const { code, message } = errors.constructErrorObject(
                e.code || e.statusCode || 500,
                e
              );
            }
          };

          const priceRule = await getPriceRule();

          //   const { priceRuleId = await getPriceRuleId({ targetType, value }) } = discount;

          //   if (targetType === "percentage") {
          //     const parsedDiscountValue = parseFloat(value, 10);
          //     if (parsedDiscountValue > 100 || parsedDiscountValue <= 0) {
          //       throw 400;
          //     }
          //   } else if (targetType === "fixed_amount") {
          //     const parsedDiscountValue = parseFloat(value, 10);
          //     if (parsedDiscountValue <= 0) {
          //       throw 400;
          //     }
          //   }

          if (priceRule) {
            // const discountInstance = parseUtils.instance("Discount");
            // discountInstance.set("priceRuleId", priceRule.id);
            // discountInstance.set("targetType", targetType);
            // discountInstance.set("discountValue", value);
            const discountCodeInstance =
              await shopifyNodeInstance.discountCode.create(priceRule.id, {
                code: discountCode,
              });
            if (discountCodeInstance) {
              console.log(discountCodeInstance);
              // discountInstance.set("discount", discountCodeInstance);
              // const acl = new Parse.ACL();
              // acl.setPublicWriteAccess(false);
              // acl.setPublicReadAccess(false);
              // discountInstance.setACL(acl);
              // const savedDiscount = await discountInstance.save(null);
              return {
                tx: null, //verificationStatus,
                discount: discountCodeInstance,
              };
            } else {
              const { code, message } = errors.constructErrorObject(400);
              throw new Parse.Error(code, message);
            }
          } else {
            const { code, message } = errors.constructErrorObject(400);
            throw new Parse.Error(code, message);
          }
        } else {
          const { code, message } = errors.constructErrorObject(400);
          throw new Parse.Error(code, message);
        }
      } catch (e) {
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
    Parse.Cloud.define("post_coupon", async (req) => {
      try {
        const data = await this.post_coupon(req);
        return { data };
      } catch (e) {
        throw e;
      }
    });
  },
};
