(function(){

	fdescribe('red-blue-box Directive', function () {
		var redBlueBox;

		beforeEach(function(){
			redBlueBox = quickmock({
				providerName: 'redBlueBox',
				moduleName: 'QuickMockDemo',
                mockModules: ['QuickMockDemoMocks'],
				html: '<div red-blue-box></div>'
			});
			redBlueBox.$compile();
		});

		it('should have the color-box class', function(){
			expect(redBlueBox.$element.hasClass('color-box')).toBe(true);
		});

		it('should default to red', function(){
			expect(redBlueBox.$element.hasClass('red')).toBe(true);
		});

		it('should toggle to blue when clicked', function(){
			redBlueBox.$element[0].click();
			expect(redBlueBox.$element.hasClass('blue')).toBe(true);
		});

        it('should watch for changes in color', function(){
            spyOn(redBlueBox.$mocks.$scope, '$watch');
            redBlueBox.$compile();
            expect(redBlueBox.$mocks.$scope.$watch).toHaveBeenCalledWith('vm.isRed', jasmine.any(Function));
        });

        it('should show a notification message when the color changes to red', function(){
            console.log(redBlueBox.$mocks);
            redBlueBox.$ctrl.isRed = false;
            redBlueBox.$scope.$digest();
            expect(redBlueBox.$mocks.NotificationService.error).not.toHaveBeenCalled();
            redBlueBox.$ctrl.isRed = true;
            redBlueBox.$scope.$digest();
            expect(redBlueBox.$mocks.NotificationService.error).toHaveBeenCalled();
        });

	});

})();