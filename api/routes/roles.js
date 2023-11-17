const express = require('express')
const Roles = require("../db/models/Roles")
const RolePrivileges = require("../db/models/RolePrivileges")
const Response = require('../lib/Response')
const CustomError = require('../lib/Error')
const Enum = require('../config/Enum')
const role_privileges = require('../config/role_privileges')
const auth = require("../lib/auth")();

const router = express.Router()

router.all("*",auth.authenticate(),(req,res,next)=>{
    next();
 })


router.get('/',auth.checkRoles("roles_views"), async (req,res)=>{
try {
    let roles= await Roles.find({});
    res.json(Response.successResponse(roles))
} catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
}
})


router.post('/', auth.checkRoles("roles_add"), async (req,res)=>{
    const {role_name,permissions}= req.body;
    console.log(req.body)
    try {
        if(!role_name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,'Validation error','rol name and is active fileds must be filled')
        if(!permissions || !Array.isArray(permissions) || permissions.length == 0) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,'Validation error','permissions filed must be filled')
        const roles = new Roles({
            role_name,
            created_by:req.user?.id
        })

        await roles.save();

        for(let i=0; i<permissions.length;i++){
            let priv = new RolePrivileges({
                role_id:roles._id,
                permissions:permissions[i],
                created_by:req.user?.id
            })
            await priv.save();
        }
        res.json(Response.successResponse({success:true}))

    } catch (error) {
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.put('/:id', auth.checkRoles("roles_update"),async (req,res)=>{
    const {role_name,is_active,permissions}= req.body;
    const {id}= req.params;
    
    try {
        if(!id) throw new CustomError(CustomError(Enum.HTTP_CODES.BAD_REQUEST,'Validation error','id filed must be filled'))

        if(!role_name || typeof is_active === 'boolean') throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,'Validation error','rol name and is active fileds must be filled')
        
        const updates ={
            role_name,
            is_active,
        }

        // ------

        if(permissions && Array.isArray(permissions) && permissions.length>0){
          
            let permissionsRole = await RolePrivileges.find({role_id:id})

            //body.permisions => ["category_view","user_add"]filter x-> array olduğu için direk  includes kullanılabilir
            //permissonsRole =>[{role_id:"abc",permissions:"user_add"}]filter x -> object olduğu için  map ile permisson key i ne kadar gidip yeni bir array yapacağız. array dönüşümü sonrasında includes içerisinde kullanailirz
            let removedPermissions= permissionsRole.filter(x=>!permissions.includes(x.permissions))
            let newPermissions = permissions.filter(x=>!permissions.map(p=>p.permissions).includes(x))


            if(removedPermissions.length>0){
                console.log("delete")
                await RolePrivileges.deleteOne({_id:{$in: removedPermissions.map(x=>x._id)}})
            }

            if(newPermissions.length >0){
              
                for(let i=0;i<newPermissions.length;i++){
                    let priv= new RolePrivileges({
                        role_id:id,
                        permissions:newPermissions[i],
                        created_by:req.user?.id

                    })

                    await priv.save();
                }
            }
           
        }

        //-----

        await Roles.updateOne({_id:id},updates);

        res.json(Response.successResponse({success:true}))

    } catch (error) {
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.delete('/:id', auth.checkRoles("roles_delete"),async (req,res)=>{

    const {id}= req.params;
    try {

        if(!id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,'Validation error','id filed must be filled')

        await Roles.deleteOne({_id:id})

        res.json(Response.successResponse({success:true}))
        
    } catch (error) {
        let errorResponse = Response.errorResponse(error)
        res.status(errorResponse.code).json(errorResponse)
    }
})

router.get('/role-privileges',async (req,res)=>{
    res.json(role_privileges)
})

module.exports=router;