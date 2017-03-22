(function () {
    describe('Constant provider', function () {
        angular.module('ConstantProvidersTestModule', [])
            .constant('FakeConstant', [
                { id: 1, name: 'One' },
                { id: 2, name: 'Two' },
                { id: 3, name: 'Three' }
            ])
            .service('FakeService', ['FakeConstant', function (fakeConstant) {
                return { myConstant: fakeConstant };
            }]);

        it('does not throw when attempting to be injected', function () {
            expect(function () {
                quickmock({
                    providerName: 'FakeService',
                    moduleName: 'ConstantProvidersTestModule'
                });
            }).not.toThrow();
        });
    });
}());