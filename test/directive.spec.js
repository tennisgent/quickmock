angular.module('DirectivesTestModule', [])
    .directive('upper', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="test-upper">This is the upper one<nested></nested></div>'
        };
    })
    .directive('nested', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="test-nested">This is the nested one<span></span></div>'
        };
    });

describe('Nested Directives', function () {
    var upper;

    beforeEach(function () {
        upper = quickmock({
            providerName: 'upper',
            moduleNames: ['DirectivesTestModule'],
            directivesToMock: ['nested'],
            html: '<upper></upper>'
        });
        upper.$compile();
    });

    describe('upper directive', function () {
        it('should mock out the "nested" directive', function () {
            var nestedElement = upper.$element.find('nested');
            expect(nestedElement.length).toBe(1);
            expect(nestedElement.children().length).toBe(0);
        });
    });

});
