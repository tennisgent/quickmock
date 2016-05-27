(function(){
	var origModuleFn,
		$injector = null,
		logMode = null,
		metadata = {
			configBlocks: [],
			runBlocks: [],
			tempMocks: {}
		};

	var constants = {
			PREFIX: '___'
		},
		providers = {
			provider: 'provider',
			factory: 'factory',
			service: 'service',
			value: 'value',
			constant: 'constant',
			decorator: 'decorator',
			animation: 'animation',
			filter: 'filter',
			controller: 'controller',
			directive: 'directive',
			component: 'component',
			config: 'config',
			run: 'run'
		},
		excludedProviders = {
			directive: 'directive',
			//component: 'component',
			value: 'value',
			constant: 'constant',
			config: 'config',
			run: 'run'
		};

	quickmock.log = {
		DEBUG: 'DEBUG',
		WARN: 'WARN',
		NONE: 'NONE'
	};

	quickmock.USE_ACTUAL = 'USE_ACTUAL';

	quickmock._metadata = metadata;

	quickmock.setLogMode = function quickmockSetDebugMode(mode){
		if(quickmock.log[mode]){
			logMode = mode;
		}
	};

	quickmock.setLogMode(quickmock.log.NONE);

	return window.quickmock = initQuickmock();

	function quickmock(options){
		if(!options.providerName || !(options.moduleNames || options.moduleName) || !metadata[options.providerName]) return false;

		options.moduleNames = getAllModuleNames(options);

		$injector = angular.injector(options.moduleNames, options.strictDi || false);

		if(angular.isFunction(options.inject)){
			$injector.invoke(options.inject);
		}

		var meta = metadata[options.providerName];
		meta.mocks = {};

		setupProviderMocks(meta.dependencies, meta.mockedDependencies, meta, options);

		if(angular.isFunction(options.beforeInit)){
			options.beforeInit(meta.mocks);
		}

		var provider = initProviderForTesting(options.providerName, options);

		provider.$mocks = meta.mocks;

		return provider;
	}

	function initQuickmock(){
		if(!window.angular) return false;

		$injector = angular.injector();

		origModuleFn = angular.module;
		angular.module = moduleWrapper;
		return quickmock;
	}

	function initProvider(providerName, options){
		if(!providerName) return;
		var meta = metadata[providerName];
		if(!meta){
			throwError('QUICKMOCK: unknown provider', providerName);
		}
		switch(meta.type){
			case providers.controller:
				var $controller = $injector.get('$controller');
				return $controller(providerName, meta.mocks);
			case providers.filter:
				var $filter = $injector.get('$filter');
				return $filter(providerName);
			case providers.directive:
				return initDirective(options);
			default:
				return $injector.get(providerName);
		}
	}

	function initProviderForTesting(providerName, options){
		var meta = metadata[providerName];

		if(angular.isFunction(meta.configFn)){
			meta.configFn.$inject = meta.mockedDependencies;
		}

		var provider = initProvider(providerName, options);

		if(angular.isFunction(meta.configFn)){
			meta.configFn.$inject = meta.dependencies;
		}

		return provider;
	}

	function initDirective(options){
		var meta = metadata[options.providerName],
			$compile = $injector.get('$compile'),
			directive = {
				$scope: $injector.get('$rootScope').$new()
			};

		directive.$compile = function compileDirective(html){
			html = html || options.html;
			if(!html || !angular.isString(html)){
				throwError('QUICKMOCK: Cannot compile "', options.providerName, '" directive. No html string provided.');
			}
			directive.$element = angular.element(html);

			meta.configFn.$inject = meta.mockedDependencies;
			if(meta.controllerName){
				metadata[meta.controllerName].configFn.$inject = meta.controllerMockedDependencies;
			}

			$compile(directive.$element)(directive.$scope);

			meta.configFn.$inject = meta.dependencies;
			if(meta.controllerName){
				metadata[meta.controllerName].configFn.$inject = meta.controllerDependencies;
			}

			directive.$isoScope = directive.$element.isolateScope();
			directive.$ctrl = directive.$element.controller(options.providerName);
			(directive.$isoScope || directive.$scope).$digest();

			if(meta.controllerDependencies){
				setupProviderMocks(meta.controllerDependencies, meta.controllerMockedDependencies, meta, options);
			}
		};

		return directive;
	}

	function moduleWrapper(modName, requires, configFn){
		if(modName === 'ng') return false;
		var mod = origModuleFn(modName, requires, configFn),
			origValue = mod.value,
			origConstant = mod.constant,
			origDirective = mod.directive;

		angular.forEach(providers, function(methodName){
			if(!excludedProviders[methodName] && angular.isFunction(mod[methodName])){
				var origMethod = mod[methodName],
					mockMethodName = 'mock' + methodName.charAt(0).toUpperCase() + methodName.slice(1);
				mod[mockMethodName] = wrapProviderMockDefinition(methodName, origMethod, mod);
				mod[methodName] = wrapProviderDefinition(methodName, origMethod, mod);
				mod[mockMethodName + 'Spy'] = wrapProviderMockSpyDefinition(mod[mockMethodName]);
				mod[mockMethodName + 'SpyObj'] = wrapProviderMockSpyObjDefinition(mod[mockMethodName]);
			}
		});

		mod.useActual = wrapProviderActualImplementation(mod.mockFactory);

		mod.directive = wrapDirectiveDefinition('directive', origDirective, mod);

		mod.mockValue = wrapProviderMockDefinition('value', origValue, mod);
		mod.mockConstant = wrapProviderMockDefinition('constant', origConstant, mod);

		mod.value = wrapValueOrConstant('value', origValue, mod);
		mod.constant = wrapValueOrConstant('constant', origConstant, mod);

		mod.run = wrapConfigOrRunBlock('run', mod);
		mod.config = wrapConfigOrRunBlock('config', mod);

		return mod;
	}

	function wrapProviderDefinition(methodName, callthrough, module){
		return function providerDefinition(name, configFn){
			var deps = $injector.annotate(configFn),
				mockedDeps = angular.copy(deps)
					.map(function(dep){
						return constants.PREFIX + dep;
					});
			configFn = angular.isArray(configFn) ? configFn[configFn.length-1] : configFn;
			configFn.$inject = deps;
			angular.extend(metadata[name] = metadata[name] || {}, {
				name: name,
				type: methodName,
				moduleName: module.name,
				dependencies: deps,
				mockedDependencies: mockedDeps,
				configFn: configFn,
				mockName: constants.PREFIX + name
			});

			return callthrough(name, configFn);
		};
	}

	function wrapDirectiveDefinition(methodName, callthrough, module){
		return function directiveDefinition(name, configFn){
			var deps = $injector.annotate(configFn),
				mockedDeps = angular.copy(deps)
					.map(function(dep){
						return constants.PREFIX + dep;
					});
			configFn = angular.isArray(configFn) ? configFn[configFn.length-1] : configFn;
			angular.extend(metadata[name] = metadata[name] || {}, {
				name: name,
				type: methodName,
				moduleName: module.name,
				dependencies: deps,
				mockedDependencies: mockedDeps,
				configFn: configFn,
				mockName: constants.PREFIX + name
			});

			var wrapper = wrapDirectiveDefinitionObject(name, configFn);
			wrapper.$inject = deps;
			return callthrough(name, wrapper);
		};
	}

	function wrapDirectiveDefinitionObject(name, configFn){
		return function directiveDefinition(){
			var result = configFn.apply(configFn, arguments),
				meta = metadata[name];
			if(result.controller){
				if(angular.isString(result.controller)){
					var ctrlMeta = metadata[result.controller];
					meta.dependencies = meta.dependencies.concat(ctrlMeta.dependencies);
					meta.mockedDependencies = meta.mockedDependencies.concat(ctrlMeta.mockedDependencies);
					meta.controllerName = result.controller;
					meta.controllerDependencies = ctrlMeta.dependencies;
					meta.controllerMockedDependencies = ctrlMeta.mockedDependencies;
				}else{
					var ctrlFn = angular.isArray(result.controller) ? result.controller[result.controller.length - 1] : result.controller,
						deps = $injector.annotate(ctrlFn),
						mockedDeps = angular.copy(deps)
							.map(function(dep){
								return constants.PREFIX + dep;
							});
					meta.dependencies = meta.dependencies.concat(deps);
					meta.mockedDependencies = meta.mockedDependencies.concat(mockedDeps);
					meta.controllerDependencies = deps;
					meta.controllerMockedDependencies = angular.copy(mockedDeps);
					mockedDeps.push(ctrlFn);
					result.controller = mockedDeps;
				}
			}
			return result;
		}
	}

	function wrapConfigOrRunBlock(configOrRun, module){
		var callthrough = module[configOrRun];
		return function configOrRunBlock(configFn){
			var deps = $injector.annotate(configFn),
				mockedDeps = angular.copy(deps)
					.map(function(dep){
						return constants.PREFIX + dep;
					});
			configFn = angular.isArray(configFn) ? configFn[configFn.length-1] : configFn;
			configFn.$inject = deps;
			metadata[configOrRun + 'Blocks'].push({
				type: configOrRun,
				moduleName: module.name,
				dependencies: deps,
				mockedDependencies: mockedDeps,
				configFn: configFn
			});
			callthrough(configFn);
			return module;
		};
	}

	function wrapValueOrConstant(valueOrConst, callthrough, module){
		return function valueOrConstant(name, value){
			angular.extend(metadata[name] = metadata[name] || {}, {
				name: name,
				type: valueOrConst,
				moduleName: module.name,
				value: value,
				mockName: constants.PREFIX + name
			});
			return callthrough(name, value);
		};
	}

	function wrapProviderMockDefinition(type, callthrough, module){
		return function providerMockDefinition(name, configFn){
			var mockName = constants.PREFIX + name,
				deps = [];
			if(type !== providers.value && type !== providers.constant && angular.isFunction(configFn)){
				deps = $injector.annotate(configFn);
				configFn = angular.isArray(configFn) ? configFn[configFn.length-1] : configFn;
				configFn.$inject = deps;
			}
			angular.extend(metadata[mockName] = metadata[mockName] || {}, {
				isMock: true,
				name: mockName,
				configFn: configFn,
				isMockFor: name,
				type: type,
				dependencies: deps,
				mockDependencies: angular.copy(deps),
				moduleName: module.name,
				mockName: mockName
			});
			return callthrough(mockName, configFn);
		};
	}

	function wrapProviderMockSpyDefinition(callthrough){
		return function providerMockSpyDefinition(name, optionalCallback){
			if(!window.jasmine || !window.jasmine.createSpy){
				throwError('QUICKMOCK: cannot define mock spy for "' + name + '" because window.jasmine.createSpy is not a function');
			}
			return callthrough(name, function(){
				var spy = window.jasmine.createSpy(name),
					callbackResult = null;
				if(angular.isFunction(optionalCallback)){
					callbackResult = optionalCallback(spy);
				}
				return callbackResult || spy;
			});
		}
	}

	function wrapProviderMockSpyObjDefinition(callthrough){
		return function providerMockSpyObjDefinition(name, methods, optionalCallback){
			if(!window.jasmine || !window.jasmine.createSpyObj){
				throwError('QUICKMOCK: cannot define mock spy object for "' + name + '" because window.jasmine.createSpyObj is not a function');
			}
			return callthrough(name, function(){
				var spyObj = window.jasmine.createSpyObj(name, methods),
					callbackResult = null;
				if(angular.isFunction(optionalCallback)){
					callbackResult = optionalCallback(spyObj);
				}
				return callbackResult || spyObj;
			});
		}
	}

	function wrapProviderActualImplementation(callthrough){
		return function providerMockActualImplementation(name, optionalCallback){
			var configFn = function(dependency){
				var callbackResult = null;
				if(angular.isFunction(optionalCallback)){
					callbackResult = optionalCallback(dependency);
				}
				return callbackResult || dependency;
			};
			configFn.$inject = [name];
			return callthrough(name, configFn);
		}
	}

	function handleTemporaryMocks(mocks){
		var mod = angular.module('quickmockTempMocks_' + new Date().getTime(), []);
		angular.forEach(mocks, function(mock, name){
			if(mock === quickmock.USE_ACTUAL){
				mod.useActual(name);
			}else{
				var meta = (metadata[name] = metadata[name] || {}),
					tempMockName = constants.PREFIX + 'temp_' + name;
				meta.hasMock = true;
				meta.tempMock = mock;
				meta.tempMockName = tempMockName;
				mod.constant(tempMockName, mock);
			}
		});
		return mod;
	}

	function handleDirectiveMocks(dirsToMock){
		var mod = angular.module('quickmockDirectiveMocks_' + new Date().getTime(), []);
		angular.forEach(dirsToMock, function(directiveName){
			mod.factory(directiveName + 'Directive', function(){
				return {};
			});
		});
		return mod;
	}

	function setupProviderMocks(dependencies, mockedDependencies, meta, options){
		angular.forEach(dependencies, function(depName, i){
			var depMeta = metadata[depName];
			if(!depMeta){
				debug('quickmock: metadata for dependency', depName, 'is unknown');
				if(metadata[constants.PREFIX + depName]){
					debug('quickmock: switching dependency', depName, 'to its mocked version');
					depMeta = metadata[constants.PREFIX + depName];
				}else{
					throw new Error('quickmock: unknown dependency "' + depName + '"');
				}
			}
			if(options.mocks && depMeta.tempMock){
				debug('quickmock: setting mock for', options.providerName, 'from "' + depName + '" to "' + depMeta.tempMockName + '"');
				meta.mocks[depName] = depMeta.tempMock;
				mockedDependencies[i] = depMeta.tempMockName;
			}else if(depMeta.type === providers.value || depMeta.type === providers.constant){
				if($injector.has(depMeta.mockName)){
					debug('quickmock: setting mock for', options.providerName, depMeta.type, 'as "' + mockedDependencies[i] + '"');
					meta.mocks[depName] = initProvider(mockedDependencies[i], options);
				}else if($injector.has(depName)){
					debug('quickmock: setting mock for', options.providerName, depMeta.type, 'from "' + mockedDependencies[i] + '" to "' + depName + '" because no mock exists');
					meta.mocks[depName] = initProvider(mockedDependencies[i] = depName, options);
				}else{
					throwError('QUICKMOCK: no', depMeta.type, 'mock named "' + depName + '" was found');
				}
			}else{
				debug('quickmock: setting mock for', options.providerName, 'from "' + depName + '" to "' +  mockedDependencies[i] + '"');
				meta.mocks[depName] = initProvider(mockedDependencies[i], options);
			}
		});
	}

	function getAllModuleNames(options){
		var moduleNames = ['ng','ngMock'];
		if(options.moduleNames){
			moduleNames = moduleNames.concat(options.moduleNames);
		}
		if(options.moduleName){
			moduleNames.push(options.moduleName);
		}
		if(options.mockModules){
			moduleNames = moduleNames.concat(options.mockModules);
		}
		if(options.mocks){
			var tempMockModule = handleTemporaryMocks(options.mocks);
			moduleNames.push(tempMockModule.name);
		}
		if(angular.isArray(options.directivesToMock)){
			var directiveMocksModule = handleDirectiveMocks(options.directivesToMock);
			moduleNames.push(directiveMocksModule.name);
		}
		return moduleNames;
	}

	function debug(){
		if(logMode === quickmock.log.DEBUG){
			console.log(Array.prototype.slice.call(arguments).join(' '));
		}
	}

	function warn(){
		if(logMode == quickmock.log.WARN || logMode === quickmock.log.DEBUG){
			console.log(Array.prototype.slice.call(arguments).join(' '));
		}
	}

	function throwError(){
		throw new Error(Array.prototype.slice.call(arguments).join(' '));
	}

})();
