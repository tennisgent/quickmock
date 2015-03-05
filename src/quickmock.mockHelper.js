(function(){

	var origModuleFunc;

    angular.module('quickmock.mockHelper', ['quickmock'])

        .run(['decorateAngularModule',
            function(decorateAngularModule){
                origModuleFunc = angular.module;
                angular.module = decorateAngularModule;
            }
        ])

        //.factory('origModuleFunc', )

        .service('decorateAngularModule', ['getDecoratedMethods',
            function(getDecoratedMethods){
                return function decorateAngularModule(name, requires, configFn){
                    var modObj = origModuleFunc(name, requires, configFn),
                        methods = getDecoratedMethods(modObj);
                    angular.forEach(methods, function(method, methodName){
                        modObj[methodName] = method;
                    });
                    return modObj;
                };
            }
        ])

        .service('getDecoratedMethods', ['global',
            function(global){
                return function getDecoratedMethods(modObj){

                    function basicMock(providerName, initFunc, providerType){
                        var newModObj = modObj[providerType](global.mockPrefix() + providerName, initFunc),
                            methods = getDecoratedMethods(newModObj);
                        angular.forEach(methods, function(method, methodName){
                            newModObj[methodName] = method;
                        });
                        return newModObj;
                    }

                    return {
                        mockService: function mockService(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'service', modObj);
                        },
                        mockFactory: function mockFactory(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'factory', modObj);
                        },

                        mockFilter: function mockFilter(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'filter', modObj);
                        },

                        mockController: function mockController(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'controller', modObj);
                        },

                        mockProvider: function mockProvider(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'provider', modObj);
                        },

                        mockValue: function mockValue(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'value', modObj);
                        },

                        mockConstant: function mockConstant(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'constant', modObj);
                        },

                        mockAnimation: function mockAnimation(providerName, initFunc){
                            return basicMock(providerName, initFunc, 'animation', modObj);
                        }
                    };
                };
            }
        ]);

    angular.bootstrap(angular.element('<div></div>'), ['quickmock.mockHelper']);

})();