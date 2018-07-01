/**
 * Created by liuyufei on 23/06/18.
 */


async function getSumAmountByMonth(minimun) {
	let sel = 'SELECT sum(amount) AS sumAmount, avg(balance) AS balance, strftime("%Y-%m","transaction_date") AS month FROM bill GROUP BY strftime("%Y-%m","transaction_date")'
	if (minimun) {
		sel = sel + ' having sumAmount >= ' + minimun
	}
	const result = await _getResultPromise(sel)
	return result

}

async function getCostAmountByMonth(minimun) {

	let sel = 'SELECT sum(amount) AS cost, strftime("%Y-%m","transaction_date") AS month FROM bill WHERE cast(amount AS DECIMAL) < 0 GROUP BY strftime("%Y-%m","transaction_date")'

	if (minimun) {
		sel = sel + ' having cost <= ' + (-minimun)
	}
	const result = await _getResultPromise(sel)
	return result

}

async function getIncomeAmountByMonth(minimun) {
	let sel = 'SELECT sum(amount) AS income, strftime("%Y-%m","transaction_date") AS month FROM bill WHERE cast(amount AS DECIMAL) > 0 GROUP BY strftime("%Y-%m","transaction_date")'
	if (minimun) {
		sel += ' having income >= ' + minimun
	}
	const result = await _getResultPromise(sel)
	return result
}

async function getDetailAmountByMonth(month, type = 'total') {

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

	const result = await _getResultPromise(sel)
	return result
}

async function getCostAmountByCodeOrDetails(month, type = 'total') {
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

	const result = await _getResultPromise(sel)
	return result
}

async function sortCodeFromDetails() {
	const updateSql = 'update bill set code = details where code is null or code like "1742%"'
	await _getResultPromise(updateSql)
}

async function getUniqCodeorDetails(month, type = 'cost') {
	const monthCondition = month ? ` WHERE strftime("%Y-%m","transaction_date") = "${month}"` : ""

	let finalCondition
	switch (type) {
		case 'cost':
			finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) < 0';
			break
		case 'income':
			finalCondition = monthCondition + ' AND cast(amount AS DECIMAL) > 0';
			break
	}
	const sel = `SELECT distinct code FROM bill ${finalCondition}`
	return await _getResultPromise(sel)
}

function insertCategory(category) {
	_getResultPromise('INSERT INTO category VALUES (?)', [category])
}

function removeCategory(category) {
	_getResultPromise(`DELETE FROM category WHERE name = "${category}"`)
}

function updateBillCategory(category, code) {
	_getResultPromise(`UPDATE bill SET category = ${category}  WHERE details = "${code}" or code = "${code}"`)
}

async function createBillTable(data) {
	const sheetCols = Object.keys(data[0]).map(k => String(k).replace(/[\s,\/]/g, '_')).join(',')
	const dropBillTable = 'DROP TABLE IF EXISTS bill'
	const dropCategoryTable = 'DROP TABLE IF EXISTS category'
	const createBillTable = `CREATE TABLE IF NOT EXISTS bill (${sheetCols},category)`
	const createCateTable = `CREATE TABLE IF NOT EXISTS category (name)`
	await _getResultPromise(dropBillTable)
	await _getResultPromise(dropCategoryTable)
	await _getResultPromise(createBillTable)
	await _getResultPromise(createCateTable)
	console.log('async after')

	await Promise.all(data.map(async (item) => {
		const values = Object.values(item).map((v, index) => {
			if (v) {
				//first two columns are 'transaction date' & 'processed date'
				return index <= 1 ? `"${_dateFomater(v)}"` : `"${v}"`
			} else {
				return 'null'
			}
		}).join(',')

		const insertSQL = `INSERT INTO bill (${sheetCols}, category) VALUES (${values}, "null")`

		return await _getResultPromise(insertSQL)
	}))

}