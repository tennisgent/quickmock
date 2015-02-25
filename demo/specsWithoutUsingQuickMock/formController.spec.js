(function(){

	describe('FormController', function () {
		var formCtrl, fakeUser, apiService, scope, formValidator, notifyService, $ctrl;

		beforeEach(function(){
			module('QuickMockDemo');
			apiService = jasmine.createSpyObj('APIService',['get','put']);
			apiService.get.$promise = jasmine.createSpyObj('$promise', ['then']);
			apiService.get.$promise.then.$callback = function(){
				apiService.get.$promise.then.calls.mostRecent().args[0].apply(this, arguments);
			};
			apiService.get.and.returnValue(apiService.get.$promise);
			apiService.put.$promise = jasmine.createSpyObj('$promise', ['then']);
			apiService.put.$promise.then.$callback = function(){
				apiService.put.$promise.then.calls.mostRecent().args[0].apply(this, arguments);
			};
			apiService.put.and.returnValue(apiService.put.$promise);
			formValidator = jasmine.createSpy('UserFormValidator');
			notifyService = jasmine.createSpyObj('NotificationService',['error','success','warning','basic','confirm']);
			inject(function($rootScope, $controller){
				scope = $rootScope.$new();
				$ctrl = $controller;
			});
			formCtrl = $ctrl('FormController', {
				APIService: apiService,
				UserFormValidator: formValidator,
				NotificationService: notifyService,
				$scope: scope
			});
		});

		it('should retrieve the user data when initialized', function(){
			expect(scope.user).toBeNull();   									// $scope.user should be null
			expect(apiService.get).toHaveBeenCalledWith('/user/me');			// API should have been queried
			apiService.get.$promise.then.$callback(fakeUser);					// "flush" the callback for the then() method, passing in fakeUser
			expect(scope.user).toEqual(fakeUser);								// $scope.user should be equal to the "data" received from the API
		});

		it('should toggle editing mode when $scope.toggleEditUser() is called', function(){
			expect(scope.edit).toBe(false);
			scope.toggleEditUser();
			expect(scope.edit).toBe(true);
			scope.toggleEditUser();
			expect(scope.edit).toBe(false);
		});

		describe('saveUser', function () {

			it('should validate user data before saving', function(){
				scope.user = fakeUser;
				formValidator.and.returnValue({isValid: true});
				scope.saveUser();
				expect(formValidator).toHaveBeenCalledWith(fakeUser);
			});

			it('should save user data, if data is valid', function(){
				scope.user = fakeUser;
				formValidator.and.returnValue({isValid: true});
				scope.saveUser();
				expect(apiService.put).toHaveBeenCalledWith('/user/me');
			});

			it('should not save user data, if data is invalid', function(){
				scope.user = fakeUser;
				formValidator.and.returnValue({isValid: false});
				scope.saveUser();
				expect(apiService.put).not.toHaveBeenCalled();
			});

			it('should show error messages if user data is invalid', function(){
				var validatorResponse = {isValid: false, messages: ['msg1','msg2','msg3']};
				formValidator.and.returnValue(validatorResponse);
				scope.saveUser();
				expect(notifyService.error.calls.count()).toEqual(validatorResponse.messages.length);
			});

			it('should show success message if user data is saved successfully', function(){
				formValidator.and.returnValue({isValid: true});
				scope.saveUser();											// call the function to setup the .then() callback
				apiService.put.$promise.then.$callback();					// "flush" the .then() callback by calling it directly
				expect(notifyService.success).toHaveBeenCalled();
			});

		});

	});

})();