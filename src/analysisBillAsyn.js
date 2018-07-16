/**
 * Created by liuyufei on 23/06/18.
 */

class Analyser {

	constructor(util){
		this.util = util
	}


	getSumAmountByMonth(minimun) {
		let sel = 'SELECT sum(amount) AS sumAmount, avg(balance) AS balance, strftime("%Y-%m","transaction_date") AS month FROM bill GROUP BY strftime("%Y-%m","transaction_date")'
		if (minimun) {
			sel = sel + ' having sumAmount >= ' + minimun
		}

		return this.util._getResultPromise(sel)

	}


	getCostAmountByMonth(minimun) {

		let sel = 'SELECT sum(amount) AS cost, strftime("%Y-%m","transaction_date") AS month FROM bill WHERE cast(amount AS DECIMAL) < 0 GROUP BY strftime("%Y-%m","transaction_date")'

		if (minimun) {
			sel = sel + ' having cost <= ' + (-minimun)
		}

		return this.util._getResultPromise(sel)

	}


	getIncomeAmountByMonth(minimun) {
		let sel = 'SELECT sum(amount) AS income, strftime("%Y-%m","transaction_date") AS month FROM bill WHERE cast(amount AS DECIMAL) > 0 GROUP BY strftime("%Y-%m","transaction_date")'
		if (minimun) {
			sel += ' having income >= ' + minimun
		}
		return this.util._getResultPromise(sel)
	}


	getDetailAmountByMonth(month, type = 'total') {

		let typeCondition
		switch (type) {
			case 'cost':
				typeCondition = ' AND cast(amount AS DECIMAL) < 0';
				break
			case 'income':
				typeCondition = ' AND cast(amount AS DECIMAL) > 0';
				break
			default:
				typeCondition = '';
				break
		}

		let sel = `SELECT * FROM bill WHERE strftime("%Y-%m","transaction_date") = "${month}" ${typeCondition} ORDER BY amount`

		return this.util._getResultPromise(sel)
	}

