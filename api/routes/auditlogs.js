var express = require('express');
const moment = require("moment")
const Response = require("../lib/Response");
const AuditLogs = require('../db/models/AuditLogs');
const auth = require("../lib/auth")();
var router = express.Router();

router.all("*",auth.authenticate(),(req,res,next)=>{
  next();
})

/* GET users listing. */
router.post('/',auth.checkRoles("auditlogs_view"), async (req, res) => {
  let body = req.body
  let query = {}
  let skip = body.skip
  let limit = body.limit
  try {

    if (typeof body.skip !== "number") {
      skip = 0;
    }

    if (typeof body.limit !== "number" || body.limit > 500) {
      limit = 500;
    }

    if (body.begin_date && body.end_date) {
      query.created_at = {
        $gte: moment(body.begin_date),
        $lte: moment(body.end_date)
      }

    } else {
      query.created_at = {
        $gte: moment().subtract(1, "day").startOf("day"), //birgün önce
        $lte: moment(body.end_date)
      }
    }

    let auditLogs = await AuditLogs.find(query).sort({created_at:-1}).skip(skip).limit(limit);

    res.json(Response.successResponse(auditLogs))

  } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json({ errorResponse })
  }
});

module.exports = router;
