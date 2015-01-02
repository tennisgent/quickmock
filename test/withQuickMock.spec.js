describe('QuickMockDemoTests', function () {

	describe('APIService', function () {
		var apiService;

		beforeEach(function(){
		    apiService = QuickMock({
				providerName: 'APIService',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks']
			});
		});


		it('should exists', function(){
			expect(apiService.get).toBeDefined();
		});

	});


});