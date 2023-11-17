const passport = require("passport")
const { ExtractJwt, Strategy } = require("passport-jwt")
const Users = require("../db/models/Users")
const UserRoles = require("../db/models/UserRoles")
const RolePrivileges = require("../db/models/RolePrivileges")

const config = require("../config")
const privs = require("../config/role_privileges")
const Response = require("../lib/Response")
const CustomError =require("../lib/Error")
const { HTTP_CODES } = require("../config/Enum")
module.exports = function () {
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        try {
            let user = await Users.findOne({ _id: payload.id });
            if (user) {
                let userRoles = await UserRoles.find({ user_id: payload.id })

                let rolePrivileges = await RolePrivileges.find({ role_id: { $in: userRoles.map(ur => ur.role_id) } }) //userRoles tablosu users ve roleprivileges tablolarının ilişkisini sağlayan bir ara tablo.
                // buradan öncelikle id sini elde ettiğimiz kullanıcıya atanmış rol id lerini getiriyoruz sonrasında roller tablosundan elde edilen idlerle rol isimlerini getiriyoruz.
                //sql de bu işlemi joinler ile tablo birleştirerek yapabiliyoeuz where kısmına kullanıcı id ile şart oluşturuyoruz ve select ilede istenilen başlıkları listeletiyoruz.
                //graphql de ise önceden hazırlanmış query ve query de istenen başlıklar sayesinde tablolar rasında gezinme işini graphql e bırakarak verimizi elde ediyoruz


                let privileges = await rolePrivileges.map(rp=>privs.privileges.find(x=>x==rp.permission)) // detaylı bilgiye sahip olmak için önceden hazırladığımız datalardan bilgileri alıyoruz

                done(null, {
                    id: user._id,
                    email:user.email,
                    roles: privileges,
                    firs_name: user.first_name,
                    last_name: user.last_name,
                    exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
                })
            } else {
                done(new Error("User not found"), null)
            }
        } catch (error) {
            done(error, null)
        }
    });

    passport.use(strategy)

    return {
        initialize:function(){
            return passport.initialize();
        },
        authenticate:function(){
            return passport.authenticate("jwt",{session:false})
        },
        checkRoles:(...expectedRoles)=>{

            return (req,res,next)=>{
                let i=0;
                let privileges = req.user.roles.map(x=>key) // map ile verileri dizi halilne getiriyoruz

                while(i < expectedRoles.length && !privileges.includes(expectedRoles[i])) i++; //tüm controller yetkilerine bakılacak ve hepsi kullanıcı izinlerinin arasında aranancak
                // controller için izinler ve kullanıcıya atanan izinler. controller a verilen izinler kullanıcıya atanmışmı
                //öncelikle controller izinlerine bakılıyor sonrasında her bakılan izin kullanıcı yetkileri arasında aranıyor.
                //contoller a verilen izinlerin hpesine bakıldı ve kullanıcı yetkileri arasında rastlanmadıysa hata dönülecek.
                //controller izinlerine bakıldı ve kullanıcı yetkilerinin arasında rastlandı ise devam edilecek 
                if(i >= expectedRoles.length){
                    let response = Response.errorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED,"Need Permission","Need Permission"))
                    return res.status(response.code).json(response)
                }

                return next(); //authorized
            }

        }
    }
}