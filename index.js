if (process.env.NODE_ENV === "DEV") {
  require("dotenv").config("./env");
}

const SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_REDACT =
  "/shopify/webhooks/customers/redact";
const SHOPIFY_WEBHOOK_GDPR_SHOP_REDACT = "/shopify/webhooks/shop/redact";
const SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_DATA_REQUEST =
  "/shopify/webhooks/customers/data_request";
const SHOPIFY_WEBHOOK_APP_UNISTALLED = "/shopify/webhooks/app/uninstalled";

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const routeCache = require("route-cache");
const parseServer = require("./cloud/bootstrap/parse-server");
const shopify = require("./cloud/bootstrap/shopify");
const fs = require("fs");
const { get_looks } = require("./cloud/looks/get");
const { post_looks } = require("./cloud/looks/post");
const { destroy_looks } = require("./cloud/looks/destroy");
const { post_scripts } = require("./cloud/scripts/post");
const { destroy_scripts } = require("./cloud/scripts/destroy");
const { get_products } = require("./cloud/products/get");
const { get_scripts } = require("./cloud/scripts/get");
const { post_views } = require("./cloud/views/post");
const { get_views } = require("./cloud/views/get");
const { get_pools } = require("./cloud/pools/get");
const { post_webhooks } = require("./cloud/webhooks/post");
const https = require("https");
const {
  get_charges,
  post_charges,
  delete_charges,
} = require("./cloud/charges/get");
const { put_shop } = require("./cloud/shop/put");
const { get_shop } = require("./cloud/shop/get");
const { post_coupon } = require("./cloud/coupon/post");
const { get_xrp_payment, verify_xrp_payment, } = require("./cloud/xrp-payment/get");
const { badge_nft } = require("./cloud/badge-nft/post");
const { create_nft } = require("./cloud/nfts/post");
const { transfer_nft } = require("./cloud/transfer-nft/post");
const { get_badge } = require("./cloud/badge-nft/get");
const { get_orders } = require("./cloud/orders/get");
const { customers_wallet } = require("./cloud/customers-wallet/post");
const { send_mail } = require("./cloud/send-mail/post");
const { nft_store } = require("./cloud/nft-store/post");
const { get_nfts } = require("./cloud/nft-store/get");
const { get_transactions } = require("./cloud/islm-transaction/get");


const app = express();
app.use(cookieParser());

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "*",
  })
);
function hmac256Validation({ hmac, rawBody }) {
  // Use raw-body to get the body (buffer)
  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(rawBody, "utf8", "hex")
    .digest("base64");
  return hmac === hash;
}

function verifyShopifyWebhookRequest(req, res, buf, encoding) {
  if (buf && buf.length) {
    const rawBody = buf.toString(encoding || "utf8");
    const hmac = req.get("X-Shopify-Hmac-Sha256");
    req.custom_shopify_verified = hmac256Validation({ hmac, rawBody });
  } else {
    req.custom_shopify_verified = false;
  }
}

shopify.bootstrap(app);
app.use(
  "/shopify/webhooks",
  bodyParser.json({ verify: verifyShopifyWebhookRequest })
);
app.post(SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_REDACT, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);
app.post(SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_DATA_REQUEST, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);
app.post(SHOPIFY_WEBHOOK_GDPR_SHOP_REDACT, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);
app.get(SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_REDACT, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);
app.get(SHOPIFY_WEBHOOK_GDPR_CUSTOMERS_DATA_REQUEST, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);
app.get(SHOPIFY_WEBHOOK_GDPR_SHOP_REDACT, (req, res) =>
  req.custom_shopify_verified ? res.sendStatus(200) : res.sendStatus(401)
);

const PARSE_SERVER_API = parseServer.bootstrap();
app.use("/parse", PARSE_SERVER_API);
app.get("/widget", async (req, res) => {
  const { shop } = req.query;
  if (shop) {
    try {
      if (typeof window !== "undefined") {
        fetch(
          `${process.env.API_SHOPLOOKS_SERVER_URL}/api/post_views?shop=${shop}`
        );
      } else {
        https.get(
          `${process.env.API_SHOPLOOKS_SERVER_URL}/api/post_views?shop=${shop}`
        );
      }
    } catch (e) {
      console.error(e);
    }
  }
  res.set("Content-Type", "text/javascript");
  res.send(`
  (() => {
    const iframe = document.createElement('iframe');
    iframe.src = "${process.env.EMBED_SCRIPT_TAG_URL}?shop=${shop}";
    iframe.style.border = "none";
    iframe.width = "100%";
    iframe.height = "672px";
    iframe.id = "frangout-shop-look-hbar-shop-iframe"
    const shopLookAppEle = document.querySelector('#frangout-shop-look-app');
    if (shopLookAppEle) {
      shopLookAppEle.style.width = "100%";
      shopLookAppEle.style.height = "672px";
      shopLookAppEle.appendChild(iframe);
    } else if (document.location.pathname === "/") {
      const footerDiv = document.querySelector('#shopify-section-footer');
      const footerElement = document.querySelector('footer');
      const mainDiv = document.querySelector("#MainContent");
      const mainElement = document.querySelector('main');
      
      const footerToPrepend = footerDiv || footerElement;
      const mainToPrepend = mainDiv || mainElement;

      if (footerToPrepend) {
        footerToPrepend.insertAdjacentElement("beforeBegin", iframe);
      } else if (mainToPrepend) {
        mainToPrepend.insertAdjacentElement("beforeBegin", iframe);
      } else {
        document.body.appendChild(iframe)
      }
    }
    if (document.location.hash === "#frangout-shop-look-app-wrapper") {
      iframe.scrollIntoView({ behaviour: 'smooth' })
    }
  })()
			
	`);
});

