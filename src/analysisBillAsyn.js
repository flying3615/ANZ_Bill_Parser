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
			finalCondition = monthCondition+' AND cast(amount AS DECIMAL) < 0';
			break
		case 'income':
			finalCondition = monthCondition+' AND cast(amount AS DECIMAL) > 0';
			break
		default:
			finalCondition = monthCondition;
			break
	}

	const sel = `SELECT sum(amount) AS cost, details, code FROM bill ${finalCondition} GROUP BY CASE WHEN (code is NULL or code like "1742%") THEN details ELSE code END`

	const result = await _getResultPromise(sel)
	return result
}