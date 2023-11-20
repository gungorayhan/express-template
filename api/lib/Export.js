const xlsx = require("node-xlsx")

class Export {
    constructor() {

    }

    /**
     * 
     * @param {Array} titles 
     * @param {Array} columns 
     * @param {Array} data 
     */
    toExcel(titles, columns, data = []) {
        let rows = [];

        /* örnek gösterimdeki gibi bir veri tasatımı elde etmiş olacağız
      [
          ["ID", "CATEGORY NAME", "IS ACTIVE"],
          ["asd", "name", true]
      ]
      */

        rows.push(titles);

        for (let i = 0; i < data.length; i++) {
            let item = data[i]
            let cols = []

            for (let j = 0; j < columns.length; j++) {
                cols.push(item[columns[j]])
            }
            rows.push(cols)
        }
console.log(rows)
        return xlsx.build([{ name: 'Sheet', data: rows }])
    }
}

module.exports = Export;