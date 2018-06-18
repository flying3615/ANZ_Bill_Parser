/**
 * Created by liuyufei on 17/06/18.
 */

// const fs = require('fs')
// const _ = require('lodash')
// const xlsxtojson = require("xlsx-to-json-lc");

class Main {

	constructor(data) {
		this.read()
		this.cache = []
		this.data = data
	}

	read() {
		// xlsxtojson({
		// 	input: '../01-0071-0547214-01_Transactions_2017-09-01_2018-06-17.xlsx', //the same path where we uploaded our file
		// 	output: null, //since we don't need output.json
		// 	lowerCaseHeaders: true
		// }, (err, result) => {
		// 	if (err) {
		// 		throw err
		// 	}

			const totalSummary = this.totalSummary(this.data)

			const groupByDetails = this.profitDeficitGroup(this.data, 'details')
			const monthSummary = this.profitDeficitGroup(this.data, 'transaction date', 'month')

			console.log('income ' + JSON.stringify(groupByDetails[0]))
			console.log('cost ' + JSON.stringify(groupByDetails[1]))

			console.log('month profit ' + JSON.stringify(monthSummary[0]))
			console.log('month deficit ' + JSON.stringify(monthSummary[1]))
		// });
	}

	totalSummary(data) {
		const totalSummary = data.reduce((total, item) => {
			var number = Number(item.amount.replace(/[^0-9\.-]+/g, ""));
			if (!item.amount.includes('-')) {
				// console.log(item['transaction date'] + ' ' + number)
				total.income += number
			} else {
				total.cost += number
			}
			return total
		}, {cost: 0, income: 0})

		return totalSummary
	}

	profitDeficitGroup(data, field, unit) {

		const groupedData = this.groupDataDetail(data, field, unit)

		const mixedGroup = Object.keys(groupedData).reduce((all, aggItemKey) => {
			return [
				...all,
				{
					[aggItemKey]: groupedData[aggItemKey].reduce((total, i) => {
						total += Number(i.amount.replace(/[^0-9\.-]+/g, ""));
						return total
					}, 0).toFixed(2)
				}
			]
		}, [])

		return _.partition(mixedGroup, (groupItem) => {
			return Number(Object.values(groupItem)[0]) > 0
		})
	}

	groupDataDetail(data, field, unit) {

		const groupData =  unit ? _.groupBy(data, item => item[field].length != 0 && this.dateBy(item[field], unit)) :
			_.groupBy(data, item => item[field].length != 0 && item[field])

		//cache result...
		_.merge(this.cache, groupData)

		return groupData
	}

	dateBy(date, unit) {
		const pattern = /(\d+) ([a-zA-z]{3}) (\d+)/
		const matchResult = date.match(pattern)

		if (matchResult) {
			switch (unit) {
				case 'day':
					return `${matchResult[1]} ${matchResult[2]} ${matchResult[3]}`
				case 'month':
					return `${matchResult[2]} ${matchResult[3]}`
				case 'year':
					return `${matchResult[3]}`
				default:
					return date
			}
		} else {
			return date
		}
	}
}

