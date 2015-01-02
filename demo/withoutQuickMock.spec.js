/* global define, describe, beforeEach, it, expect, loadFixtures, jQuery, angular, inject, module */
define([
	'angular',
	'modules/AtDocumentCentral/src/services/DocumentRequestService',
	'angularModules/attask/attask'
], function (angular, DocumentRequestService) {

	describe("DocumentRequestService", function () {
		var mockModule, documentRequestService, $httpBackend, mockTileConfig;

		mockTileConfig = function(){
			return {
				dcObjCode: 'MOCK',
				dcObjID: '123123123'
			};
		};

		beforeEach(function () {
			mockModule = angular.module("mockModule", ['attask', "attask.i18n", 'ngSanitize']);
			module("mockModule");
			module(DocumentRequestService.name);
			module(function($provide){
				$provide.factory('tileConfig', mockTileConfig);
			});
		});

		beforeEach(inject(function (DocumentRequestService, _$httpBackend_) {
			documentRequestService = DocumentRequestService;
			$httpBackend = _$httpBackend_;
		}));


		it('should pull in a list of documents for the user', function () {
			var documents = [],
				mockUser = {getID:function(){return 42;}};
			$httpBackend.expectPOST('/documents/getAllRequests').respond(200, {"data":{"documentRequests": [{"id":1},{"id":2}]}});
			documents = documentRequestService.fetchRequestedDocuments(mockUser).requests;
			expect(documents.length).toBe(0);

			$httpBackend.flush();
			expect(documents.length).toBe(2);
		});

		it('should send a cancelation request', function () {
			var mockRequest = {
				"ID":"1234abcd",
				"objCode":"DOCREQ"
			};
			$httpBackend.expectPOST('/attask/api-internal/DOCREQ/1234abcd?method=PUT').respond(200, {"data":{"ID":"1234abcd", "objCode": "DOCREQ"}});
			documentRequestService.cancelRequest(mockRequest);
			$httpBackend.flush();
		});

		it('should send a request to remind requestee', function () {
			var mockRequest = {
				"ID":"1234abcd",
				"objCode":"DOCREQ"
			};
			$httpBackend.expectGET('/document/request/remindRequestee?documentRequestID=1234abcd')
				.respond(200, {"data":{"success":true}});

			documentRequestService.remind(mockRequest);
			$httpBackend.flush();
		});


	});

});