(function () {

	describe('APIService', function () {
		var apiService, httpMock;

		beforeEach(function(){
		    module('QuickMockDemo');
		    module(function($provide){
				httpMock = jasmine.createSpyObj('$http', ['get','put','post','delete']);
				$provide.value('$http', httpMock);
			});
			inject(function(APIService){
				apiService = APIService;
			});
		});

		describe('get method', function () {

			it('should defer to $http.get', function(){
			    apiService.get('/some-url');
				expect(httpMock.get).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.get('/some-url');
				var httpArgs = httpMock.get.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('put method', function () {

			it('should defer to $http.put', function(){
				apiService.put('/some-url');
				expect(httpMock.put).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.put('/some-url');
				var httpArgs = httpMock.put.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('post method', function () {

			it('should defer to $http.put', function(){
				apiService.post('/some-url');
				expect(httpMock.post).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.post('/some-url');
				var httpArgs = httpMock.post.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

		describe('delete method', function () {

			it('should defer to $http.put', function(){
				apiService.delete('/some-url');
				expect(httpMock.delete).toHaveBeenCalled();
			});

			it('should prepend the proper url', function(){
				apiService.delete('/some-url');
				var httpArgs = httpMock.delete.calls.argsFor(0);
				expect(httpArgs[0]).toContain('/some-url');
				expect(httpArgs[0]).not.toEqual('/some-url');
			});

		});

	});
	
})();