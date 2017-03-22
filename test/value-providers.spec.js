(function () {
    describe('Value provider', function () {
        angular.module('ValueProvidersTestModule', [])
            .constant('FakeValue', [
                { id: 1, name: 'One' },
                { id: 2, name: 'Two' },
                { id: 3, name: 'Three' }
            ])
            .service('FakeService', ['FakeValue', function (fakeValue) {
                return { myValue: fakeValue };
            }]);

        it('does not throw when attempting to be injected', function () {
            expect(function () {
                quickmock({
                    providerName: 'FakeService',
                    moduleName: 'ValueProvidersTestModule'
                });
            }).not.toThrow();
        });
    });
}());