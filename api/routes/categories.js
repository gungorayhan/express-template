var express = require('express');
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response")
const CustomError = require('../lib/Error');
const Enum = require("../config/Enum")
const AuditLog= require("../lib/AuditLogs")
const LoggerClass = require("../lib/logger/LoggerClass");
const auth =require("../lib/auth")();
const config = require('../config/index')
const emitter = require('../lib/Emitter');
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const excelExport = new (require("../lib/Export"))();
const fs = require("fs");
const path = require("path")
const multer = require("multer")
const Import = new (require("../lib/Import"))(); 


var router = express.Router();

let multerStorage=multer.diskStorage({
    destination:(req,file,next)=>{
        next(null,config.FILE_UPLOAD_PATH)
    },
    filename:(req,file,next)=>{
        next(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage:multerStorage}).single("pb_file")

router.all("*",auth.authenticate(),(req,res,next)=>{
    next();
})

router.get('/',auth.checkRoles("category_views"), async (req,res,next)=>{
    try {
        let categories = await Categories.find({});

        res.json(Response.successResponse(categories))
    } catch (error) {
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(Response.errorResponse(error))
    }
});

router.post('/',auth.checkRoles("category_add"),  async (req,res)=>{
    const {name}=req.body;
    try {
        if(!name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["name"]))

        let category = new Categories({
            name:name,
            is_active:true,
            created_by:req.user?.id
        });

        await category.save();

        AuditLog.info(req.user?.email,"Categories","Add",category)
        LoggerClass.info(req.user?.email,"Categories","Add",category)

        emitter.getEmitter("notification").emit("message",{message:category.name + "is added"}) //yayın yapıyoruz

        res.json(Response.successResponse({success:true}))
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.put('/:id',auth.checkRoles("category_update"), async (req,res)=>{
    const {name,is_active} = req.body;
    const {id} = req.params;
console.log(id)
    try {
        
    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!","id field must be filled")
    if(!name || typeof is_active ==="boolean") throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["name"]))

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

router.delete('/:id',auth.checkRoles("category_delete"), async (req,res)=>{
    const {id}= req.params;

    try {

        if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["id"]))

        await Categories.deleteOne({_id:id})
        AuditLog.info(req.user?.email,"Categories","Update",{_id:id})
        res.json(Response.successResponse({success:true}))
    } catch (error) {
        const errorResponse= Response.errorResponse(error)
        res.status(errorResponse.code).json(Response.errorResponse(error))
    }
})

//auth.checkRoles("category_export")
router.post("/export",upload ,async(req,res)=>{

    try {
        let categories= await Categories.find({});
        let excel = excelExport.toExcel(
            ["Name","IS ACTIVE?","USER_ID","CREATED_BY","UPDATED_BY"],
            ["name",'is_active','created_by','created_at','created_update'],
            categories
        )
        

        let filePath =__dirname+"/../tmp/categories_excell_" + Date.now() + ".xlsx";
        
        fs.writeFileSync(filePath,excel,"UTF-8");

        res.download(filePath);

         // fs.unlinkSync(filePath);
    } catch (error) {
        let errorResponse= Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.post("/import", async (req,res)=>{
    try {
        const file= req.file;
        const body= req.body;
        let rows = Import .fromExcel(file.path);
        for(let i=1; i<rows.length;i++){
            let [name,is_active,user,created_at,updated_at]=rows[i];
            if(name){
            await Categories.create({
                name,
                is_active,
                created_by:req.user._id
            })
        }
        }

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(req.body,Enum.HTTP_CODES.CREATED));
    } catch (error) {
        const errorResponse = new Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse); 
    }
})


module.exports = router;
