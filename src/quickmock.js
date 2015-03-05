(function(angular){

	angular.module('quickmock', ['ngMock'])

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
					return options;
				}
			}
		])

		.service('MockOutProvider', ['global','GetAllMocksForProvider','SetupDirective','SetupInitializer','SanitizeProvider',
			function(global, getAllMocksForProvider, setupDirective, setupInitializer, sanitizeProvider){
				return function mockOutProvider(){
					var provider = {};
					if(global.providerType()){
						global.mocks(getAllMocksForProvider(global.options().providerName));
                        provider = setupInitializer();
					}
					angular.forEach(global.invokeQueue(), function(providerData) {
						sanitizeProvider(providerData);
					});
					return provider;
				}
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

		.service('InitializeProvider', ['global','ProviderType','SetupDirective',
			function(global, ProviderType, setupDirective){
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
                            return setupDirective();
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

		.service('GetMockForDependency', ['global','GetProviderType','QuickmockLog','ProviderType',
			function(global, getProviderType, quickmockLog, ProviderType){
				return function getMockForDependency(depName, providerData, i){
					var opts = global.options(),
						injector = global.injector(),
						mockPrefix = global.mockPrefix(),
						depType = getProviderType(depName),
						mockServiceName = depName;
					if(opts.mocks[mockServiceName] && opts.mocks[mockServiceName] === global.useActual()){
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

		.service('SetupDirective', ['global','QuickmockCompile','$rootScope',
			function(global, quickmockCompile, $rootScope){
				return function setupDirective(){
					var provider = {};
					provider.$scope = $rootScope.$new();
					provider.$mocks = global.mocks();
					provider.$compile = quickmockCompile(provider);
					return provider;
				};
			}
		])

		.service('QuickmockCompile', ['global', 'GenerateHtmlStringFromObject','PrefixProviderDependencies','UnprefixProviderDependencies',
			function(global, generateHtmlStringFromObject, prefixProviderDependencies, unprefixProviderDependencies){
				return function(provider){
					return function quickmockCompile(html){
						var opts = global.options(),
                            $compile = global.injector().get('$compile');
						html = html || opts.html;
						if(!html){
							throw new Error('quickmock: Cannot compile "' + opts.providerName + '" directive. No html string/object provided.');
						}
						if(angular.isObject(html)){
							html = generateHtmlStringFromObject(html);
						}
						provider.$element = angular.element(html);
						prefixProviderDependencies(opts.providerName);
						$compile(provider.$element)(provider.$scope);
						unprefixProviderDependencies(opts.providerName);
						provider.$isoScope = provider.$element.isolateScope();
						provider.$scope.$digest();
					};
				};
			}
		])

		.service('SanitizeProvider', ['global',
			function(global){
				return function sanitizeProvider(providerData){
					var mockPrefix = global.mockPrefix();
					if(angular.isString(providerData[2][0]) && providerData[2][0].indexOf(mockPrefix) === -1){
						if(angular.isFunction(providerData[2][1])){
							// provider declaration function has been provided without the array annotation,
							// so we need to annotate it so the invokeQueue can be prefixed
							var annotatedDependencies = global.injector().annotate(providerData[2][1]);
							delete providerData[2][1].$inject;
							annotatedDependencies.push(providerData[2][1]);
							providerData[2][1] = annotatedDependencies;
						}
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