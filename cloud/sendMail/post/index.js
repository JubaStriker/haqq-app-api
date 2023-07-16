const { exists } = require("../../utils/validate/index");
const errors = require("../../utils/error-handling/index");
const parseUtils = require("../../utils/parse-utils/index");

module.exports = {
    send_mail: async ({ params }) => {
        const { email } = params;

        if (exists(email)) {
            try {

                console.log("API hit!", email);
            }
            catch (err) {
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
        Parse.Cloud.define("send_mail", async (req) => {
            try {
                const data = await this.send_mail(req);
                return { data };
            } catch (e) {
                throw e;
            }
        });
    },
};
