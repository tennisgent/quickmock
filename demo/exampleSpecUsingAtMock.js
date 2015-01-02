define([
	'angular',
	'modules/AtDocumentCentral/test/atmock',
	'modules/AtDocumentCentral/src/services/DocumentRequestService',
	'modules/AtDocumentCentral/test/services/DocumentRequestServiceSpecMocks'
], function(angular, AtMock, DocumentRequestService, DocumentRequestServiceMocks){

	describe('DocumentRequestService', function () {
		var docRequestService;

		beforeEach(function(){
			docRequestService = AtMock({
				providerName: 'AtDirective',
				moduleName: DocumentRequestService.name,
				mockModules: [DocumentRequestServiceMocks.name],
				mockTemplate: '<at-directive></at-directive>',
				//overrideMocks: {
				//	// any dependencies whose mocks you would like to override
				//	tileConfig: {}, 								// AtMock will use this object as the mock for tileConfig
				//	DocumentRequestDialogIDs: AtMock.USE_ACTUAL,	// AtMock will use the actual implementation of the DocumentRequestDiaglogIDs, rather than a mock
				//	DocumentRequest: AtMock.USE_ACTUAL				// AtMock will use the actual implementation of the DocumentRequest, rather than a mock
				//}
			});
		});

		beforeEach(function(){
		    docRequestService.$compile('<at-directive at-something="sdfsd"></at-directive>');
			docRequestService.$element;
			docRequestService.$scope.$digest();
			docRequestService.$digest();
		});

		beforeEach(module('myApp'));
		beforeEach(module('myAppMocks'));

		beforeEach(inject(function(_myService_, _StreamAPIMock_){
			myService = _myService_;
			streamAPI = _StreamAPI_;
		}));

		it('should do stuff', function(){
			myService.callServer();
			expect(streamAPI.post).toHaveBeenCalled();
		});

		beforeEach(AtMock('myService', function(mocks, myService){
			myMocks = mocks;
			service = myService;
		}));

		describe('fetchRequestedDocuments', function () {
			var fakeUser, serverResponse;

			beforeEach(function(){
			    fakeUser = {
					getID: function(){
						return 'someID';
					}
				};
				serverResponse = {
					documentRequests: [{ID: 1}, {ID: 2}, {ID: 3}]
				};
			});

			it('should be a function', function(){
				expect(docRequestService.fetchRequestedDocuments).toEqual(jasmine.any(Function));
			});
			
			it('should request the documents from the server', function(){
				docRequestService.fetchRequestedDocuments(fakeUser);
				expect(docRequestService.$mocks.SpringControllerService.post)
					.toHaveBeenCalledWith('/documents/getAllRequests', jasmine.any(Object));
			});

			it('should return all of the document requests from the server', function(){
				var docs = docRequestService.fetchRequestedDocuments(fakeUser);
				expect(docs.requests.length).toEqual(0);
				docs.requests.$promise.then.callback(serverResponse);
				expect(docs.requests.length).toEqual(3);
			});

		});

		describe('_removeRequest', function () {

			beforeEach(function(){
			    docRequestService.requests = [{ID: 1}, {ID: 2}, {ID: 3}];
			});

			it('should remove the given request if it exists in the current list', function(){
				expect(docRequestService.requests.length).toEqual(3);
				docRequestService._removeRequest({ID: 2});
				expect(docRequestService.requests.length).toEqual(2);
			});

			it('should not remove the any request if the request does not exist in the current list', function(){
				expect(docRequestService.requests.length).toEqual(3);
				docRequestService._removeRequest({ID: 7});
				expect(docRequestService.requests.length).toEqual(3);
			});

		});

		describe('cancelRequest', function () {
			var fakeRequest, streamAPIService;

			beforeEach(function(){
				docRequestService.requests = [{ID: 1}, {ID: 2}];
			    fakeRequest = {ID: 1};
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
				expect(docRequestService._removeRequest).toHaveBeenCalledWith(fakeRequest);
			});

		});

		describe('remind', function () {
			var fakeRequest, springCtrlService;

			beforeEach(function(){
				fakeRequest = {ID: 1};
				springCtrlService = docRequestService.$mocks.SpringControllerService;
			});

			it('should remind the requestee using the API', function(){
				docRequestService.remind(fakeRequest);
				expect(springCtrlService.get).toHaveBeenCalled();
				expect(springCtrlService.get.mostRecentCall.args[0]).toContain('documentRequestID=' + fakeRequest.ID);
			});

			it('should return the promise that resulted from the API call', function(){
				var expectedPromise = docRequestService.remind(fakeRequest);
				expect(expectedPromise).toBe(springCtrlService.get.mostRecentCall.$promise);
			});

		});

		describe('getCancelDialogId', function () {

			it('should return the dialog id for the cancel dialog', function(){
			    var id = docRequestService.getCancelDialogId();
				expect(id).toEqual(docRequestService.$mocks.DocumentRequestDialogIDs.cancelDialog);
			});

		});

	});

});