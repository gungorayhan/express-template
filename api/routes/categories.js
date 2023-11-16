var express = require('express');
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response")
const CustomError = require('../lib/Error');
const Enum = require("../config/Enum")
const AuditLog= require("../lib/AuditLogs")
const LoggerClass = require("../lib/logger/LoggerClass");
const auth =require("../lib/auth")();
var router = express.Router();
router.all("*",auth.authenticate(),(req,res,next)=>{
    next();
  })

router.get('/', async (req,res,next)=>{
    try {
        let categories = await Categories.find({});

        res.json(Response.successResponse(categories))
    } catch (error) {
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(Response.errorResponse(error))
    }
});

router.post('/', async (req,res)=>{
    const {name}=req.body;
    try {
        if(!name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!","name fields must be filled")

        let category = new Categories({
            name:name,
            is_active:true,
            created_by:req.user?.id
        });

        await category.save();

        AuditLog.info(req.user?.email,"Categories","Add",category)
        LoggerClass.info(req.user?.email,"Categories","Add",category)
        res.json(Response.successResponse({success:true}))
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.put('/:id',async (req,res)=>{
    const {name,is_active} = req.body;
    const {id} = req.params;
console.log(id)
    try {
        
    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!","id field must be filled")
    if(!name || typeof is_active ==="boolean") throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!","name and is_active fields must be filled")

   const updated = await Categories.updateOne({_id:id},{
        name,
        is_active
    })

    AuditLog.info(req.user?.email,"Categories","Update",{_id:id,updated})

    res.json(Response.successResponse({success:true}))
    } catch (error) {
        const errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(Response.errorResponse(error))
    }

})

router.delete('/:id',async (req,res)=>{
    const {id}= req.params;

    try {

        if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!","id field must be filled")

        await Categories.deleteOne({_id:id})
        AuditLog.info(req.user?.email,"Categories","Update",{_id:id})
        res.json(Response.successResponse({success:true}))
    } catch (error) {
        const errorResponse= Response.errorResponse(error)
        res.status(errorResponse.code).json(Response.errorResponse(error))
    }
})

module.exports = router;
