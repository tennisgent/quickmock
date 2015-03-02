(function(){

	describe('quickmock', function () {

        angular.module('qm-mocks', [])
            .value('global', jasmine.createSpyObj('global', ['options','mockPrefix','allModules','injector','modObj','providerType','mocks','provider','useActual','muteLogs','invokeQueue']))
            .value('AssertRequiredOptions', jasmine.createSpy('AssertRequiredOptions'))
            .value('MockOutProvider', jasmine.createSpy('MockOutProvider'))
            .value('GetProviderType', jasmine.createSpy('GetProviderType'));

		describe('quickmock service', function () {
			var qm, mocks, fakeOptions = {
				providerName: 'someProvider',
				moduleName: 'someModule',
				mockModules: ['someModules']
			};

            beforeEach(function(){
                module('quickmock');
                module('qm-mocks');
                mocks = {};
                inject(function(quickmock, global, AssertRequiredOptions, MockOutProvider, GetProviderType){
                    qm = quickmock;
                    mocks.global = global;
                    mocks.AssertRequiredOptions = AssertRequiredOptions;
                    mocks.MockOutProvider = MockOutProvider;
                    mocks.GetProviderType = GetProviderType;
                });
				mocks.GetProviderType.and.returnValue('someType');
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
                mocks.AssertRequiredOptions.and.returnValue(fakeOptions);
                qm(fakeOptions);
                expect(mocks.AssertRequiredOptions).toHaveBeenCalledWith(fakeOptions);
            });

			it('should get the provider type', function(){
				qm(fakeOptions);
				expect(mocks.GetProviderType).toHaveBeenCalledWith(fakeOptions.providerName);
			});

			var global = {
				options: fakeOptions,
				allModules: fakeOptions.mockModules.concat(['ngMock']),
				injector: {},
				modObj: {_invokeQueue: ['someModule']},
				invokeQueue: ['someModule','someModules','ngMock'],
				providerType: 'someType',
				mocks: {},
				provider: {}
			};

			angular.forEach(global, function(expectedValue, property){

				it('should set the global ' + property + ' property to the proper value', function(){
					qm(fakeOptions);
					expect(mocks.global[property]).toHaveBeenCalledWith(expectedValue);
				});

			});

		});

	});

})();