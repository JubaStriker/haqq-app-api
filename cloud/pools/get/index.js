module.exports = {
  get_pools: async () => {
    return [
      {
        platform: "saucerswap",
        pool: {
          token1: "HBAR",
          token2: "USDC",
        },
        apy: 26.34,
        tvl: 1100000,
        poolInfo: "https://analytics.saucerswap.finance/pool/0.0.1462797",
        poolLink:
          "https://www.saucerswap.finance/liquidity/supply/HBAR/0.0.456858",
        logo: "https://3682348699-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F5hXF6kx1TaOoCMAhLCv3%2Fuploads%2F02nrzR81PVCgiknaXuJW%2FSAUCE%20Token%20Icon.png?alt=media&token=5e07a4d4-193d-4cda-80d2-2ca9e9967062",
      },
      {
        platform: "heliswap",
        pool: {
          token1: "HBAR",
          token2: "USDC",
        },
        apy: 0.3,
        tvl: 218100,
        poolInfo:
          "https://app.heliswap.io/analytics/pool/0x53BD01DCf3dfFb9dfe241793D6B79d90079e0f48",
        poolLink:
          "https://app.heliswap.io/create/0x000000000000000000000000000000000006f89a/0x00000000000000000000000000000000002cc823",
        logo: "https://app.heliswap.io/logo.svg",
      },
    ];
  },
  initRoutes(req, res) {
    Parse.Cloud.define("get_pools", async (req) => {
      try {
        const data = await this.get_pools(req);
        return { data };
      } catch (e) {
        throw e;
      }
    });
  },
};
