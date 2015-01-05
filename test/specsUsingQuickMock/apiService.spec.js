(function () {

	describe('APIService', function () {
		var apiService;

		beforeEach(function(){
		    apiService = QuickMock({
				providerName: 'APIService',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks']
			});
		});

		describe('get method', function () {

			it('should defer to $http.get', function(){
			    apiService.get('/some-url');
				expect(apiService.$mocks.$http.get).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.get('/some-url');
				var httpArgs = apiService.$mocks.$http.get.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('put method', function () {

			it('should defer to $http.put', function(){
				apiService.put('/some-url');
				expect(apiService.$mocks.$http.put).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.put('/some-url');
				var httpArgs = apiService.$mocks.$http.put.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('post method', function () {

			it('should defer to $http.put', function(){
				apiService.post('/some-url');
				expect(apiService.$mocks.$http.post).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.post('/some-url');
				var httpArgs = apiService.$mocks.$http.post.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('delete method', function () {

			it('should defer to $http.put', function(){
				apiService.delete('/some-url');
				expect(apiService.$mocks.$http.delete).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.delete('/some-url');
				var httpArgs = apiService.$mocks.$http.delete.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

	});
	
})();