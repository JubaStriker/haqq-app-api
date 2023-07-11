const user = require("../../user/index");
const products = require("../../products/");
const scripts = require("../../scripts");
const looks = require("../../looks");
const coupons = require("../../coupon");
const pools = require("../../pools");
const xrpPayment = require("../../xrp-payment");

user.initRoutes();
products.initRoutes();
scripts.initRoutes();
looks.initRoutes();
coupons.initRoutes();
pools.initRoutes();
xrpPayment.initRoutes();
