define(['angular', 'lodash'], function (angular, _) {

	return angular.module('documentCentral.services.DocumentRequestService', [])

		.value('DocumentRequestDialogIDs', {
			cancelDialog: 'at-document-request-cancel-request-dialog',
			uploadDialog: 'at-document-request-upload-dialog'
		})

		.factory('DocumentRequest', [function(){
			return function DocumentRequest (options) {
				_.assign(this, options);
			};
		}])

		.factory('DocumentRequestService', ['SpringControllerService','StreamAPIService','tileConfig','DocumentRequestDialogIDs','DocumentRequest',
			function DocumentRequestService (SpringControllerService,StreamAPIService, tileConfig, DialogIDs, DocumentRequest){
				return {

					requests: [],

					fetchRequestedDocuments: function (user) {
						var documents = [],
							options = {};

						options.userID = user.getID();
						options.refObjCode = tileConfig.dcObjCode;
						options.refObjID = tileConfig.dcObjID;

						documents.$promise = SpringControllerService.post('/documents/getAllRequests', options);
						documents.$promise.then(function(data){
							angular.forEach(data.documentRequests, function(req) {
								documents.push( new DocumentRequest(req) );
							});
						});
						this.requests = documents;
						return this;
					},

					_removeRequest: function (request) {
						_.remove(this.requests, function(req) {
							return req.ID == request.ID;
						});
					},

					cancelRequest: function (DocumentRequest) {
						var that = this;
						DocumentRequest.status = "canceled";
						return StreamAPIService.edit({ objCode: 'DOCREQ', ID: DocumentRequest.ID }, DocumentRequest)
							.$promise
							.then(function(data){
								that._removeRequest(DocumentRequest);
							});
					},

					uploadImage: function () {

					},

					remind: function (DocumentRequest) {
						var getURL = '/document/request/remindRequestee?documentRequestID=' + DocumentRequest.ID;
						return SpringControllerService.get(getURL);
					},

					getCancelDialogId: function () {
						return DialogIDs.cancelDialog;
					},

					getUploadDialogId: function () {
						return DialogIDs.uploadDialog;
					}
				};

			}]);
});