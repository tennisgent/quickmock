(function(){

	describe('zb-toggle Directive', function () {
		var zbToggle;

		beforeEach(function(){
		    zbToggle = QuickMock({
				providerName: 'zbToggle',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],
				html: '<div zb-toggle></div>'    		// default html to be compiled when .$compile() is called
			});
			zbToggle.$compile();  // .$compile() compiles the html string and then calls scope.$digest()
		});

		it('should have the toggle class', function(){
			expect(zbToggle.$element.hasClass('toggle')).toBe(true);
		});

		it('should show a checkbox', function(){
			var input = zbToggle.$element.find('input');
			expect(input.attr('type')).toEqual('checkbox');
		});

		it('should transclude the inner content', function(){
			// .$compile() accepts a new html string, which will override the
			// html string previously provided when QuickMock was initialized
			// NOTE: When .$compile() is called, you don't need to call $scope.$digest() again
		    zbToggle.$compile('<div zb-toggle><div>Sample Inner Content</div></div>');
			var span = zbToggle.$element.find('span');
			expect(span.html()).toContain('Sample Inner Content');
		});

		it('should toggle the checkbox when clicked', function(){
			expect(zbToggle.$scope.check).toBe(false);
			zbToggle.$element[0].click();
			expect(zbToggle.$scope.check).toBe(true);
			zbToggle.$element[0].click();
			expect(zbToggle.$scope.check).toBe(false);
		});

		it('should show a success message when toggled to true', function(){
			expect(zbToggle.$scope.check).toBe(false);
			zbToggle.$scope.check = true;
			zbToggle.$scope.$digest();
			expect(zbToggle.$mocks.NotificationService.success).toHaveBeenCalled();
		});

	});

})();