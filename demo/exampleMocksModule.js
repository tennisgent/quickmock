define([
	'modules/AtDocumentCentral/test/atmock'
], function(AtMock){

	return angular.module('DocumentRequestServiceSpecMocks', [])

		.mock('MockPromise', function(){
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

		.mock('StreamAPIService', [AtMock.MOCK_PREFIX + 'MockPromise', function(MockPromise) {
			var methods = ['get', 'edit', 'insert', 'remove', 'copy'],
				spyObj = jasmine.createSpyObj('StreamAPIService', methods);
			angular.forEach(methods, function(method){
				spyObj[method].mostRecentCall.$promise = new MockPromise();
				spyObj[method].andReturn({$promise: spyObj[method].mostRecentCall.$promise});
			});
			return spyObj;
		}])

		.factory(AtMock.MOCK_PREFIX + 'SpringControllerService', [AtMock.MOCK_PREFIX + 'MockPromise', function(MockPromise){
			var methods = ['get','post','put','action'],
				spyObj = jasmine.createSpyObj('SpringControllerService', methods);
			angular.forEach(methods, function(method){
				spyObj[method].mostRecentCall.$promise = new MockPromise();
				spyObj[method].andReturn(spyObj[method].mostRecentCall.$promise);
			});
			return spyObj;
		}])
	;

});