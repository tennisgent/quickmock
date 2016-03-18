(function(){

	//TODO: Finish writing tests that define/test exact general providers api

	describe('General Providers', function () {
		var fakeController;

		angular.module('GeneralProvidersTestModule', [])
			.factory('FakeFactory', function(){
				return function(){
					return {key: 'value'};
				}
			})
			.service('FakeService', function(){
				return function(){
					return {
						func1: function(){},
						func2: function(){}
					};
				}
			})
			.service('FakeService2', function(){
				return function(){
					return {
						func3: function(){},
						func4: function(){}
					};
				}
			})
			.controller('FakeController', function(FakeFactory, FakeService){
				this.someFactory = FakeFactory;
				this.someService = FakeService;
				this.someFunction = function someFunction(){
					FakeService.func1();
				};
			})
			.controller('FakeController2', function($rootScope, FakeService, FakeService2){
				$rootScope.someFunction = function(){
					FakeService.func1();
				};
				FakeService2.func3();
			});

		angular.module('GeneralProvidersTestModuleMocks', [])
			.mockFactory('FakeFactory', function(){
				return jasmine.createSpy('FakeFactory').and.returnValue({key: 'value'});
			})
			.mockService('FakeService', function(){
				return jasmine.createSpyObj('FakeService', ['func1', 'func2']);
			});

		describe('api', function () {
			var config, initQuickMock;

			beforeEach(function(){
				config = {
					providerName: 'FakeController',
					moduleName: 'GeneralProvidersTestModule',
					mockModules: ['GeneralProvidersTestModuleMocks']
				};
				initQuickMock = function initQuickMock(){
					return quickmock(config);
				};
			});

			it('should not throw an error if required config options are provided', function(){
				expect(initQuickMock).not.toThrow();
			});

			it('should throw an error if window.angular is not available', function(){
				var ng = window.angular;
				window.angular = undefined;
				expect(initQuickMock).toThrow();
				window.angular = ng;
			});

			it('should throw an error if no providerName is given', function(){
				config.providerName = null;
				expect(initQuickMock).toThrow();
			});

			it('should throw an error if no moduleName is given', function(){
				config.moduleName = null;
				expect(initQuickMock).toThrow();
			});

			it('should return the provider that is being tested', function(){
				var result = quickmock(config);
				expect(result.someFactory).toEqual(jasmine.any(Function));
				expect(result.someService).toEqual(jasmine.any(Object));
			});

			it('should properly inject mocks for provider\'s dependencies', function(){
				var result = quickmock(config);
				expect(result.someFactory).toBe(result.$mocks.FakeFactory);
				expect(result.someService).toBe(result.$mocks.FakeService);
			});

			it('should return spied methods if the spyOnProviderMethods flag is set', function(){
				config.spyOnProviderMethods = true;
				var result = quickmock(config);
				expect(result.someFunction.calls).toEqual(jasmine.any(Object));
			});

			it('should not return spied methods if the spyOnProviderMethods flag is not set', function(){
				config.spyOnProviderMethods = false;
				var result = quickmock(config);
				expect(result.someFunction.calls).toBeUndefined();
			});

			it('should throw an error if one of the provider\'s dependencies are not mocked', function(){
				config.providerName = 'FakeController2';
				expect(initQuickMock).toThrow();
			});

			//it('should not throw an error if one of the provider\'s dependencies are not mocked but useActualDependencies flag is set', function(){
			//	config.providerName = 'FakeController2';
			//	config.useActualDependencies = true;
			//	expect(initQuickMock).not.toThrow();
			//});

		});

		describe('$mocks', function () {

			beforeAll(function(){
				fakeController = quickmock({
					providerName: 'FakeController',
					moduleName: 'GeneralProvidersTestModule',
					mockModules: ['GeneralProvidersTestModuleMocks']
				});
			});

			it('should be an object', function(){
				expect(fakeController.$mocks).toEqual(jasmine.any(Object));
			});

			it('should have a FakeFactory spy', function(){
				expect(fakeController.$mocks.FakeFactory).toEqual(jasmine.any(Function));
				expect(fakeController.$mocks.FakeFactory.calls).toEqual(jasmine.any(Object));
			});

			it('should have a FakeService spy', function(){
				expect(fakeController.$mocks.FakeService).toEqual(jasmine.any(Object));
				expect(fakeController.$mocks.FakeService.func1).toEqual(jasmine.any(Function));
			});

		});

		describe('$initialize', function () {

			beforeEach(function(){
				fakeController = quickmock({
					providerName: 'FakeController',
					moduleName: 'GeneralProvidersTestModule',
					mockModules: ['GeneralProvidersTestModuleMocks']
				});
			});

			it('should be a function', function(){
				expect(fakeController.$initialize).toEqual(jasmine.any(Function));
			});

			it('should still provide access to $mocks after being called', function(){
				expect(fakeController.$mocks).toEqual(jasmine.any(Object));
				fakeController.$initialize();
				expect(fakeController.$mocks).toEqual(jasmine.any(Object));
			});

			it('should return same mocks object', function(){
			    var mocks1 = fakeController.$mocks;
				fakeController.$initialize();
				expect(mocks1).toBe(fakeController.$mocks);
			});

		});

	});

})();