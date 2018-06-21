function totalSummaryFn(data) {
	const totalSummary = data.reduce((total, item) => {
		if (item.Amount > 0) {
			// console.log(item['transaction date'] + ' ' + number)
			total.income += item.Amount
		} else {
			total.cost += item.Amount
		}
		return total
	}, {cost: 0, income: 0})

	return totalSummary
}

function totalAmountByMonth(data){
	console.log(groupDataDetail(data,'Transaction Date','month'))
}

function profitDeficitGroup(data, field, minumAmount, unit) {

	const groupedData = groupDataDetail(data, field, unit)

	const mixedGroup = Object.keys(groupedData).reduce((all, aggItemKey) => {

		const totalItemAmount = groupedData[aggItemKey].reduce((total, i) => {
			total += i['Amount'];
			return total
		}, 0).toFixed(2)

		return [
			...all,
			{
				[aggItemKey]: Math.abs(Number(totalItemAmount)) > minumAmount ? totalItemAmount : undefined
			}
		]
	}, [])

	return _.partition(mixedGroup, (groupItem) => {
		return Number(Object.values(groupItem)[0]) > 0
	})
}

function groupDataDetail(data, field, unit) {

	const groupData = unit ? _.groupBy(data, item => item[field].length != 0 && dateBy(item[field], unit)) :
		_.groupBy(data, item => item[field].length != 0 && item[field])

	return groupData
}

function dateBy(date, unit) {
	const pattern = /(\d+)\/(\d+)\/(\d+)/
	const formatedDate = SSF.format('dd/mm/yyyy', date)
	const matchResult = formatedDate.match(pattern)

	if (matchResult) {
		switch (unit) {
			case 'day':
				return `${matchResult[1]}/${matchResult[2]}/${matchResult[3]}`
			case 'month':
				return `${matchResult[2]}/${matchResult[3]}`
			case 'year':
				return `${matchResult[3]}`
			default:
				return date
		}
	} else {
		return date
	}
}