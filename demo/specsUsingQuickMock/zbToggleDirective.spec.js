(function(){

	describe('zb-toggle Directive', function () {
		var zbToggle;

		beforeEach(function(){
			zbToggle = quickmock({
				providerName: 'zbToggle',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],
				html: '<div zb-toggle ng-model="isChecked"></div>'    		// default html to be compiled when .$compile() is called
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
			// html string previously provided when quickmock was initialized
			// NOTE: When .$compile() is called, you don't need to call $scope.$digest() again
			zbToggle.$compile('<div zb-toggle ng-model="isChecked"><div>Sample Inner Content</div></div>');
			var span = zbToggle.$element.find('span');
			expect(span.text()).toEqual('Sample Inner Content');
		});

		it('should default to unchecked if no model value is previously set', function(){
			var wasChecked = zbToggle.$element.find('input').attr('checked');
			expect(wasChecked).toBeFalsy();
		});

		it('should be checked if model value is truthy', function(){
			zbToggle.$scope.isChecked = true;
			zbToggle.$compile('<div zb-toggle ng-model="isChecked"></div>');
			expect(zbToggle.$isoScope.check).toEqual(true);
			var wasChecked = zbToggle.$element.find('input').attr('checked');
			expect(wasChecked).toEqual('checked');
		});

		it('should toggle the checkbox when clicked', function(){
			expect(zbToggle.$scope.isChecked).toBe(false);
			zbToggle.$element[0].click();
			expect(zbToggle.$scope.isChecked).toBe(true);
			zbToggle.$element[0].click();
			expect(zbToggle.$scope.isChecked).toBe(false);
		});

		it('should show a success message when toggled to true', function(){
			expect(zbToggle.$isoScope.check).toBe(false);
			zbToggle.$isoScope.check = true;
			zbToggle.$isoScope.$digest();
			expect(zbToggle.$mocks.NotificationService.success).toHaveBeenCalled();
		});

	});

})();