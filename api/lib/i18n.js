const i18n = require("../i18n")

class I18n {
    constructor(lang){
        this.lang=lang
    }

    translate(text,lang=this.lang,params=[]){
        let arr = text.split(".");// COMMON.VALIDATION_ERROR_TITLE => ['COMMON','VALIDATION_ERROR_TITLE']
        let val=i18n[lang][arr[0]]; //i18n["EN"]["COMMON"];

        for (let i =1;i<arr.length;i++){
            val=val[arr[i]]// i=1 için val["VALIDATION_ERROR"]
        }

        val= val + ""; // dil datamızdaki değişikliğin önüne geçmiş oluyoruz. val dil dosyasındaki alanın karşılıyordu bu sebeple aradaki bağlantıyı bzomuş olduk

        for (let i=0;i<params.length;i++){
            val= val.replace("{}",params[i])
        }

        return val || "";
    }
}


module.exports=I18n;