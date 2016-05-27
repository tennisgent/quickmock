describe('Nested Directives', function () {
    var upper;

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

describe('Anonymous Controller Directives', function () {
    var myDirective;

    angular.module('DirectivesTestModule2', [])
        .service('SomeService', function(){
            return { doSomething: function(){} };
        })
        .service('SomeOtherService', function(){
            return { doSomethingElse: function(){} };
        })
        .service('SomeService2', function(){
            return { doSomething2: function(){} };
        })
        .mockServiceSpyObj('SomeService', ['doSomething'])
        .mockServiceSpyObj('SomeService2', ['doSomething2'])
        .mockServiceSpyObj('SomeOtherService', ['doSomethingElse'])
        .directive('myDirective', function (SomeOtherService) {
            return {
                restrict: 'E',
                replace: true,
                template: '<div ng-click="vm.incCount()">Cool Directive</div>',
                controller: function(SomeService, SomeService2){
                    var vm = this;
                    vm.count = 0;
                    vm.incCount = function(){
                        vm.count++;
                        SomeService.doSomething(vm.count);
                    };
                },
                controllerAs: 'vm'
            };
        });

    beforeEach(function () {
        myDirective = quickmock({
            providerName: 'myDirective',
            moduleNames: ['DirectivesTestModule2'],
            html: '<my-directive></my-directive>'
        });
        myDirective.$compile();
    });

    describe('myDirective directive', function () {

        it('should have a "SomeService" mock available', function () {
            expect(myDirective.$mocks.SomeService).toBeDefined();
            expect(myDirective.$mocks.SomeService.doSomething).toEqual(jasmine.any(Function));
        });

        it('should have a "SomeService2" mock available', function () {
            expect(myDirective.$mocks.SomeService2).toBeDefined();
            expect(myDirective.$mocks.SomeService2.doSomething2).toEqual(jasmine.any(Function));
        });

        it('should have a "SomeOtherService" mock available', function () {
            expect(myDirective.$mocks.SomeOtherService).toBeDefined();
            expect(myDirective.$mocks.SomeOtherService.doSomethingElse).toEqual(jasmine.any(Function));
        });

        it('should call doSomething() when clicked', function () {
            expect(myDirective.$ctrl.count).toBe(0);
            myDirective.$element[0].click();
            expect(myDirective.$ctrl.count).toBe(1);
        });

        it('should call the SomeService mock', function() {
            expect(myDirective.$mocks.SomeService.doSomething).not.toHaveBeenCalled();
            myDirective.$element[0].click();
            expect(myDirective.$mocks.SomeService.doSomething).toHaveBeenCalledWith(1);
        });

    });

});
