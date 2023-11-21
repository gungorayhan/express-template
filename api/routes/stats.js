var express = require('express');
const moment = require("moment")
const Response = require("../lib/Response");
const AuditLogs = require('../db/models/AuditLogs');
const Categories = require("../db/models/Categories");
const Users = require('../db/models/Users');
const auth = require("../lib/auth")();
var router = express.Router();


/**
 * auditlog tablosunda işlem yapan kişielrein hangi tip işlemi kaç kez yaptı
 * kategori tablosunda tekil veri sayısı
 * sistemde tanımlı kaç kullanıcı var
 */

router.post('/auditlogs/categories', async (req, res) => {
    try {
        let result = await AuditLogs.aggregate([
            { $match: { location: "Categories" } },
            {$group:{_id:{email:"$email",proc_type:"$proc_type"},count:{$sum:1}}},
            {$sort:{count:-1}}
        ])

        res.json(Response.successResponse(result))
    } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
}
});

router.post('/auditlogs/categories/unique', async (req, res) => {
    try {

        let result = await Categories.distinct("name",{is_active:true})
        

        res.json(Response.successResponse(result))
    } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
}
});

router.post('/users/count', async (req, res) => {
    try {
        
        let result = await Users.count({is_active:true});

        res.json(Response.successResponse(result))
    } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
}
});

module.exports = router;
