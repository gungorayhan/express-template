var express = require('express');
const bcrypt = require("bcrypt-nodejs")
const is = require("is_js");
const jwt = require("jwt-simple");
const Enum = require("../config/Enum")
const Users = require("../db/models/Users")
const Response = require("../lib/Response")
const CustomError = require("../lib/Error")
const UserRoles = require("../db/models/UserRoles")
const Roles = require("../db/models/Roles");
const config = require('../config');
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);

var router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name, phone_number } = req.body;

  try {

    let user = await Users.findOne({})
    if(user){
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND)
    }

    if (!email || is.not.email(email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["email"]))
    if (!password || password.length < Enum.PASS_LENGTH) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["password"]))

    let passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)

   let createdUser= await Users.create({
      email,
      password: passwordHash,
      is_active: true,
      first_name,
      last_name,
      phone_number
    })

    let role=await Roles.create({
      role_name:Enum.SUPER_ADMIN,
      is_active:true,
      created_by:createdUser._id
    })

    await UserRoles.create({
      role_id:role._id,
      user_id:createdUser._id,
    })

    res.json(Response.successResponse({ success: true }))
  } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})



router.post('/auth',async (req,res)=>{
  const {email,password}=req.body;
 
  
  try {
    Users.validateFieldsBeforeAuth(email,password);
    
    
    let user = await Users.findOne({email});

    if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["email adn password"]))

   // if(!user.validPassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["password"]))

    let payload={
      id:user._id,
      exp:parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
    }
    let userData={
      _id:user._id,
      first_name:user.first_name,
      last_name:user.last_name
    }
    

    let token = jwt.encode(payload,config.JWT.SECRET);
    res.json(Response.successResponse({token, user:userData}));

  } catch (error) {
    const errorResponse= Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})
//---

router.all("*",auth.authenticate(),(req,res,next)=>{
  next();
})


router.get('/', auth.checkRoles("user_view"), async (req, res) => {
  try {

    let users = await Users.find({})
    res.json(Response.successResponse(users))
  } catch (error) {
    let errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
});

router.post('/',auth.checkRoles("user_add"), async (req, res) => {
  const { email, password, first_name, last_name, phone_number,roles } = req.body;

  try {

    if (!email || is.not.email(email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["email"]))
    if (!password || password.length < Enum.PASS_LENGTH) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["password"]))

    if(!roles || !Array.isArray(roles || roles.length==0) ){
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["roles"]))
    }

    let rolesFind = await Roles.find({_id:{$in:{roles}}})

    if(rolesFind.length == 0){
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["roles"]))
    }

    let passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)

    let user =await Users.create({
      email,
      password: passwordHash,
      is_active: true,
      first_name,
      last_name,
      phone_number
    })


    for (let i=0; i<rolesFind.length;i++){
      await UserRoles.create({
        role_id:rolesFind[i]._id,
        user_id:user_id
      })
    }

    res.json(Response.successResponse({ success: true }))
  } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})
 
router.put('/:id',auth.checkRoles("user_update"), async (req,res)=>{
  const {email,password,last_name,first_name,phone_number,roles}= req.body;
  const {id}= req.params;
  var passwordHash=null;
  try {

    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["id"]))
    if(password && password.length<Enum.PASS_LENGTH){
       passwordHash=bcrypt.hashSync(password,bcrypt.genSaltSync(8),null)
       
    }
    if(Array.isArray(roles) && roles.length>0){
      let userRoles = await UserRoles.find({})

      let removedRoles = userRoles.filter(x=>!roles.includes(x.role_id.toString())) // veri tabanında gelen veriler arasında body den gelen veriler yok ise romevedRoles değişkenine ata
     
      let newRoles = roles.filter(x=>!userRoles.map(r=>r.role_id).includes(x)) // body den gelen veriler arasında veri tabanında kayıtlı verilerden var ise tekrar atamamak adına filtreleme yapıyoruz 
 
      if(removedRoles.length>0){
        await UserRoles.deleteMany({_id:{$in:removedRoles.map(x=>x._id.toString())}})
      }

      if(newRoles>0){
        for(let i=0; i< newRoles.length;i++){
          let priv = await UserRoles({
            role_id:newRoles.role_id,
            user_id:id
          })
          await priv.save();
        }
      }

    }
    await Users.updateOne({_id:id},{
      email,
      password:passwordHash,
      first_name,
      last_name,
      phone_number
    })

    res.json(Response.successResponse({success:true}))

  } catch (error) {
    const errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})

router.delete('/:id',auth.checkRoles("user_delete"),async (req,res)=>{
  const {id} = req.params;

  try {
    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language),i18n("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["id"]))
    
    await Users.deleteOne({_id:id})
    await UserRoles.deleteMany({_id:id})
    res.json(Response.successResponse({success:true}))
  } catch (error) {
    const errorResponse= Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})

module.exports = router;
