(function(){

	describe('firstInitialLastName Filter', function () {
		var filter, fakeUser;

		beforeEach(function(){
		    filter = QuickMock({
				providerName: 'firstInitialLastName',
				moduleName: 'QuickMockDemo'
			});
			fakeUser = {
				firstName: 'Michael',
				lastName: 'Jackson'
			};
		});

		it('should be a function', function(){
			expect(angular.isFunction(filter)).toBe(true);
		});

		it('should return input if input is not an object', function(){
			expect(filter(null)).toBe(null);
			expect(filter(undefined)).toBe(undefined);
			expect(filter(0)).toBe(0);
		});

		it('should return empty string if no firstName and no lastName are given', function(){
			var result = filter({});
			expect(result).toEqual('');
		});

		it('should return only the last name if only a lastName is given', function(){
			delete fakeUser.firstName;
		    var result = filter(fakeUser);
			expect(result).toEqual(fakeUser.lastName);
		});

		it('should return the first initial if only a firstName is given', function(){
			delete fakeUser.lastName;
			var result = filter(fakeUser),
				expected = 'M.';
			expect(result).toEqual(expected);
		});

		it('should return the first initial and last name if firstName and lastName are given', function(){
			var result = filter(fakeUser),
				expected = 'M. Jackson';
			expect(result).toEqual(expected);
		});

		it('should return the multiple first initials if firstName is multiple words', function(){
			fakeUser.firstName = 'Michael John';
			var result = filter(fakeUser),
				expected = 'M.J. Jackson';
			expect(result).toEqual(expected);
		});

	});

})();