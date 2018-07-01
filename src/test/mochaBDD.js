describe("pow", function() {

	describe("raises x to power n", function() {


		// before(() => alert("Testing started – before all tests"));
		// after(() => alert("Testing finished – after all tests"));
		//
		// beforeEach(() => alert("Before a test – enter a test"));
		// afterEach(() => alert("After a test – exit a test"));

		function makeTest(x) {
			let expected = x * x * x;
			it(`${x} in the power 3 is ${expected}`, function() {
				assert.equal(pow(x, 3), expected);
			});
		}

		for (let x = 1; x <= 5; x++) {
			makeTest(x);
		}

	});

	// ... more tests to follow here, both describe and it can be added
});