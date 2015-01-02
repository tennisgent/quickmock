(function(){

	angular.module('QuickMockDemoMocks', [])

		.factory('MockPromise', function(){
			return function MockPromise(){
				var promise = this;
				angular.forEach(['then','catch','finally'], function(method){
					promise[method] = jasmine.createSpy('$promise.' + method);
					promise[method].callback = function(argument){
						promise[method].mostRecentCall.args[0](argument);
					};
				});
			};
		})

		.factory('MockHttpPromise', ['MockPromise', function(MockPromise){
			function MockHttpPromise(){
				var promise = this;
				angular.forEach(['success','error'], function(method){
					promise[method] = jasmine.createSpy('$promise.' + method);
					promise[method].callback = function(argument){
						promise[method].mostRecentCall.args[0](argument);
					};
				});
			}
			MockHttpPromise.prototype = MockPromise;
			return MockHttpPromise;
		}])

		.factory('___$http', ['MockHttpPromise', function(MockHttpPromise) {
			var methods = ['get', 'put', 'post', 'delete'],
				spyObj = jasmine.createSpyObj('$http', methods);
			angular.forEach(methods, function(method){
				spyObj[method].calls.mostRecentPromise = new MockHttpPromise();
				spyObj[method].and.returnValue({$promise: spyObj[method].calls.mostRecentPromise});
			});
			return spyObj;
		}])

})();