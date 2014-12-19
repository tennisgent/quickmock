QuickMock
======

QuickMock is a micro-library for initializing, mocking and auto-injecting provider dependencies for Jasmine unit tests


How Do I Use It?
----------------

Mocking out dependencies in unit tests can be a huge pain. Angular makes testing "easy", but mocking out EVERY dependecy isn't so slick. If you've ever written an Angular unit test, you've probably seen a ton of beforeEach boilerplate that looks something like this:

```javascript
describe('DocumentRequestService', function(){
	var mockModule, documentRequestService, $httpBackend, mockTileConfig;

	mockTileConfig = function(){
		return {
			dcObjCode: 'MOCK',
			dcObjID: '123123123'
		};
	};

	beforeEach(function () {
		mockModule = angular.module("mockModule", ['attask', "attask.i18n", 'ngSanitize']);
		mockModule.factory('StreamAPIService', [function() {
			return jasmine.createSpyObj('StreamAPIService', ['get', 'edit', 'insert', 'remove', 'copy']);
		}]);
		mockModule.factory('SpringControllerService', [function(){
			return jasmine.createSpyObj('SpringControllerService', ['get','post','put','action']);
		}]);
		module('mockModule');
		module('documentCentral.services.DocumentRequestService');
		module(function($provide){
			$provide.factory('tileConfig', mockTileConfig);
		});
	});

	beforeEach(inject(function (DocumentRequestService, _$httpBackend_) {
		documentRequestService = DocumentRequestService;
		$httpBackend = _$httpBackend_;
	}));

	// ... write actual test cases here
});
```

That's a lot of work. There are a number of things that have to happen here. A mock `tileConfig` has to be declared and initalized.  A `beforeEach` block has to initialize a `mockModule`, which contains mock services for 2 of the service's dependencies. Then it must initialize the module in which our given service resides. Then it must grab Angular's `$provide` object to supply the mocked `tileConfig` object to the service.  The next `beforeEach` block then injects the actual service, and injects `$httpBackend` so that API calls can be verified. Then FINALLY, you can start writing tests.  And this is a very simple example. A lot of tests are much more complicated.

What if it was a lot easier?  How about if we could reduce all of that down to this?

```javascript
describe('DocumentRequestService', function(){
	var docRequestService;

		beforeEach(function(){
			docRequestService = QuickMock({
				providerName: 'DocumentRequestService',
				moduleName: 'documentCentral.services.DocumentRequestService',
				mockModules: ['DocumentRequestServiceMocks'],
				overrideMocks: {
					tileConfig: {
						dcObjCode: 'MOCK',
						dcObjID: '123123123'
					}
				}
			});
		});

	// ... write actual test cases here
});
```

How Does It Work?
-----------------

QuickMock does all of that `beforeEach` boilerplate behind the scenes, and returns an object that contains all of the data you need to write your tests. Let's use the example above and write some tests using the `docRequestService` object. The following example will test the `DocumentRequestService.cancelRequest()` method:

```javascript
describe('cancelRequest', function () {
	var fakeRequest, streamAPIService;  // references to important local variables

	beforeEach(function(){
		docRequestService.requests = [{ID: 1}, {ID: 2}]; // some fake data for the purpose of testing our service
	    fakeRequest = {ID: 1}; // a fake example request that we'd like to cancel

	    // QuickMock returns each service with a special $mocks variable that contains references to all of the mocked dependencies
		streamAPIService = docRequestService.$mocks.StreamAPIService;
	});

	it('should cancel the request through the API', function(){
	    docRequestService.cancelRequest(fakeRequest);
		expect(streamAPIService.edit).toHaveBeenCalled();
		expect(streamAPIService.edit.mostRecentCall.args[0].ID).toEqual(fakeRequest.ID);
	});
	
	it('should remove the canceled request from the current list', function(){
		docRequestService.cancelRequest(fakeRequest);
		streamAPIService.edit.mostRecentCall.$promise.then.callback();

		// NOTE: All of the methods on our docRequestService object have also automatically been spied on,
		//   so we can call all of the spy methods on them as well, as in this example
		expect(docRequestService._removeRequest).toHaveBeenCalledWith(fakeRequest);
	});
});
```

To learn how all this is being done, please check out the source code for `quickmock.js`. Its a very simple service.  I have also included a full example of how QuickMock can be used to test the entire `DocumentRequestService` factory.  The example can be found in the `demo` folder.