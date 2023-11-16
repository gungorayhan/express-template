const mongoose = require("mongoose")
const RolePrivileges = require("./RolePrivileges")

const schema = mongoose.Schema({
    role_name:{type:String,required:true},
    is_active:{type:Boolean,default:true},
    created_by:{
        type:mongoose.SchemaTypes.ObjectId
    }
}
,{
    versionKey:false,
    timestamps:{
        createdAt:"created_at",
        updatedAt:"updated_at"

    }
})


class Roles extends mongoose.Model{

    // static async delete(query){
    //     console.log(query)
    //     if(query._id){
    //         await RolePrivileges.delete({role_id:query._id})
    //     }

    //     await super.delete(query)
    // }

}

schema.loadClass(Roles)

module.exports = mongoose.model("roles",schema)