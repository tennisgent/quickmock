(function(){

	describe('NotificationService', function () {
		var notificationService, fakeMessage, mockWindow, titles;

		beforeEach(function(){
			notificationService = QuickMock({
				providerName: 'NotificationService',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],
				mocks: {
					NotificationTitles: QuickMock.USE_ACTUAL
				}
			});
			fakeMessage = 'some fake message';
			mockWindow = notificationService.$mocks.$window;
			titles = notificationService.$mocks.NotificationTitles;
		});

		it('should display proper error message', function(){
			notificationService.error(fakeMessage);
			var messageShown = mockWindow.alert.calls.argsFor(0)[0];
			expect(messageShown).toContain(titles.error);
			expect(messageShown).toContain(fakeMessage);
		});

		it('should display proper success message', function(){
			notificationService.success(fakeMessage);
			var messageShown = mockWindow.alert.calls.argsFor(0)[0];
			expect(messageShown).toContain(titles.success);
			expect(messageShown).toContain(fakeMessage);
		});

		it('should display proper warning message', function(){
			notificationService.warning(fakeMessage);
			var messageShown = mockWindow.alert.calls.argsFor(0)[0];
			expect(messageShown).toContain(titles.warning);
			expect(messageShown).toContain(fakeMessage);
		});

		it('should display proper basic message', function(){
			notificationService.basic(fakeMessage);
			var messageShown = mockWindow.alert.calls.argsFor(0)[0];
			expect(messageShown).toContain(titles.basic);
			expect(messageShown).toContain(fakeMessage);
		});

		it('should display proper confirmation message', function(){
			notificationService.confirm(fakeMessage);
			var messageShown = mockWindow.confirm.calls.argsFor(0)[0];
			expect(messageShown).toContain(titles.confirm);
			expect(messageShown).toContain(fakeMessage);
		});

		it('should return confirmed response from user', function(){
			mockWindow.confirm.and.returnValue(0);
			var result = notificationService.confirm(fakeMessage);
			expect(result).toEqual(0);
		});

	});

})();