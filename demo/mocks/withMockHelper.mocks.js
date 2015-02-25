(function(){

	angular.module('QuickMockDemoMocks', [])

		.factory('MockPromise', function(){
			return function MockPromise(){
				var promise = this;
				angular.forEach(['then','catch','finally'], function(method){
					promise[method] = jasmine.createSpy('$promise.' + method);
					promise[method].callback = function(argument){
						promise[method].calls.mostRecent().args[0](argument);
					};
				});
			};
		})

		.factory('MockHttpPromise', ['MockPromise', function(MockPromise){
			function MockHttpPromise(){
				var promise = this;
				angular.forEach(['success','error'], function(method){
					promise[method] = jasmine.createSpy('$promise.' + method);
					promise[method].$callback = function(){
						promise[method].calls.mostRecent().args[0].apply(this, arguments);
					};
				});
			}
			MockHttpPromise.prototype = new MockPromise();
			return MockHttpPromise;
		}])

		.mockFactory('$http', ['MockHttpPromise', function(MockHttpPromise) {
			var methods = ['get', 'put', 'post', 'delete'],
				spyObj = jasmine.createSpyObj('$http', methods);
			angular.forEach(methods, function(method){
				spyObj[method].$promise = new MockHttpPromise();
				spyObj[method].and.returnValue(spyObj[method].$promise);
			});
			return spyObj;
		}])

		.mockFactory('$window', [function() {
			return jasmine.createSpyObj('$window', ['alert','confirm']);
		}])

		.mockFactory('$scope', ['$rootScope', function($rootScope){
			return $rootScope.$new();
		}])

		.mockService('APIService', ['___$http', function(mockHttp){
			return angular.copy(mockHttp);
		}])

		.mockService('UserFormValidator', [function(){
			var spy = jasmine.createSpy('UserFormValidator');
			spy.and.returnValue(true);
			return spy;
		}])

		.mockFactory('NotificationService', [function(){
			return jasmine.createSpyObj('NotificationService', ['error','success','warning','basic','confirm']);
		}])

		.mockFactory('$interval', ['$interval', function($interval){
			// ngMock already provides good mocking support for $interval
			// so just delegate to the actual implementation
			return $interval;
		}])

})();