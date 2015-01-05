(function(){

	describe('FormController', function () {
		var formCtrl, fakeUser, apiService, scope;

		beforeEach(function(){
			formCtrl = QuickMock({
				providerName: 'FormController',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks']
			});
			fakeUser = {name: 'Bob'};
			apiService = formCtrl.$mocks.APIService;  							// local aliases for $mocks can be useful
			scope = formCtrl.$mocks.$scope;										// if you are referencing them often
		});

		it('should retrieve the user data when initialized', function(){
			expect(scope.user).toBeNull();   									// $scope.user should be null
			expect(apiService.get).toHaveBeenCalledWith('/user/me');			// API should have been queried
			apiService.get.calls.mostRecentPromise.then.callback(fakeUser);		// "flush" the callback for the then() method, passing in fakeUser
			expect(scope.user).toEqual(fakeUser);								// $scope.user should be equal to the "data" received from the API
		});

		it('should toggle editing mode when $scope.toggleEditUser() is called', function(){
			expect(scope.edit).toBe(false);
			scope.toggleEditUser();
			expect(scope.edit).toBe(true);
			scope.toggleEditUser();
			expect(scope.edit).toBe(false);
		});



	});

})();