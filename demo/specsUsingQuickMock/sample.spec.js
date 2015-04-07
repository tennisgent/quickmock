(function(){

	angular.module('SampleModule', [])
		.factory('DummyFactory', function($http, $timeout){
			return {
				get: function get(){},
				set: function set(){}
			};
		})
		.mockFactory('$http', function($http){
			return $http;
		})
		.mockFactory('$timeout', function($timeout){
			return $timeout;
		});

	describe('DummyFactory', function() {
		var dummy, httpBackend;

		beforeEach(function(){
			dummy = quickmock({
				providerName: 'DummyFactory',
				moduleName: 'SampleModule',
				inject: function($httpBackend){
					// This allows you to inject other services that you might want access
					// to but that your service doesn't depend on directly
					httpBackend = $httpBackend;
				}
			});
		});

		describe('external api', function(){

			it('should have a get method', function(){
				expect(dummy.get).toEqual(jasmine.any(Function));
			});

			it('should inject $httpBackend', function(){
				expect(httpBackend.expect).toEqual(jasmine.any(Function));
			});

			// Assume $httpBackend was used somewhere down in further tests

		});

	});

})();