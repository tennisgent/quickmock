(function(){

	describe('zb-toggle Directive', function () {
		var redBlueBox;

		beforeEach(function(){
			redBlueBox = quickmock({
				providerName: 'redBlueBox',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],
				html: '<div red-blue-box></div>'    		// default html to be compiled when .$compile() is called
			});
			redBlueBox.$compile();  // .$compile() compiles the html string and then calls scope.$digest()
		});

		it('should have the color-box class', function(){
			expect(redBlueBox.$element.hasClass('color-box')).toBe(true);
		});

		it('should default to red', function(){
			expect(redBlueBox.$element.hasClass('red')).toBe(true);
		});

		it('should toggle to blue when clicked', function(){
			redBlueBox.$element[0].click();
			redBlueBox.$localScope.$digest();
			expect(redBlueBox.$element.hasClass('blue')).toBe(true);
		});

	});

})();