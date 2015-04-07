(function(angular){

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

        .service('AnnotateFunction', ['$injector','global','Metadata','ProviderType',
            function($injector, global, metadata, ProviderType){
                return function annotateFunction(initFunc, prefixDeps){
                    var annotatedDependencies;
                    if(angular.isFunction(initFunc)){
                        annotatedDependencies = $injector.annotate(initFunc);
                        delete initFunc.$inject;
                        annotatedDependencies.push(initFunc);
                    }else if(angular.isArray(initFunc)){
                        annotatedDependencies = initFunc;
                    }else{
                        return initFunc;
                    }
					if(prefixDeps){
						for(var i=0; i<annotatedDependencies.length-1; i++){
							var depName = annotatedDependencies[i],
								depType = metadata.get(depName, 'type');
							if(depType !== ProviderType.value && depType !== ProviderType.constant){
								annotatedDependencies[i] = global.mockPrefix() + depName;
							}
						}
					}
                    return annotatedDependencies;
                };
            }
        ])

        .service('decorateDirective', ['AnnotateFunction','Metadata','ProviderType','global',
            function(annotateFunction, metadata, ProviderType, global){
                return function decorateDirective(modObj){
                    var directiveFunc = modObj.directive;
                    modObj.directive = function(providerName, initFunc){
                        var annotatedDependencies = annotateFunction(initFunc, true),
                            origFunc = annotatedDependencies.pop();
						metadata.set(providerName, 'type', ProviderType.directive);
                        annotatedDependencies.push(function directiveWrapper(){
                            var defObj = origFunc.apply(origFunc, arguments);
							if(defObj.controller){
								if(angular.isFunction(defObj.controller) || angular.isArray(defObj.controller)){
									defObj.controller = annotateFunction(defObj.controller, true);
								}else if(angular.isString(defObj.controller)){
									var ctrlName = defObj.controller;
									if(ctrlName.indexOf(' as ') !== -1){
										ctrlName = ctrlName.split(' as ')[0].trim();
									}
									var ctrlDeps = metadata.get(ctrlName, 'dependencies');
									angular.forEach(ctrlDeps, function(dep, i){
										if(angular.isString(dep)){
											ctrlDeps[i] = global.modPrefix() + dep;
										}
									});
								}
								metadata.set(providerName, 'controller', defObj.controller);
							}

                            return defObj;
                        });
						metadata.set(providerName, 'dependencies', annotatedDependencies);
                        return directiveFunc(providerName, annotatedDependencies);
                    };
                }
            }
        ])

        .service('decorateAllMethods', ['decorateDirective','AnnotateFunction','ProviderType','Metadata',
            function(decorateDirective, annotateFunction, types, metadata){
                return function decorateStandardMethod(modObj){
                    var methods = [types.service, types.factory, types.controller,
                        types.filter, types.provider, types.animation];
                    angular.forEach(methods, function(method){
                        if(modObj[method].name !== 'quickmockWrapper'){
							var origMethod = modObj[method];
                            modObj[method] = function quickmockWrapper(providerName, initFunc){
								var annotatedDependencies = annotateFunction(initFunc);
								metadata.set(providerName, 'type', types[method]);
								metadata.set(providerName, 'dependencies', annotatedDependencies);
                                return origMethod(providerName, annotatedDependencies);
                            };
                        }
                    });
                    decorateDirective(modObj);
                };
            }
        ])

        .service('decorateAngularModule', ['getDecoratedMethods', 'origModuleFunc', 'decorateAllMethods',
            function(getDecoratedMethods, origModuleFunc, decorateAllMethods){
                return function decorateAngularModule(name, requires, configFn){
                    var origFunc = origModuleFunc.get(),
                        modObj = origFunc(name, requires, configFn),
                        methods = getDecoratedMethods(modObj);
                    angular.forEach(methods, function(method, methodName){
                        modObj[methodName] = method;
                    });
                    decorateAllMethods(modObj);
                    return modObj;
                };
            }
        ])

        .service('getDecoratedMethods', ['global', 'ProviderType', 'decorateAllMethods','Metadata',
            function(global, providerTypes, decorateAllMethods, metadata){
                return function getDecoratedMethods(modObj){
                    var decoratedMethods = {};

                    function genericMock(providerName, initFunc, providerType){
                        var newModObj = modObj[providerType](global.mockPrefix() + providerName, initFunc),
                            methods = getDecoratedMethods(newModObj);
                        angular.forEach(methods, function(method, methodName){
                            newModObj[methodName] = method;
                        });
                        decorateAllMethods(modObj);
                        return newModObj;
                    }

                    angular.forEach(providerTypes, function(type){
                        if(type !== providerTypes.unknown){
                            var mockName = 'mock' + type.charAt(0).toUpperCase() + type.slice(1);
                            decoratedMethods[mockName] = function mock(providerName, initFunc){
								metadata.set(providerName, 'mock', initFunc);
                                return genericMock(providerName, initFunc, type);
                            };
                        }
                    });

                    return decoratedMethods;
                };
            }
        ]);


	angular.module('quickmock', ['ngMock', 'quickmock.mockHelper'])

		.run(['quickmock','global',
			function(quickmock, global){
				quickmock.setMockPrefix = global.mockPrefix;
				quickmock.getMockPrefix = global.mockPrefix;
				quickmock.muteLogs = global.muteLogs;
				quickmock.getMockName = function getMockName(providerName){
					return global.mockPrefix() + providerName;
				};
				window.quickmock = quickmock;
			}
		])

		.factory('global', [
			function() {
                var methods = {},
					globalVars = {
						options: null,
						mockPrefix: '___',
						allModules: null,
						injector: null,
						modObj: null,
						providerType: null,
						mocks: null,
						provider: null,
						useActual: 'USE_ACTUAL_IMPLEMENTATION',
						muteLogs: false
					};
				angular.forEach(globalVars, function(globalVar, globalVarName){
					methods[globalVarName] = function(){
						return arguments.length ? (globalVars[globalVarName] = arguments[0]) : globalVars[globalVarName];
					}
				});
				methods.invokeQueue = function () {
					return arguments.length ? (globalVars.modObj._invokeQueue = arguments[0]) : globalVars.modObj._invokeQueue;
				};
				return methods;
			}
		])

		.factory('Metadata', ['global',
			function Metadata(global){
				var metadata = {};
				return {
					metadata: metadata,
					get: function get(providerName, property){
						providerName = providerName.replace(global.mockPrefix(),'');
						return metadata[providerName] && property
							? metadata[providerName][property]
							: (metadata[providerName] || {});
					},
					set: function set(providerName, property, value){
						providerName = providerName.replace(global.mockPrefix(),'');
						metadata[providerName] = metadata[providerName] || {};
						if(property && value){
							return metadata[providerName][property] = value;
						}else if(property){
							return metadata[providerName] = property;
						}
					}
				};
			}
		])

		.service('quickmock', ['global','AssertRequiredOptions', 'MockOutProvider','GetProviderType',
			function(global, assertRequiredOptions, mockOutProvider, getProviderType){
				return function quickmock(opts){
					var options = assertRequiredOptions(opts),
						allModules = opts.mockModules.concat(['ngMock']),
                        injector = angular.injector(allModules.concat([opts.moduleName])),
						modObj = angular.module(opts.moduleName),
						invokeQueue = modObj._invokeQueue || [];

					angular.forEach(allModules || [], function(modName){
						invokeQueue = invokeQueue.concat(angular.module(modName)._invokeQueue);
					});

					global.options(options);
					global.allModules(allModules);
					global.injector(injector);
					global.modObj(modObj);
					global.invokeQueue(invokeQueue);
					global.providerType(getProviderType(opts.providerName));
					global.mocks({});
					global.provider({});

					return mockOutProvider();
				};
			}
		])

        .service('GetFromInvokeQueue', ['global',
            function(global){
                return function getFromInvokeQueue(providerName){
                    var invokeQueue = global.invokeQueue();
                    for(var i=0; i<invokeQueue.length; i++){
                        var providerData = invokeQueue[i];
                        if (providerData[2][0] === providerName) {
                            return providerData;
                        }
                    }
                };
            }
        ])

		.service('AssertRequiredOptions', ['$window','ErrorMessages','ThrowError',
			function($window, ErrorMessages, throwError){
				return function assertRequiredOptions(options){
					if(!$window.angular){
						throwError(ErrorMessages.noAngular);
					}
					if(!options.providerName && !options.configBlocks && !options.runBlocks){
						throwError(ErrorMessages.noProviderName);
					}
					if(!options.moduleName){
						throwError(ErrorMessages.noModuleName);
					}
					options.mockModules = options.mockModules || [];
					options.mocks = options.mocks || {};
					options.inject = options.inject || null;
					return options;
				}
			}
		])

		.service('MockOutProvider', ['global','GetAllMocksForProvider','SetupInitializer','SanitizeProvider','ProviderType','InjectOptionalValues',
			function(global, getAllMocksForProvider, setupInitializer, sanitizeProvider, ProviderType, injectOptionalValues){
				return function mockOutProvider(){
					var provider = {};
                    angular.forEach(global.invokeQueue(), function(providerData) {
                        sanitizeProvider(providerData);
                    });
					if(global.providerType() !== ProviderType.unknown){
						var mocks = getAllMocksForProvider(global.options().providerName);
						global.mocks(mocks);
                        provider = setupInitializer();
						provider.$injector = global.injector();
						injectOptionalValues();
					}
					angular.forEach(global.invokeQueue(), function(providerData) {
						sanitizeProvider(providerData);
					});
					return provider;
				}
			}
		])

		.service('InjectOptionalValues', ['global','ThrowError',
			function(global, throwError){
				return function InjectOptionalValues(){
					var injector = global.injector(),
						injectOption = global.options().inject;
					if(angular.isFunction(injectOption)){
						var annotatedDeps = injector.annotate(injectOption) || [],
							injectedDeps = [];
						if(annotatedDeps.length){
							angular.forEach(annotatedDeps, function(depName){
								if(injector.has(depName)){
									injectedDeps.push(injector.get(depName))
								}else{
									throwError('quickmock: cannot inject provider ' + depName + ' because provider doesn\'t exist');
								}
							});
							injectOption.apply(injectOption, injectedDeps);
						}
					}
				};
			}
		])

		.service('SetupInitializer', ['global','InitializeProvider','SpyOnProviderMethods',
			function(global, initializeProvider, spyOnProviderMethods){
				return function setupInitializer(){
					var provider = initializeProvider();
					if(global.options().spyOnProviderMethods){
						spyOnProviderMethods(provider);
					}
					provider.$mocks = global.mocks();
					provider.$initialize = setupInitializer;
					return provider;
				};
			}
		])

		.service('InitializeProvider', ['global','ProviderType','QuickmockCompile',
			function(global, ProviderType, quickmockCompile){
				return function initializeProvider(){
					var providerName = global.options().providerName;
					switch(global.providerType()){
						case ProviderType.controller:
                            var $controller = global.injector().get('$controller');
							return $controller(providerName, global.mocks());
						case ProviderType.filter:
                            var $filter = global.injector().get('$filter');
							return $filter(providerName);
                        case ProviderType.directive:
							var provider = {},
								$rootScope = global.injector().get('$rootScope');
							provider.$scope = $rootScope.$new();
							provider.$mocks = global.mocks();
							provider.$compile = quickmockCompile(provider);
							return provider;
						default:
							return global.injector().get(providerName);
					}
				};
			}
		])

		.service('GetAllMocksForProvider', ['global', 'GetMockForDependency','GetFromInvokeQueue',
			function(global, getMockForDependency, getFromInvokeQueue){
				return function getAllMocksForProvider(providerName){
					var mocks = {},
						providerData = getFromInvokeQueue(providerName),
						currProviderDeps = providerData[2][1];
					for(var i=0; i<currProviderDeps.length - 1; i++){
						var depName = currProviderDeps[i];
						mocks[depName] = getMockForDependency(depName, providerData, i);
					}
					return mocks;
				};
			}
		])

	/**
	 * Propogate dependencies in the directive's controller up to the directive
	 * So the $mocks object contains refs to the controller's deps
	 */

		.service('GetMockForDependency', ['global','GetProviderType','QuickmockLog','ProviderType',
			function(global, getProviderType, quickmockLog, ProviderType){
				return function getMockForDependency(depName, providerData, i){
					var opts = global.options(),
						injector = global.injector(),
						mockPrefix = global.mockPrefix(),
						depType = getProviderType(depName),
						mockServiceName = depName;
					if(opts.useActualDependencies === true || opts.mocks[mockServiceName] === global.useActual()){
						quickmockLog('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
					}else if(depType === ProviderType.value || depType === ProviderType.constant){
						if(injector.has(mockPrefix + depName)){
							mockServiceName = mockPrefix + depName;
							providerData[2][1][i] = mockServiceName;
						}else{
							quickmockLog('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
						}
					}else if(depName.indexOf(mockPrefix) !== 0 || depType === ProviderType.unknown){
						mockServiceName = mockPrefix + depName;
                        providerData[2][1][i] = mockServiceName;
					}
					if(!injector.has(mockServiceName)){
						if(opts.useActualDependencies){
							quickmockLog('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
							mockServiceName = mockServiceName.replace(mockPrefix, '');
						}else {
							throw new Error('quickmock: Cannot inject mock for "' + depName + '" because no such mock exists. Please write a mock ' + depType + ' called "'
							+ mockServiceName + '" (or set the useActualDependencies to true) and try again.');
						}
					}
					return global.injector().get(mockServiceName);
				};
			}
		])

		.service('QuickmockCompile', ['global', 'GenerateHtmlStringFromObject','PrefixProviderDependencies','UnprefixProviderDependencies','Metadata',
			function(global, generateHtmlStringFromObject, prefixProviderDependencies, unprefixProviderDependencies, metadata){
				return function(directive){
					return function quickmockCompile(html){
						var opts = global.options(),
                            $compile = global.injector().get('$compile');
						if(!(html = html || opts.html)){
							throw new Error('quickmock: Cannot compile "' + opts.providerName + '" directive. No html string/object provided.');
						}
						if(angular.isObject(html)){
							html = generateHtmlStringFromObject(html);
						}
						directive.$element = angular.element(html);
						prefixProviderDependencies(opts.providerName);

						console.log(metadata);

						$compile(directive.$element)(directive.$scope);

						unprefixProviderDependencies(opts.providerName);
						directive.$isoScope = directive.$element.isolateScope();
						directive.$localScope = directive.$element.scope();
						directive.$scope.$digest();
					};
				};
			}
		])

		.service('SanitizeProvider', ['global',
			function(global){
				return function sanitizeProvider(providerData){
					var mockPrefix = global.mockPrefix();
					if(angular.isString(providerData[2][0]) && providerData[2][0].indexOf(mockPrefix) === -1){
						var currProviderDeps = providerData[2][1];
						if(angular.isArray(currProviderDeps)){
							for(var i=0; i<currProviderDeps.length - 1; i++){
								if(currProviderDeps[i].indexOf(mockPrefix) === 0){
									currProviderDeps[i] = currProviderDeps[i].replace(mockPrefix, '');
								}
							}
						}
					}
				};
			}
		])

		.service('SpyOnProviderMethods', ['SpyOnProviderMethod',
			function(spyOnProviderMethod){
				return function spyOnProviderMethods(provider){
					angular.forEach(provider, function(property, propertyName){
						if(angular.isFunction(property)){
							spyOnProviderMethod(property, propertyName);
						}
					});
				};
			}
		])

		.service('SpyOnProviderMethod', ['$window',
			function(){
				return function spyOnProviderMethod(method, methodName){
					if($window.jasmine && $window.spyOn && !method.calls){
						var spy = spyOn(method, methodName);
						spy.andCallThrough ? spy.andCallThrough() : spy.and.callThrough();
					}else if($window.sinon && $window.sinon.spy){
						sinon.spy(provider, propertyName);
					}
				}
			}
		])

		.service('GetProviderType', ['global','ProviderType','GetFromInvokeQueue',
			function(global, ProviderType, getFromInvokeQueue){
				return function getProviderType(providerName){
					var providerData = getFromInvokeQueue(providerName);
                    switch(providerData && providerData[0]){
                        case '$provide':
                            return providerData[1];
                        case '$controllerProvider':
                            return ProviderType.controller;
                        case '$compileProvider':
                            return ProviderType.directive;
                        case '$filterProvider':
                            return ProviderType.filter;
                        case '$animateProvider':
                            return ProviderType.animation;
                    }
					return ProviderType.unknown;
				};
			}
		])

		.value('ProviderType', {
			factory: 'factory',
			directive: 'directive',
			service: 'service',
			value: 'value',
			constant: 'constant',
            controller: 'controller',
            filter: 'filter',
            animation: 'animation',
            provider: 'provider',
            unknown: 'unknown'
		})

		.service('PrefixProviderDependencies', ['global','GetFromInvokeQueue',
			function(global, getFromInvokeQueue){
				return function prefixProviderDependencies(providerName, unprefix){
                    if(providerName.indexOf(global.mockPrefix()) === 0){
                        return false;
                    }
					var mockPrefix = global.mockPrefix(),
                        providerData = getFromInvokeQueue(providerName),
                        currProviderDeps = providerData[2][1];
                    if(angular.isArray(currProviderDeps)){
                        for(var i=0; i<currProviderDeps.length - 1; i++){
                            if(unprefix){
                                currProviderDeps[i] = currProviderDeps[i].replace(mockPrefix, '');
                            }else if(currProviderDeps[i].indexOf(mockPrefix) !== 0){
                                currProviderDeps[i] = mockPrefix + currProviderDeps[i];
                            }
                        }
                    }
				};
			}
		])

		.service('UnprefixProviderDependencies', ['PrefixProviderDependencies',
			function(prefixProviderDependencies){
				return function unprefixProviderDependencies(providerName){
					prefixProviderDependencies(providerName, true);
				};
			}
		])

		.service('GenerateHtmlStringFromObject', ['global','ToSnakeCase',
			function(global, toSnakeCase){
				return function generateHtmlStringFromObject(htmlObj){
					if(!htmlObj.$tag){
						throw new Error('quickmock: Cannot compile "' + global.options().providerName + '" directive. Html object does not contain $tag property.');
					}
					var htmlAttrs = htmlObj,
						tagName = htmlAttrs.$tag,
						htmlContent = htmlAttrs.$content,
						htmlStr = '';
					htmlStr = '<' + tagName + ' ';
					angular.forEach(htmlAttrs, function(val, attr){
						if(attr !== '$content' && attr !== '$tag'){
							htmlStr += toSnakeCase(attr) + (val ? ('="' + val + '" ') : ' ');
						}
					});
					htmlStr += htmlContent ? ('>' + htmlContent) : '>';
					htmlStr += '</' + tagName + '>';
					return htmlStr;
				};
			}
		])

		.service('QuickmockLog', ['global','$log',
			function(global, $log){
				return function quickmockLog(){
					if(!global.muteLogs()){
						$log.warn.apply(this, arguments);
					}
				};
			}
		])

		.service('ToSnakeCase', [
			function(){
				var SNAKE_CASE_REGEXP = /[A-Z]/g;
				return function snake_case(name, separator) {
					separator = separator || '-';
					return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
						return (pos ? separator : '') + letter.toLowerCase();
					});
				};
			}
		])

		.value('ErrorMessages', {
			noAngular: 'quickmock: Cannot initialize because angular is not available. Please load angular before loading quickmock.js.',
			noProviderName: 'quickmock: No providerName given. You must give the name of the provider/service you wish to test, or set the configBlocks or runBlocks flags.',
			noModuleName: 'quickmock: No moduleName given. You must give the name of the module that contains the provider/service you wish to test.'
		})

		.service('ThrowError', function(){
			return function throwError(){
				var msg = arguments[0];
				if(arguments.length > 1){
					for(var i=1; i<arguments.length; i++){
						msg.replace('{'+i+'}', arguments[i]);
					}
				}
				throw new Error(msg);
			}
		});

	angular.bootstrap(angular.element('<div></div>'), ['quickmock']);

})(window.angular);