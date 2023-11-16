const Enum = require("../config/Enum");
const AuditLogs = require("../db/models/AuditLogs")

let instance=null;
class AuditLog {
    constructor(){
        if(!instance){
            instance=this
        }
        return instance;
    }
    info(email,location,proc_type,log){
        this.#saveToDB({
            level:Enum.LOG_LEVELS.INFO,
            email,
            location,
            proc_type,
            log
        })
    }

    warn(email,location,proc_type,log){
        this.#saveToDB({
            level:Enum.LOG_LEVELS.WARN,
            email,
            location,
            proc_type,
            log
        })
    }

    error(email,location,proc_type,log){
        this.#saveToDB({
            level:Enum.LOG_LEVELS.ERROR,
            email,
            location,
            proc_type,
            log
        })
    }

    debug(email,location,proc_type,log){
        this.#saveToDB({
            level:Enum.LOG_LEVELS.DEBUG,
            email,
            location,
            proc_type,
            log
        })
    }

    #saveToDB({level,email,location,proc_type,log}){
        AuditLogs.create({
            level,
            email,
            location,
            proc_type,
            log
        })
    }
}

module.exports = new AuditLog()