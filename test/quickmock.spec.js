(function(){

	describe('quickmock', function () {

		function getMocks(mockName){
			var mocks = jasmine.createSpyObj('qmMocks', ['AssertRequiredOptions','MockOutProvider','GetProviderType','ThrowError',
				'GetAllMocksForProvider','SetupDirective','SetupInitializer','SanitizeProvider','InitializeProvider',
				'SpyOnProviderMethods','QuickmockCompile','QuickmockLog']);
			mocks.invokeQueue = [
				['$provide','factory',['FakeFactory',['Dep1','Dep2',function(dep1,dep2){}]]],
				['$provide','service',['FakeService',['Dep1','Dep2',function(dep1,dep2){}]]],
				['$provide','directive',['FakeDirective',['Dep1','Dep2',function(dep1,dep2){}]]],
				['$provide','value',['FakeValue',['Dep1','Dep2',function(dep1,dep2){}]]]
			];
			mocks.options = {
				providerName: 'someProvider',
				moduleName: 'someModule',
				mockModules: ['someModules'],
				mocks: {}
			};
			mocks.global = jasmine.createSpyObj('global', ['options','mockPrefix','allModules','injector','modObj','providerType',
				'mocks','provider','useActual','muteLogs','invokeQueue']);
			mocks.GetProviderType.and.returnValue('someType');
			mocks.AssertRequiredOptions.and.returnValue(mocks.options);
			mocks.global.invokeQueue.and.returnValue(mocks.invokeQueue);
			mocks.global.useActual.and.returnValue('USE_ACTUAL');
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
					expect(mockOutProvider().key).toEqual('value');
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
			var initProvider, mocks, injector, fakeMocks;

			beforeEach(function(){
				mocks = getMocks();
				module('quickmock');
				module(function($provide){
					angular.forEach(['global','QuickmockCompile'], function(mock){
						$provide.value(mock, mocks[mock]);
					});
				});
				inject(function(InitializeProvider, ProviderType){
					initProvider = InitializeProvider;
					mocks.ProviderType = ProviderType;
				});
				injector = jasmine.createSpyObj('$injector', ['get']);
				mocks.global.injector.and.returnValue(injector);
				fakeMocks = {mock1: 'someMock', mock2: 'someOtherMock'};
				mocks.global.mocks.and.returnValue(fakeMocks);
			});

			describe('for controllers', function () {
				var $controller;

				beforeEach(function(){
					$controller = jasmine.createSpy('$controller').and.returnValue('$controller');
					injector.get.and.returnValue($controller);
					mocks.global.providerType.and.returnValue(mocks.ProviderType.controller);
					mocks.global.options.and.returnValue({providerName: 'myController'});
				});

				it('should pull in the $controller service', function(){
				    initProvider();
					expect(mocks.global.injector).toHaveBeenCalled();
					expect(injector.get).toHaveBeenCalledWith('$controller');
				});

				it('should initialize the controller using $controller with the proper mocks', function(){
					initProvider();
					expect($controller).toHaveBeenCalledWith('myController', fakeMocks);
				});

				it('should return the initialized controller object', function(){
				    var result = initProvider();
					expect(result).toEqual('$controller');
				});

			});

			describe('for filters', function () {
				var $filter;

				beforeEach(function(){
					$filter = jasmine.createSpy('$filter').and.returnValue('$filter');
					injector.get.and.returnValue($filter);
					mocks.global.providerType.and.returnValue(mocks.ProviderType.filter);
					mocks.global.options.and.returnValue({providerName: 'myFilter'});
				});

				it('should pull in the $filter service', function(){
					initProvider();
					expect(mocks.global.injector).toHaveBeenCalled();
					expect(injector.get).toHaveBeenCalledWith('$filter');
				});

				it('should initialize the filter using $filter', function(){
					initProvider();
					expect($filter).toHaveBeenCalledWith('myFilter');
				});

				it('should return the initialized controller object', function(){
					var result = initProvider();
					expect(result).toEqual('$filter');
				});

			});

			describe('for directives', function () {
				var $rootScope;

				beforeEach(function(){
					$rootScope = jasmine.createSpyObj('$filter', ['$new']);
					injector.get.and.returnValue($rootScope);
					mocks.global.providerType.and.returnValue(mocks.ProviderType.directive);
				});

				it('should pull in the $rootScope service', function(){
					initProvider();
					expect(mocks.global.injector).toHaveBeenCalled();
					expect(injector.get).toHaveBeenCalledWith('$rootScope');
				});

				it('should compile the controller using quickmockCompile', function(){
					initProvider();
					expect(mocks.QuickmockCompile).toHaveBeenCalled();
				});

				it('should expose the directive\'s mocks', function(){
					var result = initProvider();
					expect(result.$mocks).toBe(fakeMocks);
				});

				it('should expose the directive\'s $scope', function(){
					$rootScope.$new.and.returnValue('$scope');
					var result = initProvider();
					expect(result.$scope).toBe('$scope');
				});

				it('should expose the directive\'s $compile function', function(){
					mocks.QuickmockCompile.and.returnValue('$compile');
					var result = initProvider();
					expect(mocks.QuickmockCompile).toHaveBeenCalled();
					expect(result.$compile).toBe('$compile');
				});

			});

			describe('for other providers', function () {

				angular.forEach(['factory','service','value','constant','provider'], function(type){

					it('should return the injected ' + type + 'provider', function(){
						var providerName = 'qm_' + type;
						mocks.global.options.and.returnValue({providerName: providerName});
						mocks.global.providerType.and.returnValue(mocks.ProviderType[type]);
						injector.get.and.returnValue(providerName);
						var result = initProvider();
						expect(injector.get).toHaveBeenCalledWith(providerName);
						expect(result).toEqual(providerName);
					});

				})

			});

		});

		//describe('GetMockForDependency', function () {
		//	var getMockForDep, mocks, injector, opts, dep, providerData;
        //
			//beforeEach(function(){
			//	mocks = getMocks();
			//	module('quickmock');
			//	module(function($provide){
			//		angular.forEach(['global','GetProviderType','QuickmockLog','ThrowError'], function(mock){
			//			$provide.value(mock, mocks[mock]);
			//		});
			//	});
			//	inject(function(GetMockForDependency, ProviderType){
			//		getMockForDep = GetMockForDependency;
			//		mocks.ProviderType = ProviderType;
			//	});
			//	providerData = mocks.invokeQueue[0];
			//	dep = providerData[2][1][0];
			//	injector = jasmine.createSpyObj('$injector', ['get','has']);
			//	injector.has.and.returnValue(true);
			//	mocks.global.injector.and.returnValue(injector);
			//	mocks.global.mockPrefix.and.returnValue('___');
        //        mocks.GetProviderType.and.returnValue(mocks.ProviderType.factory);
			//});
        //
		//	it('should use actual implementation if useActualDependencies flag is set', function(){
		//		mocks.options.useActualDependencies = true;
		//		getMockForDep(dep, providerData, 0);
		//		expect(injector.get).toHaveBeenCalledWith(dep);
		//	});
        //
		//	it('should use actual implementation if the mock\'s flag is set', function(){
         //       mocks.options.mocks = {};
         //       mocks.options.mocks[dep] = mocks.global.useActual();
		//		getMockForDep(dep, providerData, 0);
		//		expect(injector.get).toHaveBeenCalledWith(dep);
		//	});
        //
		//	it('should use actual implementation if the provider is a value type and a mock does not exist', function(){
		//		mocks.GetProviderType.and.returnValue(mocks.ProviderType.value);
		//		injector.has.and.callFake(function(tempDep){
         //           return tempDep === dep;
         //       });
		//		getMockForDep(dep, providerData, 0);
		//		expect(injector.get).toHaveBeenCalledWith(dep);
		//	});
        //
         //   it('should use mock if the provider is a value type and a mock exists', function(){
         //       mocks.GetProviderType.and.returnValue(mocks.ProviderType.value);
         //       getMockForDep(dep, providerData, 0);
         //       expect(providerData[2][1][0]).toEqual('___' + dep);
         //       expect(injector.get).toHaveBeenCalledWith('___' + dep);
         //   });
        //
         //   it('should use actual implementation if the provider is a constant type and a mock does not exist', function(){
         //       mocks.GetProviderType.and.returnValue(mocks.ProviderType.constant);
         //       injector.has.and.callFake(function(tempDep){
         //           return tempDep === dep;
         //       });
         //       getMockForDep(dep, providerData, 0);
         //       expect(injector.get).toHaveBeenCalledWith(dep);
         //   });
        //
         //   it('should use mock if the provider is a constant type and a mock exists', function(){
         //       mocks.GetProviderType.and.returnValue(mocks.ProviderType.constant);
         //       getMockForDep(dep, providerData, 0);
         //       expect(providerData[2][1][0]).toEqual('___' + dep);
         //       expect(injector.get).toHaveBeenCalledWith('___' + dep);
         //   });
        //
         //   it('should use mock if the provider type is unknown', function(){
         //       mocks.GetProviderType.and.returnValue(mocks.ProviderType.unknown);
         //       getMockForDep(dep, providerData, 0);
         //       expect(providerData[2][1][0]).toEqual('___' + dep);
         //       expect(injector.get).toHaveBeenCalledWith('___' + dep);
         //   });
        //
         //   it('should throw an error if the required mock does not exist', function(){
         //       injector.has.and.returnValue(false);
         //       getMockForDep(dep, providerData, 0);
         //       expect(mocks.ThrowError).toHaveBeenCalled();
         //   });
        //
		//});

        describe('getMockName', function () {
            var getMockName, mocks;

            beforeEach(function(){
                mocks = getMocks();
                module('quickmock');
                module(function($provide){
                    angular.forEach(['global','GetProviderType'], function(mock){
                        $provide.value(mock, mocks[mock]);
                    });
                });
                inject(function(_GetMockName_, ProviderType){
                    getMockName = _GetMockName_;
                    mocks.ProviderType = ProviderType;
                });
                mocks.global.mockPrefix.and.returnValue('___');
                mocks.GetProviderType.and.returnValue(mocks.ProviderType.factory);

            });

            it('should ', function(){

            });

        });

	});

})();