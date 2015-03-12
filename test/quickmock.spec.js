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
				ThrowError: jasmine.createSpy('ThrowError'),
                GetAllMocksForProvider: jasmine.createSpy('GetAllMocksForProvider'),
                SetupDirective: jasmine.createSpy('SetupDirective'),
                SetupInitializer: jasmine.createSpy('SetupInitializer'),
                SanitizeProvider: jasmine.createSpy('SanitizeProvider'),
				InitializeProvider: jasmine.createSpy('InitializeProvider'),
				SpyOnProviderMethods: jasmine.createSpy('SpyOnProviderMethods')
			};
			mocks.GetProviderType.and.returnValue('someType');
			mocks.AssertRequiredOptions.and.returnValue(mocks.options);
			mocks.global.invokeQueue.and.returnValue(mocks.invokeQueue);
            mocks.global.options.and.returnValue(mocks.options);
			return mockName ? mocks[mockName] : mocks;
		}

		describe('quickmock service', function () {
			var qm, mocks;

            beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
                    angular.forEach(['global','AssertRequiredOptions','MockOutProvider','GetProviderType'], function(mock){
                        $provide.value(mock, mocks[mock]);
                    });
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
			var assertRequiredOptions, mocks;

			beforeEach(function(){
				mocks = getMocks();
                mocks.$window = {
					angular: angular
				};
				module('quickmock');
				module(function($provide){
					$provide.value('ThrowError', mocks.ThrowError);
                    $provide.value('$window', mocks.$window);
				});
			    inject(function(AssertRequiredOptions, ErrorMessages){
					assertRequiredOptions = AssertRequiredOptions;
					mocks.errorMessage = ErrorMessages;
				});
			});

			it('should throw an exception when angular is not available', function(){
				mocks.$window.angular = undefined;
				assertRequiredOptions(mocks.options);
				expect(mocks.ThrowError).toHaveBeenCalledWith(mocks.errorMessage.noAngular);
			});

			it('should throw an exception when no providerName is given', function(){
				mocks.options.providerName = undefined;
				assertRequiredOptions(mocks.options);
				expect(mocks.ThrowError).toHaveBeenCalledWith(mocks.errorMessage.noProviderName);
			});

			it('should not throw an exception when no providerName is given, as long as configBlocks is true', function(){
				mocks.options.providerName = undefined;
				mocks.options.configBlocks = true;
				assertRequiredOptions(mocks.options);
				expect(mocks.ThrowError).not.toHaveBeenCalled();
			});

			it('should not throw an exception when no providerName is given, as long as runBlocks is true', function(){
				mocks.options.providerName = undefined;
				mocks.options.runBlocks = true;
				assertRequiredOptions(mocks.options);
				expect(mocks.ThrowError).not.toHaveBeenCalled();
			});

			it('should throw an exception when no moduleName is given', function(){
				mocks.options.moduleName = undefined;
				assertRequiredOptions(mocks.options);
				expect(mocks.ThrowError).toHaveBeenCalledWith(mocks.errorMessage.noModuleName);
			});

			it('should set mockModules to a default empty array', function(){
				mocks.options.mockModules = undefined;
				assertRequiredOptions(mocks.options);
				expect(mocks.options.mockModules).toEqual([]);
			});

		});

        describe('MockOutProvider', function () {
            var mockOutProvider, mocks;

            beforeEach(function(){
                mocks = getMocks();
                mocks.GetAllMocksForProvider.and.returnValue({});
                module('quickmock');
                module(function($provide){
                    angular.forEach(['global','GetAllMocksForProvider','SetupInitializer','SanitizeProvider'], function(mock){
                        $provide.value(mock, mocks[mock]);
                    });
                });
                inject(function(MockOutProvider){
                    mockOutProvider = MockOutProvider;
                });
            });

            describe(', if provider has a known type,', function () {

                it('should generate mocks for the given provider', function(){
                    mockOutProvider();
                    expect(mocks.GetAllMocksForProvider).toHaveBeenCalledWith(mocks.options.providerName);
                });

                it('should set the global mocks value', function(){
                    mockOutProvider();
                    expect(mocks.global.mocks).toHaveBeenCalledWith({});
                });

				it('should setup the initializer', function(){
					mockOutProvider();
					expect(mocks.SetupInitializer).toHaveBeenCalled();
				});

				it('should sanitize each item in the invoke queue', function(){
					mockOutProvider();
					angular.forEach(mocks.invokeQueue, function(providerData){
						expect(mocks.SanitizeProvider).toHaveBeenCalledWith(providerData);
					});
				});

				it('should return the intialized provider', function(){
					mocks.SetupInitializer.and.returnValue({key: 'value'});
					expect(mockOutProvider()).toEqual({key: 'value'})
				});

            });

			describe(', if provider has an unknown type', function () {

				beforeEach(function(){
				    mocks.global.providerType.and.returnValue('unknown');
				});

				it('should not setup the initializer', function(){
					mockOutProvider();
					expect(mocks.SetupInitializer).not.toHaveBeenCalled();
				});

				it('should sanitize each item in the invoke queue', function(){
					mockOutProvider();
					angular.forEach(mocks.invokeQueue, function(providerData){
						expect(mocks.SanitizeProvider).toHaveBeenCalledWith(providerData);
					});
				});

				it('should return a default empty object', function(){
					expect(mockOutProvider()).toEqual({})
				});

			});

        });

		describe('SetupInitializer', function () {
			var setupInitializer, mocks, provider;

			beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					angular.forEach(['global','InitializeProvider','SpyOnProviderMethods'], function(mock){
						$provide.value(mock, mocks[mock]);
					});
				});
				inject(function(SetupInitializer){
					setupInitializer = SetupInitializer;
				});
				provider = {};
				mocks.InitializeProvider.and.returnValue(provider);
			});
			
			it('should intialize provider', function(){
				setupInitializer();
				expect(mocks.InitializeProvider).toHaveBeenCalled();
			});
			
			it('should spy on provider\'s methods if flag is set', function(){
				mocks.global.options.and.returnValue({spyOnProviderMethods: true});
				setupInitializer();
				expect(mocks.SpyOnProviderMethods).toHaveBeenCalledWith(provider);
			});

			it('should not spy on provider\'s methods if flag is not set', function(){
				setupInitializer();
				expect(mocks.SpyOnProviderMethods).not.toHaveBeenCalled();
			});

			it('should expose the mocks as $mocks', function(){
				var fakeMocks = {mock1: {}, mock2: {}};
				mocks.global.mocks.and.returnValue(fakeMocks);
				var result = setupInitializer();
				expect(result.$mocks).toBe(fakeMocks);
			});

			it('should expose the initializer method as $initialize', function(){
				var result = setupInitializer();
				expect(result.$initialize).toBe(setupInitializer);
			});

		});

		describe('InitializeProvider', function () {
			var setupInitializer, mocks, provider;

			beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					angular.forEach(['global','QuickmockCompile'], function(mock){
						$provide.value(mock, mocks[mock]);
					});
				});
				inject(function(SetupInitializer){
					setupInitializer = SetupInitializer;
				});
				provider = {};
				mocks.InitializeProvider.and.returnValue(provider);
			});

		});

	});

})();