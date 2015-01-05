(function(){

	describe('UserFormValidator', function () {
		var formValidator, fakeUser;

		beforeEach(function(){
			formValidator = QuickMock({
				providerName: 'UserFormValidator',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],

				// QuickMock defaults to using actual implementations for .value() and .constant() providers
				// so this mocks object below is not needed, but can be included if desired
				mocks: {
					InvalidUserFormMessages: QuickMock.USE_ACTUAL,
					UserRegex: QuickMock.USE_ACTUAL
				}
			});
			fakeUser = {  					// this fakeUser will pass the validator as is
				email: 'bob@bob.com',
				password: 'abcd1234',
				passwordConfirm: 'abcd1234',
				website: 'http://www.google.com'
			}
		});

		it('should return invalid for an undefined user object', function(){
			var result = formValidator(undefined);
			expect(result.isValid).toBe(false);
		});

		it('should return invalid for a null user object', function(){
			var result = formValidator(null);
			expect(result.isValid).toBe(false);
		});

		it('should return invalid for an empty user object', function(){
			var result = formValidator({});
			expect(result.isValid).toBe(false);
		});

		it('should return invalid if there is no email', function(){
			fakeUser.email = '';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if there is no email', function(){
			fakeUser.email = '';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.emailInvalid;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return invalid if there is no password', function(){
			fakeUser.password = '';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if there is no password provided', function(){
			fakeUser.password = '';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.passwordLength;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return invalid if the password is too short', function(){
			fakeUser.password = 'abcd';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if the password is too short', function(){
			fakeUser.password = 'abcd';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.passwordLength;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return invalid if the password does not meet the requirements', function(){
			fakeUser.password = 'abcd#&@$';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if the password does not meet the requirements', function(){
			fakeUser.password = 'abcd#&@$';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.passwordInvalid;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return invalid if the two passwords do not match', function(){
			fakeUser.passwordConfirm = 'abcd12345';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if the two passwords do not match', function(){
			fakeUser.passwordConfirm = 'abcd12345';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.passwordsDontMatch;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return invalid if an invalid website url is provided', function(){
			fakeUser.website = 'http://go';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(false);
		});

		it('should return the proper message if an invalid website url is provided', function(){
			fakeUser.website = 'http://go';
			var result = formValidator(fakeUser),
				exectedMessage = formValidator.$mocks.InvalidUserFormMessages.urlInvalid;
			expect(result.messages).toContain(exectedMessage);
		});

		it('should return valid if no website is provided', function(){
			fakeUser.website = '';
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(true);
		});

		it('should return valid if user data is valid', function(){
			var result = formValidator(fakeUser);
			expect(result.isValid).toBe(true);
		});

		it('should return no error messages if user data is valid', function(){
			var result = formValidator(fakeUser);
			expect(result.messages.length).toBe(0);
		});

	});

})();