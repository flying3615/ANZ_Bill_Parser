/**
 * Created by liuyufei on 23/06/18.
 */
const XLSX = require('xlsx')
const SSF = require('ssf')

class Util {

	constructor(db){
		this.db = db
	}


	_dateFomater(date) {
		const result = SSF.format('yyyy-mm-dd', date)
		return result
	}


	dbErrorHandler(tx, err)  {
		console.error(err)
	}

	readExcelData(fileReader) {
		const data = new Uint8Array(fileReader.result);
		const arr = new Array();
		for (let k = 0; k != data.length; ++k) arr[k] = String.fromCharCode(data[k]);
		const bstr = arr.join("");

		const workbook = XLSX.read(bstr, {type: "binary"});

		const first_sheet_name = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[first_sheet_name];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, {raw: true})
		return jsonData
	}


	_getResultPromise(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.transaction(tx => {
				tx.executeSql(sql, params, (tx, res) => {
					console.log('sql = ', sql)
					console.log('db return rows ', res.rows)
					return resolve(Array.from(res.rows)), reject
				}, (tx, err) => {
					console.error('error sql ', sql)
					this.dbErrorHandler(tx, err)
				})
			})
		})
	}

}

module.exports = Util