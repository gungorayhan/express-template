const mongoose = require("mongoose")
const is = require("is_js");
const CustomError = require("../../lib/Error")
const { PASS_LENGTH, HTTP_CODES } = require("../../config/Enum")
const bcrypt = require("bcrypt-nodejs")
const { DEFAULT_LANG } = require("../../config")
const config = require("../../config")
const i18n = new (require("../../lib/i18n"))(config.DEFAULT_LANG);
const schema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    first_name: String,
    last_name: String,
    phone_number: String,
    language: { type: String, default: DEFAULT_LANG }
}, {
    versiyonKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
}
)


class Users extends mongoose.Model {


   validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }

    static validateFieldsBeforeAuth(email, password) {
        if (typeof password !== 'string' || password.length < PASS_LENGTH || is.not.email(email))
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user?.language), i18n("COMMON.FIELD_MUST_BE_FILLED", req.user?.language, ["password"]))

        return null;
    }
}

schema.loadClass(Users)
module.exports = mongoose.model("users", schema)