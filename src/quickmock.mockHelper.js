(function(){

	var origModuleFunc;

    angular.module('quickmock.mockHelper', ['quickmock'])

        .run(['decorateAngularModule', 'origModuleFunc',
            function(decorateAngularModule, origModuleFunc){
                origModuleFunc.set(angular.module);
                angular.module = decorateAngularModule;
            }
        ])

        .service('origModuleFunc', [
            function(){
                var origModuleFunc;
                return {
                    get: function(){
                        return origModuleFunc;
                    },
                    set: function(){
                        origModuleFunc = arguments[0];
                    }
                }
            }
        ])

        .service('decorateAngularModule', ['getDecoratedMethods', 'origModuleFunc',
            function(getDecoratedMethods, origModuleFunc){
                return function decorateAngularModule(name, requires, configFn){
                    var origFunc = origModuleFunc.get(),
                        modObj = origFunc(name, requires, configFn),
                        methods = getDecoratedMethods(modObj);
                    angular.forEach(methods, function(method, methodName){
                        modObj[methodName] = method;
                    });
                    return modObj;
                };
            }
        ])

        .service('getDecoratedMethods', ['global', 'ProviderType',
            function(global, providerTypes){
                return function getDecoratedMethods(modObj){
                    var decoratedMethods = {};

                    function genericMock(providerName, initFunc, providerType){
                        var newModObj = modObj[providerType](global.mockPrefix() + providerName, initFunc),
                            methods = getDecoratedMethods(newModObj);
                        angular.forEach(methods, function(method, methodName){
                            newModObj[methodName] = method;
                        });
                        return newModObj;
                    }

                    angular.forEach(providerTypes, function(type){
                        if(type !== providerTypes.unknown){
                            var mockName = 'mock' + type.charAt(0).toUpperCase() + type.slice(1);
                            decoratedMethods[mockName] = function mock(providerName, initFunc){
                                return genericMock(providerName, initFunc, type);
                            };
                        }
                    });

                    return decoratedMethods;
                };
            }
        ]);

    angular.bootstrap(angular.element('<div></div>'), ['quickmock.mockHelper']);

})();