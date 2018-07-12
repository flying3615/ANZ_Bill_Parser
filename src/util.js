/**
 * Created by liuyufei on 23/06/18.
 */

function _dateFomater(date) {
	const result = SSF.format('yyyy-mm-dd', date)
	return result
}


const dbErrorHandler = (tx, err) => {
	console.error(err)
}

function readExcelData(fileReader) {
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


function _getResultPromise(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.transaction(tx => {
			tx.executeSql(sql, params, (tx, res) => {
				console.log('sql = ', sql)
				console.log('db return rows ', res.rows)
				return resolve(Array.from(res.rows)), reject
			}, (tx, err) => {
				console.error('error sql ', sql)
				dbErrorHandler(tx, err)
			})
		})
	})
}

function addCategoryColumn(tableRows, category) {
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

			_addCategoryInputListener(input)

			getCodeByCategory(category, code).then(data => {
				if (data[0].num > 0) {
					input.checked = true
				}
				td.appendChild(input)
				tr.appendChild(td)
			})

		}
	})
}

function createCategoryLi(ul, category) {
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

function _addCategoryInputListener(inputEle){
	inputEle.addEventListener('click', (e) => {
		if (e.target.checked) {
			// console.log('----checked category------')
			// console.log(e.target.dataset.category)
			// console.log(e.target.dataset.code)

			const duplChecked = Array.from(inputEle.closest('tr').childNodes)
					.filter(ele => {
						const otherInput = ele.querySelector('input')||{}
						return otherInput !== inputEle && otherInput.checked
					}).length > 0

			if(duplChecked) {
				alert('only can associate one category to one code')
				//do uncheck
				e.target.checked = false
				return
			}
			updateBillCategory(e.target.dataset.category, e.target.dataset.code)
		} else {
			// console.log('----unchecked category------')
			// console.log(e.target.dataset.category)
			// console.log(e.target.dataset.code)
			updateBillCategory(null, e.target.dataset.code)
		}

	})
}
