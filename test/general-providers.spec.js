(function(){

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
			.controller('FakeController', function(FakeFactory, FakeService){
				this.fakeFactory = FakeFactory;
				this.fakeService = FakeService;
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
					quickmock(config);
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