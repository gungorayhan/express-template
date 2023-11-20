const express= require("express")
const router = express();
const { HTTP_CODES } = require("../config/Enum");
const emitter = require("../lib/Emitter")
const name="notification"
emitter.addEmitter('notification');
router.get("/",async (req,res)=>{ //yayını ayağa kadıracağımız alan/sunucu
  
        res.writeHead(HTTP_CODES.OK, {
            "Content-Type": "text/event-stream",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache, no-transform"
        });

        const listener=(data)=>{ //on ve off metotlarında aynı fonksiyona müdahalede bulunuyoruz
            res.write("data:" + JSON.stringify(data) + "\n\n"); // gelen obje stringe çevriliyor sonra iki alt sarıta iniyoruz
        }

        emitter.getEmitter("notification").on("message",listener) // gelen yayınları dinliyoruz

        req.on("close",()=>{
             emitter.getEmitter("notification").off("message",listener)
        })
       
})

module.exports= router