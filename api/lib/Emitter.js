const {EventEmitter} =require("events");
var instance=null;
class Emitter{ //ortak yayın merkesi. iki ayrı nesne oluşturmaksızın aynı frekens içerisinde yayın yapmak için 
    constructor(){
        if(!instance){
            this.emitters={};
            instance=this;
        }

        return instance;
    }

    getEmitter(name){
        return this.emitters[name];
    }

    addEmitter(name){
        this.emitters[name] = new EventEmitter(name) // yeni bir nesne oluşturuyoruz ve sonrasında bulunması için isimlenidriyoruz 
        
        return this.emitters[name]
    }
}

module.exports=new Emitter();