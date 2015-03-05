(function(){

	describe('quickmock', function () {

		function getMocks(mockName){
			var mocks = {
				global: jasmine.createSpyObj('global', ['options','mockPrefix','allModules','injector','modObj','providerType','mocks','provider','useActual','muteLogs','invokeQueue']),
				AssertRequiredOptions: jasmine.createSpy('AssertRequiredOptions'),
				MockOutProvider: jasmine.createSpy('MockOutProvider'),
				GetProviderType: jasmine.createSpy('GetProviderType'),
				invokeQueue: [
					['$provide','factory',['FakeFactory',['Dep1','Dep2',function(dep1,dep2){}]]],
					['$provide','service',['FakeService',['Dep1','Dep2',function(dep1,dep2){}]]],
					['$provide','directive',['FakeDirective',['Dep1','Dep2',function(dep1,dep2){}]]],
					['$provide','value',['FakeValue',['Dep1','Dep2',function(dep1,dep2){}]]]
				],
				options: {
					providerName: 'someProvider',
					moduleName: 'someModule',
					mockModules: ['someModules']
				},
				ThrowError: jasmine.createSpy('ThrowError')
			};
			mocks.GetProviderType.and.returnValue('someType');
			mocks.AssertRequiredOptions.and.returnValue(mocks.options);
			mocks.global.invokeQueue.and.returnValue(mocks.invokeQueue);
			return mockName ? mocks[mockName] : mocks;
		}

		describe('quickmock service', function () {
			var qm, mocks;

            beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					$provide.value('global', mocks.global);
					$provide.value('AssertRequiredOptions', mocks.AssertRequiredOptions);
					$provide.value('MockOutProvider', mocks.MockOutProvider);
					$provide.value('GetProviderType', mocks.GetProviderType);
				});
                inject(function(quickmock){
					qm = quickmock;
                });

                spyOn(angular, 'injector').and.returnValue({});
                spyOn(angular, 'module').and.callFake(function(modName){
                    return {_invokeQueue: [modName]};
                });
            });

            it('should be a function called "quickmock"', function(){
                expect(qm).toEqual(jasmine.any(Function));
                expect(qm.toString().indexOf('function quickmock(')).toEqual(0);
            });

            it('should verify that the required options have been met', function(){
                qm(mocks.options);
                expect(mocks.AssertRequiredOptions).toHaveBeenCalledWith(mocks.options);
            });

			it('should get the provider type', function(){
				qm(mocks.options);
				expect(mocks.GetProviderType).toHaveBeenCalledWith(mocks.options.providerName);
			});

			var globals = {
				options: getMocks('options'),
				allModules: getMocks('options').mockModules.concat(['ngMock']),
				injector: {},
				modObj: {_invokeQueue: ['someModule']},
				invokeQueue: ['someModule','someModules','ngMock'],
				providerType: 'someType',
				mocks: {},
				provider: {}
			};

			angular.forEach(globals, function(expectedValue, property){

				it('should set the global ' + property + ' property to the proper value', function(){
					qm(mocks.options);
					expect(mocks.global[property]).toHaveBeenCalledWith(expectedValue);
				});

			});

		});

		describe('GetFromInvokeQueue', function () {
			var getFromInvokeQueue, mocks;

			beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					$provide.value('global', mocks.global);
				});
				inject(function(GetFromInvokeQueue){
					getFromInvokeQueue = GetFromInvokeQueue;
				});
			});

			it('should return the correct data for FakeFactory', function(){
				expect(getFromInvokeQueue('FakeFactory')).toBe(mocks.invokeQueue[0]);
			});

			it('should return the correct data for FakeValue', function(){
				expect(getFromInvokeQueue('FakeValue')).toBe(mocks.invokeQueue[3]);
			});

			it('should return the correct data for FakeService', function(){
				expect(getFromInvokeQueue('FakeService')).toBe(mocks.invokeQueue[1]);
			});

		});

		describe('AssertRequiredOptions', function () {
			var assertRequirdOptions, mocks;

			beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					$provide.value('ThrowError', mocks.ThrowError);
				});
			    inject(function(AssertRequiredOptions, $window, ErrorMessages){
					assertRequirdOptions = AssertRequiredOptions;
					mocks.$window = $window;
					mocks.errorMessage = ErrorMessages;
				})
			});

			it('should throw an exception when angular is not available', function(){
				mocks.$window.angular = undefined;
				assertRequirdOptions(mocks.options);
				expect(mocks.ThrowError).toHaveBeenCalledWith(mocks.errorMessage.noAngular);
			});

		});

	});

})();