	getCostAmountByCodeOrDetails(month, type = 'total') {
		const monthCondition = month ? ` WHERE strftime("%Y-%m","transaction_date") = "${month}"` : ""

		let finalCondition
		switch (type) {
			case 'cost':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) < 0';
				break
			case 'income':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) > 0';
				break
			default:
				finalCondition = monthCondition;
				break
		}

		const sel = `SELECT sum(amount) AS cost, details, code FROM bill ${finalCondition} GROUP BY CASE WHEN (code is NULL or code like "1742%") THEN details ELSE code END`

		return 	this.util._getResultPromise(sel)

	}


	sortCodeFromDetails() {
		const updateSql = 'update bill set code = details where code is null or code like "1742%"'
		this.util._getResultPromise(updateSql)
	}


	getUniqCodeorDetails(month, type = 'cost') {
		const monthCondition = month ? ` WHERE strftime("%Y-%m","transaction_date") = "${month}"` : ""

		let finalCondition = ''
		switch (type) {
			case 'cost':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) < 0';
				break
			case 'income':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) > 0';
				break
		}
		const sel = `SELECT distinct code FROM bill ${finalCondition} order by code`
		return this.util._getResultPromise(sel)
	}


	getCategories() {
		const querySQL = `SELECT name from category`
		return this.util._getResultPromise(querySQL)
	}


	insertCategory(category) {
		this.util._getResultPromise('INSERT INTO category VALUES (?)', [category])
	}

	removeCategory(category) {

		this.util._getResultPromise(`UPDATE bill SET category = "null" WHERE category = "${category}"`)
		this.util._getResultPromise(`DELETE FROM category WHERE name = "${category}"`)
			.then(() => {
				//eventbust fire event
				eventBus.post('categoryUpdate')
			})
	}


	updateBillCategory(category, code, forAllCode) {

		let limitDate = ''
		if(forAllCode){
			limitDate = ` strftime("%Y-%m","transaction_date") = "${currentDate}" and `
		}

		// read currentDate from global
		this.util._getResultPromise(`UPDATE bill SET category = "${category}" WHERE ${limitDate} (details like "%${code}%" or code like "%${code}%")`)
			.then(() => {
				//eventbust fire event
				eventBus.post('categoryUpdate')
			})
	}

	getDetailByCustomCategory(month, type = 'total') {

		const monthCondition = month ? ` WHERE strftime("%Y-%m","transaction_date") = "${month}"` : ""

		let finalCondition
		switch (type) {
			case 'cost':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) < 0';
				break
			case 'income':
				finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) > 0';
				break
			default:
				finalCondition = monthCondition;
				break
		}

		const sel = `SELECT sum(amount) AS cost, category FROM bill ${finalCondition} GROUP BY category`

		return this.util._getResultPromise(sel)
	}

	getCodeByCategory(category, code) {
		const querySQL = `SELECT count(1) as num FROM bill WHERE (details like "%${code}%" or code like "%${code}%") and category = "${category}" and strftime("%Y-%m","transaction_date") = "${currentDate}"`
		return this.util._getResultPromise(querySQL)
	}


	createBillTable(data) {
		const sheetCols = Object.keys(data[0]).map(k => String(k).replace(/[\s,\/]/g, '_')).join(',')
		const dropBillTable = 'DROP TABLE IF EXISTS bill'
		const dropCategoryTable = 'DROP TABLE IF EXISTS category'
		const createBillTable = `CREATE TABLE IF NOT EXISTS bill (${sheetCols},category)`
		const createCateTable = `CREATE TABLE IF NOT EXISTS category (name)`
		this.util._getResultPromise(dropBillTable)
		this.util._getResultPromise(dropCategoryTable)
		this.util._getResultPromise(createBillTable)
		this.util._getResultPromise(createCateTable)

		return Promise.all(data.map(async (item) => {
			const values = Object.values(item).map((v, index) => {
				if (v) {
					//first two columns are 'transaction date' & 'processed date'
					return index <= 1 ? `"${this.util._dateFomater(v)}"` : `"${v}"`
				} else {
					return 'null'
				}
			}).join(',')

			const insertSQL = `INSERT INTO bill (${sheetCols}, category) VALUES (${values}, "null")`

			return this.util._getResultPromise(insertSQL)
		}))
	}

	addCategoryColumn(tableRows, category) {
		tableRows.forEach((tr, index) => {
			if (index === 0) {
				const th = document.createElement('th')
				th.className = category
				th.innerText = category
				tr.appendChild(th)
			} else {
				const td = document.createElement('td')
				td.className = category
				const input = document.createElement('input')
				//handle onclick action...
				input.dataset.category = category
				const code = tr.firstChild.innerText
				input.dataset.code = code
				//check db if checkbox should be checked
				input.type = 'checkbox'

				this._addCategoryInputListener(input)

				//make the code checked with exsiting category
				this.getCodeByCategory(category, code).then(data => {
					if (data[0].num > 0) {
						input.checked = true
					}
					td.appendChild(input)
					tr.appendChild(td)
				})

			}
		})
	}

	_addCategoryInputListener(inputEle) {
		inputEle.addEventListener('click', (e) => {
			if (e.target.checked) {
				const duplChecked = Array.from(inputEle.closest('tr').childNodes)
						.filter(ele => {
							const otherInput = ele.querySelector('input') || {}
							return otherInput !== inputEle && otherInput.checked
						}).length > 0

				if (duplChecked) {
					alert('Only can associate one category to one code')
					//do uncheck
					e.target.checked = false
					return
				}

				if(e.target.dataset.code=='Unknown'){
					alert('Unknown cannot associate any category')
					e.target.checked = false
					return
				}
				this.updateBillCategory(e.target.dataset.category, e.target.dataset.code)
			} else {
				this.updateBillCategory(null, e.target.dataset.code)
			}

		})
	}

	createCategoryLi(ul, category) {
		ul.innerHTML += `
				<li onclick="(()=>{
					removeCategory(this.innerText)
					document.querySelector('#costCategory').removeChild(this)
					Array.from(document.getElementsByClassName(this.innerText))
						.forEach(node=>node.parentElement.removeChild(node))
				})()">
					<span class="badge badge-pill badge-info">${category}</span>
				</li>
			`
	}

}

module.exports = Analyser