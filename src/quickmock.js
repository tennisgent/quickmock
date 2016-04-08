(function(){
    var origModuleFn,
		$injector = null,
		metadata = {
			configBlocks: [],
			runBlocks: []
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
			value: 'value',
			constant: 'constant',
			config: 'config',
			run: 'run'
		};

	window.quickmock = initQuickmock();

	function quickmock(options){
		if(!options.providerName || !(options.moduleNames || options.moduleName) || !metadata[options.providerName]) return false;

		options.moduleNames = options.moduleNames || [];

		if(options.moduleName){
			options.moduleNames.push(options.moduleName);
		}
		if(options.mockModules){
			options.moduleNames = options.moduleNames.concat(options.mockModules);
		}

		options.moduleNames = ['ng','ngMock'].concat(options.moduleNames);

		$injector = angular.injector(options.moduleNames, options.strictDi || false);

		if(angular.isFunction(options.inject)){
			$injector.invoke(options.inject);
		}

		var meta = metadata[options.providerName];

		meta.mocks = {};

		angular.forEach(meta.dependencies, function(depName, i){
			var depMeta = metadata[depName];
			if(!depMeta){
				if(metadata[constants.PREFIX + depName]){
					depName = constants.PREFIX + depName;
				}else{
					throw new Error('QUICKMOCK: unknown dependency "' + depName + '"');
				}
			}
			if(depMeta.type === providers.value || depMeta.type === providers.constant){
				meta.mocks[depName] = initProvider(meta.mockedDependencies[i] = depName);
			}else{
				meta.mocks[depName] = initProvider(meta.mockedDependencies[i]);
			}
		});

		if(angular.isFunction(meta.configFn)){
			meta.configFn.$inject = meta.mockedDependencies;
		}

		var provider = initProvider(options.providerName);

		if(angular.isFunction(meta.configFn)){
			meta.configFn.$inject = meta.dependencies;
		}

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

	function initProvider(providerName){
		var meta = metadata[providerName];
		if(!meta){
			console.log('unknown:', providerName);
		}
		switch(meta.type){
			case 'controller':
				var $controller = $injector.get('$controller');
				return $controller(providerName, meta.mocks);
			case 'filter':
				var $filter = $injector.get('$filter');
				return $filter(providerName);
			default:
				return $injector.get(providerName);
		}
	}

    function moduleWrapper(modName, requires, configFn){
		if(modName === 'ng') return false;
        var mod = origModuleFn(modName, requires, configFn);

		angular.forEach(providers, function(methodName){
			if(!excludedProviders[methodName] && angular.isFunction(mod[methodName])){
				var origMethod = mod[methodName],
					mockMethodName = 'mock' + methodName.charAt(0).toUpperCase() + methodName.slice(1);
				mod[mockMethodName] = wrapProviderMockDefinition(methodName, origMethod, mod);
				mod[methodName] = wrapProviderDefinition(methodName, origMethod, mod);
			}
		});

		mod.mockValue = wrapProviderMockDefinition('value', mod.value, mod);
		mod.mockConstant = wrapProviderMockDefinition('constant', mod.constant, mod);

		mod.value = wrapValueOrConstant('value', mod.value, mod);
		mod.constant = wrapValueOrConstant('constant', mod.constant, mod);

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

	function wrapConfigOrRunBlock(configOrRun, module){
		var callthrough = module[configOrRun];
		return function configOrRunBlock(configFn){
			var deps = $injector.annotate(configFn),
				mockedDeps = angular.copy(deps)
					.map(function(dep){
						return constants.PREFIX + dep;
					});
			configFn = angular.isArray(configFn) ? configFn[configFn.length-1] : configFn;
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
				value: value
			});
			return callthrough(name, value);
		};
	}

	function wrapProviderMockDefinition(type, callthrough, module){
		return function providerMockDefinition(name, configFn){
			var mockName = constants.PREFIX + name;
			angular.extend(metadata[name] = metadata[name] || {}, {
				hasMock: true
			});
			angular.extend(metadata[mockName] = metadata[mockName] || {}, {
				isMock: true,
				name: mockName,
				configFn: configFn,
				isMockFor: name,
				type: type,
				moduleName: module.name
			});
			return callthrough(constants.PREFIX + name, configFn);
		};
	}

})();