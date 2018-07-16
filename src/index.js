/**
 * Created by liuyufei on 13/07/18.
 */

const Analyser = require('./analysisBillAsyn')
const Util = require('./util')
const echarts = require('echarts')

window.onload = function () {

	//get HTML elements
	const moneySlider = document.querySelector('#myRange')
	const scaleMoney = document.querySelector('#scaleMoney')
	const detailTable = document.querySelector('#detailTable')
	const fileInputBtn = document.querySelector('#files')
	const resetBtn = document.querySelector('#resetBtn')
	const portionCard = document.querySelector('#portionCard')
	const costDetailsCard = document.querySelector('#costDetailsCard')
	const addCategoryBtn = document.querySelector('#addCategoryBtn')
	const pieCardTitle = document.querySelector('#pieCardTitle')
	const tableCardTitle = document.querySelector('#tableCardTitle')
	const dynamicCategoryTable = document.querySelector('#dynamicTable')
	const categoryUL = document.querySelector('#costCategory');

  // init 3 charts
	const totalSummChart = echarts.init(document.querySelector('#totalSumm'))
	const detailsChart = echarts.init(document.querySelector('#pieDetail'))
	const custDetailChart = echarts.init(document.querySelector('#custPieDetail'))

	// init DB & handlers
	const db = openDatabase('bill_db', '1.0', 'bill web db', 3 * 1024 * 1024);
	const util = new Util(db)
	const analysis = new Analyser(util)

	//category adding handler
	addCategoryBtn.addEventListener('click', () => {
		const category = document.querySelector('#category').value
		analysis.insertCategory(category)

		analysis.addCategoryColumn(Array.from(document.querySelectorAll('#dynamicTable tr')), category)

		analysis.createCategoryLi(categoryUL, category)

	})


	//Eventbust get category update
	//render another customize pie chart
	eventBus.subscribe('categoryUpdate', () => {
		//show custDetialChart
		document.querySelector('#custPieDetail').style.display = 'block'
		analysis.getDetailByCustomCategory(currentDate, moneyType).then((resultSet) => {

			const seriesData = resultSet.map(r => {
				return {
					value: Math.abs(r.cost).toFixed(2),
					name: r.category == 'null' ? 'Others' : r.category
				}
			})

			const legendData = resultSet.map(r => r.category == 'null' ? 'Others' : r.category)

			const option = {
				tooltip: {
					trigger: 'item',
					formatter: "{a} <br/>{b}: {c} ({d}%)"
				},
				legend: {
					orient: 'vertical',
					x: 'left',
					data: legendData
				},
				series: [
					{
						name: 'Source',
						type: 'pie',
						radius: ['50%', '70%'],
						avoidLabelOverlap: false,
						label: {
							normal: {
								show: false,
								position: 'center'
							},
							emphasis: {
								show: true,
								textStyle: {
									fontSize: '30',
									fontWeight: 'bold'
								}
							}
						},
						labelLine: {
							normal: {
								show: false
							}
						},
						data: seriesData
					}
				]
			};
			custDetailChart.setOption(option)
		})

	})

	eventBus.subscribe('rmCategory', (c)=>{
		analysis.removeCategory(c)
	})


	moneySlider.addEventListener('input', () => {
		scaleMoney.innerHTML = moneySlider.value
		const minimum = moneySlider.value
		// limit the minimum cost
		renderTotalChart(minimum)
		//TODO constrain portion & table too??
	})

	function resetTotal() {
		renderTotalChart()
	}

	function renderTotalChart(minimum) {

		Promise.all([
			analysis.getSumAmountByMonth(minimum),
			analysis.getCostAmountByMonth(minimum),
			analysis.getIncomeAmountByMonth(minimum)
		]).then(values => {
			const total = values[0]
			const cost = values[1]
			const income = values[2]
			//suppose every month spent money
			const xAxisMonths = cost.map(r => r.month)

			const amountData = total.map(v => Number(v.sumAmount.toFixed(0)))
			const balanceData = total.map(v => Number(v.balance.toFixed(0)))
			const costData = cost.map(v => Number((-v.cost).toFixed(0)))
			const incomeData = income.map(v => Number(v.income.toFixed(0)))

			const option = {
				title: {
					text: 'Bill'
				},
				tooltip: {
					trigger: 'axis'
				},
				legend: {
					data: ['profit', 'balance', 'cost', 'income']
				},
				toolbox: {
					show: true,
					feature: {
						dataZoom: {
							yAxisIndex: 'none'
						},
						dataView: {readOnly: false},
						magicType: {type: ['line', 'bar']},
						restore: {},
						saveAsImage: {}
					}
				},
				xAxis: {
					type: 'category',
					boundaryGap: false,
					data: xAxisMonths
				},
				yAxis: {
					type: 'value',
					axisLabel: {
						formatter: '$ {value}'
					}
				},
				series: [
					{
						name: 'profit', type: 'line', data: amountData,
						markPoint: {
							data: [
								{type: 'max', name: '最大值'},
								{type: 'min', name: '最小值'}
							]
						},
						markLine: {
							data: [
								{type: 'average', name: '平均值'}
							]
						}
					},
					{
						name: 'balance', type: 'line', data: balanceData,
						markPoint: {
							data: [
								{type: 'max', name: '最大值'},
								{type: 'min', name: '最小值'}
							]
						}
					},
					{
						name: 'cost', type: 'line', data: costData,
						markPoint: {
							data: [
								{type: 'max', name: '最大值'},
								{type: 'min', name: '最小值'}
							]
						},
						markLine: {
							data: [
								{type: 'average', name: '平均值'}
							]
						}
					},
					{
						name: 'income', type: 'line', data: incomeData,
						markPoint: {
							data: [
								{type: 'max', name: '最大值'},
								{type: 'min', name: '最小值'}
							]
						},
						markLine: {
							data: [
								{type: 'average', name: '平均值'}
							]
						}
					}
				]
			};
			totalSummChart.setOption(option)
			//show chart
			document.querySelector('#totalCard').style.display = 'block'
		})

	}


	function handleFileSelect(evt) {
		const files = evt.target.files
		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			const fileReader = new FileReader()
			fileReader.readAsArrayBuffer(file)
			fileReader.onload = e => {
				const jsonData = util.readExcelData(fileReader)
				analysis.createBillTable(jsonData)
					.then(() => analysis.sortCodeFromDetails())
					.then(() => renderTotalChart())
					.catch(e => console.error(e))
			}
		}
	}

	fileInputBtn.addEventListener('change', handleFileSelect)

	resetBtn.addEventListener('click', resetTotal)

	//handle month click
	totalSummChart.on('click', params => {

		//globe variable
		currentDate = params.name
		moneyType = params.seriesName

		//show pie chart
		portionCard.style.display = 'block'
		//show cost details table
		costDetailsCard.style.display = 'block'

		//clean work
		detailTable.innerHTML = ''
		categoryUL.innerHTML = ''

		const headerRow = detailTable.insertRow()
		headerRow.insertCell(0).innerText = 'Date'
		headerRow.insertCell(1).innerText = 'Amount'
		headerRow.insertCell(2).innerText = 'Balance'
		headerRow.insertCell(3).innerText = 'Details'
		headerRow.insertCell(4).innerText = 'Code'
		//get detail by month...

		analysis.getDetailAmountByMonth(params.name, params.seriesName).then(resultSet => {
			resultSet.forEach(record => {
				const row = detailTable.insertRow()
				row.insertCell(0).innerText = record['Transaction_Date']
				row.insertCell(1).innerText = record['Amount']
				row.insertCell(2).innerText = record['Balance']
				row.insertCell(3).innerText = record['Details']
				row.insertCell(4).innerText = record['Code']
			})

		})

		//dynamic table insert code column
		dynamicCategoryTable.innerText = ''
		const headerR = dynamicCategoryTable.insertRow()
		headerR.insertCell(0).innerText = 'Code'
		analysis.getUniqCodeorDetails(params.name, params.seriesName).then(resultSet => {
			uniqCodes = resultSet.map(r => r.Code)
			uniqCodes.forEach(code => {
				const row = dynamicCategoryTable.insertRow()
				row.insertCell(0).innerText = code || 'Unknown'
			})
		})

		analysis.getCategories().then(cats => {
			cats.forEach(c => {
				//init dynamic table
				analysis.addCategoryColumn(Array.from(document.querySelectorAll('#dynamicTable tr')), c.name)
				//init category ul
				analysis.createCategoryLi(categoryUL, c.name)
			})
		})

		//when date changed, also update custom pie chart
		eventBus.post('categoryUpdate')

		analysis.getCostAmountByCodeOrDetails(params.name, params.seriesName).then(resultSet => {
			if (!['cost', 'income'].includes(params.seriesName)) {
				// hide pie and table
				portionCard.style.display = 'none'
				costDetailsCard.style.display = 'none'
				return
			}

			pieCardTitle.innerText = `${params.name} ${params.seriesName} portion`
			tableCardTitle.innerText = `${params.name} ${params.seriesName} details`
			const seriesData = resultSet.map(r => {
				return {
					value: Math.abs(r.cost),
					//1742 C???
					name: ((r.Code && !r.Code.includes('1742')) ? r.Code : r.Details || 'Unknown')
				}
			})

			const legendData = resultSet.map(r => (r.Code && !r.Code.includes('1742')) ? r.Code : r.Details || 'Unknown')

			const option = {
				title: {
					text: `${params.seriesName} Summary`,
					x: 'center'
				},
				tooltip: {
					trigger: 'item',
					formatter: "{a} <br/>{b} : {c} ({d}%)"
				},
				legend: {
					orient: 'vertical',
					left: 'left',
					data: legendData
				},
				toolbox: {
					show: true,
					feature: {
						mark: {show: true},
						dataView: {show: true, readOnly: false},
						magicType: {
							show: true,
							type: ['pie', 'funnel']
						},
						restore: {show: true},
						saveAsImage: {show: true}
					}
				},
				series: [
					{
						name: 'Amount',
						type: 'pie',
						radius: '55%',
						center: ['50%', '60%'],
						data: seriesData
					}
				]
			};

			detailsChart.setOption(option)

		})

	})

}