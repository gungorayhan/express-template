var express = require('express');
const bcrypt = require("bcrypt-nodejs")
const is = require("is_js")
const Enum = require("../config/Enum")
const Users = require("../db/models/Users")
const Response = require("../lib/Response")
const CustomError = require("../lib/Error")
const UserRoles = require("../db/models/UserRoles")
const Roles = require("../db/models/Roles")
var router = express.Router();




router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name, phone_number } = req.body;

  try {

    let user = await Users.findOne({})
    if(user){
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND)
    }

    if (!email || is.not.email(email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Email field must be")
    if (!password || password.length < Enum.PASS_LENGTH) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Password filed must be")

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
//---
router.get('/', async (req, res) => {
  try {

    let users = await Users.find({})
    res.json(Response.successResponse(users))
  } catch (error) {
    let errorResponse = Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
});

router.post('/', async (req, res) => {
  const { email, password, first_name, last_name, phone_number,roles } = req.body;

  try {

    if (!email || is.not.email(email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Email field must be")
    if (!password || password.length < Enum.PASS_LENGTH) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Password filed must be")

    if(!roles || !Array.isArray(roles || roles.length==0) ){
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "roles field must be an array")
    }

    let rolesFind = await Roles.find({_id:{$in:{roles}}})

    if(rolesFind.length == 0){
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "roles field must be an array")
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

router.put('/:id',async (req,res)=>{
  const {email,password,last_name,first_name,phone_number,roles}= req.body;
  const {id}= req.params;
  try {

    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error","id field must be")
    if(password && password.length<Enum.PASS_LENGTH){
      password=bcrypt.hashSync(password,bcrypt.compare(8),null)
    }
    if(Array.isArray(roles) && roles.length>0){
      let userRoles = await UserRoles.find({})

      let removedRoles = userRoles.filter(x=>!roles.includes(x.role_id.toString())) // veri tabanında gelen veriler arasında body den gelen veriler yok ise romevedRoles değişkenine ata
      let newRoles = roles.filter(x=>!userRoles.map(r.role_id).includes(x)) // body den gelen veriler arasında veri tabanında kayıtlı verilerden var ise tekrar atamamak adına filtreleme yapıyoruz 

      if(removedRoles.length>0){
        await UserRoles.deleteMany({_id:{$in:removedRoles.map(x=>x._id.toString())}})
      }

      if(newRoles>0){
        for(let i=0; i< newRoles.length;i++){
          let priv = await UsersRoles({
            role_id:newRoles.role_id,
            user_id:id
          })
          await priv.save();
        }
      }

    }
    await Users.updateOne({_id:id},{
      email,
      password,
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

router.delete('/:id',async (req,res)=>{
  const {id} = req.params;

  try {
    if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation ERror","id field must be")
    
    await Users.deleteOne({_id:id})
    await UserRoles.deleteMany({_id:id})
    res.json(Response.successResponse({success:true}))
  } catch (error) {
    const errorResponse= Response.errorResponse(error)
    res.status(errorResponse.code).json(errorResponse)
  }
})
module.exports = router;
