const ShopifyNodeApi = require('shopify-api-node');

const shopifyNodeInstance = ({
    shopName,
    accessToken,
    apiVersion = '2023-01'
}) => new ShopifyNodeApi({
    shopName,
    accessToken,
    apiVersion
});

module.exports = shopifyNodeInstance;