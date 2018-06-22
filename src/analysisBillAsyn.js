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

async function getCostAmountByCode(minimun = 0) {
	let sel = 'SELECT sum(amount) AS cost, details, code FROM bill WHERE cast(amount AS DECIMAL) < 0 GROUP BY code'
	if (minimun) {
		sel += ' having cost <= ' + (-minimun)
	}
	const result = await _getResultPromise(sel)
	return result
}