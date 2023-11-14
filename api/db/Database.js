const mongoose = require("mongoose")

let instance = null;
class Database {
    constructor() {
        if (!instance) {
            this.mongoConnection = null;
            instance = this;
        }
        return instance;
    }

    async connect(options) {
        console.log(options)
        try {
            console.log("DB Connecting...")

            let db = await mongoose.connect(options.CONNECTION_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology:true
            })

            this.mongoConnection = db;
            console.log("DB Connected.")
        } catch (error) {
            console.error(error)
            process.exit(1)
        }

    }
}

module.exports = Database;