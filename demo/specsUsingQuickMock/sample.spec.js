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
		var dummy;

		beforeEach(function(){
			dummy = quickmock({
				providerName: 'DummyFactory',
				moduleName: 'SampleModule',
				inject: function($httpBackend){
					console.log('httpBackend', $httpBackend);
				}
			});
		});

		describe('external api', function(){

			it('should have a get method', function(){
				expect(dummy.get).toEqual(jasmine.any(Function));
			});

		});

	});

})();