app.get("/api/get_looks", async (req, res) => {
  try {
    const { shop, id } = req.query;
    const data = await get_looks({
      params: { shop, id },
    });
    res.status(200).json(data);

  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/get_orders", async (req, res) => {
  try {
    const { shop } = req.query;
    const data = await get_orders({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/get_products", async (req, res) => {
  try {
    const { shop, ids = "" } = req.query;
    const data = await get_products({
      params: { shop, ids: ids.split(",") },
    });

    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.post("/api/post_looks", async (req, res) => {
  try {
    const { shop, name, price, medias, products, id, blockchain, lookCryptoPrice, cryptoReceiver } = req.body;

    const data = await post_looks({
      params: { shop, name, price, medias, products, id, blockchain, lookCryptoPrice, cryptoReceiver },
    });
    // console.log(data);
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.delete("/api/destroy_looks", async (req, res) => {
  try {
    const { id } = req.query;
    const data = await destroy_looks({
      params: { id },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.post("/api/post_scripts", async (req, res) => {
  try {
    const { shop } = req.body;
    const data = await post_scripts({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.delete("/api/destroy_scripts", async (req, res) => {
  try {
    const { shop } = req.query;
    const data = await destroy_scripts({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/get_scripts", async (req, res) => {
  try {
    const { shop } = req.query;
    const data = await get_scripts({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/get_views", async (req, res) => {
  try {
    const { shop } = req.query;
    const data = await get_views({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/post_views", async (req, res) => {
  try {
    const { shop, subscribed } = req.query;
    const data = await post_views({
      params: { shop, subscribed },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/api/get_charges", async (req, res) => {
  try {
    const { shop } = req.query;
    const data = await get_charges({
      params: { shop },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/post_charges", async (req, res) => {
  try {
    const { shop, returnURL } = req.body;

    const data = await post_charges({
      params: { shop, returnURL },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/delete_charges", async (req, res) => {
  try {
    const { shop, chargeId } = req.body;

    const data = await delete_charges({
      params: { shop, chargeId },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/api/get_shop", async (req, res) => {
  try {
    const { shop, blockchain } = req.query;

    const data = await get_shop({
      params: { shop, blockchain },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post("/api/post_coupon", async (req, res) => {
  try {
    const { txid, shop, lookId } = req.body;

    const data = await post_coupon({
      params: { txid, shop, lookId },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/put_shop", async (req, res) => {
  try {
    const { shop, walletAddress, walletToken, blockchain } = req.body;
    console.log(req.body);
    const data = await put_shop({
      params: { shop, walletAddress, walletToken, blockchain },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/post_webhooks", async (req, res) => {
  try {
    const { shop, webhook } = req.body;
    console.log(req.body);
    const data = await post_webhooks({
      params: { shop, webhook },
    });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/api/get_pools", async (req, res) => {
  try {
    const data = await get_pools();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json(e);
  }
});


app.get("/api/get_xrp_payment", async (req, res) => {
  try {
    const { shop, id } = req.query;
    console.log(shop, id);
    const data = await get_xrp_payment({
      params: { shop, id },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.get("/api/verify_xrp_payment", async (req, res) => {
  try {
    const { txid } = req.query;
    const data = await verify_xrp_payment({
      params: { txid },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(e.code).json(e);
  }
});

app.post("/api/create_nft", async (req, res) => {
  try {
    const { account, uri, method } = req.body;
    const data = await create_nft({
      params: { account, uri, method },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/transfer_nft", async (req, res) => {
  try {
    const { account, code, tokenID } = req.body;
    const data = await transfer_nft({
      params: { account, code, tokenID },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/badge_nft", async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const data = await badge_nft({
      params: { title, description, image },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.post("/api/nft_store", async (req, res) => {
  try {
    const { title, description, image, token, shop } = req.body;
    const data = await nft_store({
      params: { title, description, token, image, shop },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/api/get_nfts", async (req, res) => {
  try {

    const { shop } = req.query;
    const data = await get_nfts({
      params: { shop },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});


app.post("/api/customers_wallet", async (req, res) => {
  try {
    const { code, walletAddress } = req.body;
    const data = await customers_wallet({
      params: { code, walletAddress },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});
app.post("/api/send_mail", async (req, res) => {
  try {
    const { code, name, email, txid } = req.body;
    const data = await send_mail({
      params: { code, name, email, txid },
    });
    res.status(200).json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
});

app.get("/api/islm_transactions", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    const data = await get_transactions({
      params: { walletAddress },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json(e);
  }
});


app.get("/api/badge_nft", async (req, res) => {
  try {
    const { id } = req.query;
    const data = await get_badge({
      params: { id },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get("*", (req, res) => {
  const { shop = "", session } = req.query;
  if (shop && session) {
    res.set(
      "Content-Security-Policy",
      `frame-ancestors https://${shop} https://admin.shopify.com`
    );
  }
  const indexFilePath = path.join(__dirname, ".", "index.html");
  fs.readFile(indexFilePath, "utf8", function (err, data) {
    if (shop && session) {
      data = data.replace(
        "<!--__SHELL_HTML_CONTENT__-->",
        `<script type="text/javascript">window.$crisp=[];window.CRISP_WEBSITE_ID="3701b868-73d8-4697-93df-59113ec756ad";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>`
      );
    }
    res.send(data);
  });
});

app.listen(process.env.PORT, function () {
  console.log("READY");
});
// ParseServer.createLiveQueryServer(httpServer);
process.on("SIGINT", function () {
  console.log("SIGINT");
  process.exit();
});
