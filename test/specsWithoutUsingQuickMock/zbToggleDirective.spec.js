(function(){

	/**
	 * This is an example of a unit test for the zb-toggle directive, using
	 * vanilla Jasmine, not using QuickMock
	 */

	describe('zb-toggle Directive', function () {
		var scope, element, notificationService, $compile;

		beforeEach(function(){
			module('QuickMockDemo');
			module(function($provide){
				var mockNotificationService = jasmine.createSpyObj('NotificationService', ['error','success','warning','basic','confirm']);
				$provide.value('NotificationService', mockNotificationService);
			});
			inject(function(_$rootScope_, _$compile_, _NotificationService_){
				scope = _$rootScope_.$new();
				$compile = _$compile_;
				notificationService = _NotificationService_;
			});
		});

		beforeEach(function(){
			element = angular.element('<div zb-toggle></div>');
			$compile(element)(scope);
			scope.$digest();
		});

		it('should have the toggle class', function(){
			expect(element.hasClass('toggle')).toBe(true);
		});

		it('should show a checkbox', function(){
			var input = element.find('input');
			expect(input.attr('type')).toEqual('checkbox');
		});

		it('should transclude the inner content', function(){
			element = angular.element('<div zb-toggle><div>Sample Inner Content</div></div>');
			$compile(element)(scope);
			scope.$digest();
			var span = element.find('span');
			expect(span.html()).toContain('Sample Inner Content');
		});

		it('should toggle the checkbox when clicked', function(){
			expect(scope.check).toBe(false);
			element[0].click();
			expect(scope.check).toBe(true);
			element[0].click();
			expect(scope.check).toBe(false);
		});

		it('should show a success message when toggled to true', function(){
			expect(scope.check).toBe(false);
			scope.check = true;
			scope.$digest();
			expect(notificationService.success).toHaveBeenCalled();
		});

	});

})();