(function(){

	describe('quickmock', function () {

        var qmMocks = angular.module('qm-mocks', [])
            .mockValue('global', jasmine.createSpyObj('global', ['options','mockPrefix','allModules','injector','modObj','providerType','mocks','provider','useActual','muteLogs']))
            .mockValue('AssertRequiredOptions', jasmine.createSpy('AssertRequiredOptions'))
            .mockValue('MockOutProvider', jasmine.createSpy('MockOutProvider'))
            .mockValue('GetProviderType', jasmine.createSpy('GetProviderType'));

		describe('quickmock service', function () {
			var qm;

            beforeEach(function(){
                qm = quickmock({
                    providerName: 'quickmock',
                    moduleName: 'quickmock',
                    mockModules: [qmMocks.name]
                });
            });

            it('should be a function called "quickmock"', function(){
                expect(qm).toEqual(jasmine.any(Function));
                expect(qm.toString().indexOf('function quickmock(')).toEqual(0);
            });

		});

	});

})();