console.log('test');

describe('QuickMockDemoTests', function () {

	console.log('test');


	describe('APIService', function () {
		var apiService;

		beforeEach(function(){
		    apiService = QuickMock({
				providerName: 'APIService',
				moduleName: 'QuickMockDemo'
			});
		});


		it('should exists', function(){
			expect(apiService).toBeDefined();
		});

	});


});