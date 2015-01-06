(function(angular){

	var opts, allModules, injector, $controller, $compile, invokeQueue, providerType;

	function QuickMock(options){
		opts = assertRequiredOptions(options);
		return mockProvider();
	}

	QuickMock.directive = function(options){

		opts = assertRequiredOptions(options);

		allModules = opts.mockModules.concat(['ngMock', opts.moduleName]);
		injector = angular.injector(allModules);
		$controller = injector.get('$controller');
		$compile = injector.get('$compile');
		invokeQueue = angular.module(opts.moduleName)._invokeQueue;
		providerType = getProviderType(opts.providerName, invokeQueue);

		var dependencies = getProviderDependenciesFromInvokeQueue(opts.providerName, invokeQueue),
			mocks = injectMocksForDependencies(injector, dependencies, providerType, allModules),
			provider = {};

		console.log('going to do stuff');
		angular.mock.module(function($provide){
			console.log($provide);
			angular.forEach(mocks, function(mock, serviceName){
				$provide.value(serviceName, mock);
			});
		});

		function setupDirective(){
			provider.$scope = injector.get('$rootScope').$new();
			provider.$mocks = mocks;
			provider.$compile = function(html){
				if(!html && !opts.html){
					throw new Error('QuickMock: Cannot compile "' + opts.providerName + '" directive. No html string provided.');
				}
				provider.$element = angular.element(html || opts.html);
				$compile(provider.$element)(provider.$scope);
				provider.$scope.$digest();
			};
		}

		setupDirective();

		return provider;
	};

	function mockProvider(){
		allModules = opts.mockModules.concat(['ngMock', opts.moduleName]);
		injector = angular.injector(allModules);
		$controller = injector.get('$controller');
		$compile = injector.get('$compile');
		invokeQueue = angular.module(opts.moduleName)._invokeQueue;
		providerType = getProviderType(opts.providerName, invokeQueue);

		if(!injector.has(opts.providerName) && providerType !== 'controller' && providerType !== 'directive'){
			throw new Error('QuickMock: Cannot get mocks for "' + opts.providerName + '" because no such provider exists');
		}

		var dependencies = getProviderDependenciesFromInvokeQueue(opts.providerName, invokeQueue),
			mocks = injectMocksForDependencies(injector, dependencies, providerType, allModules),
			provider = {};

		function initializeProvider(){
			return (providerType === 'controller')
				? $controller(opts.providerName, mocks)
				: injector.invoke(dependencies, this, mocks);
		}

		function setupInitializer(){
			provider = initializeProvider();
			spyOnProviderMethods(provider);
			provider.$mocks = mocks;
			provider.$initialize = function(){
				provider = initializeProvider();
				spyOnProviderMethods(provider);
				provider.$mocks = mocks;
			};
			return provider;
		}

		function setupDirective(){
			angular.forEach(invokeQueue, function(providerData){
				var currProviderName = providerData[2][0];
				if(currProviderName === opts.providerName){
					var currProviderDeps = providerData[2][1];
					for(var i=0; i<currProviderDeps.length - 1; i++){
						if(currProviderDeps[i].indexOf(mockPrefix) !== 0)
							currProviderDeps[i] = mockPrefix + currProviderDeps[i];
					}
				}
			});


			provider.$scope = injector.get('$rootScope').$new();
			provider.$mocks = mocks;
			provider.$compile = function(html){
				if(!html && !opts.html){
					throw new Error('QuickMock: Cannot compile "' + opts.providerName + '" directive. No html string provided.');
				}
				provider.$element = angular.element(html || opts.html);

				$compile(provider.$element)(provider.$scope);
				provider.$scope.$digest();
			};
		}

		if(providerType === 'directive'){
			setupDirective();
		}else{
			setupInitializer();
		}

		return provider;
	}

	function getProviderDependenciesFromInvokeQueue(providerName, invokeQueue){
		var dependencies = [];
		angular.forEach(invokeQueue, function(provider){
			if(provider[argIndex] && provider[argIndex][nameIndex] === providerName){
				dependencies = provider[argIndex][dependencyListIndex];
			}
		});
		return dependencies;
	}

	function injectMocksForDependencies(injector, dependencies, type, mods){
		var mocks = {};

		angular.forEach(dependencies, function(dep){
			if(typeof dep === 'string'){
				mocks[dep] = getMockForService(dep, injector, type);
			}
		});

		return mocks;
	}

	function getMockForService(serviceName, injector, type){
		if(serviceName.indexOf(mockPrefix) === 0){
			serviceName.replace(mockPrefix, '');
		}
		if(opts.mocks && opts.mocks[serviceName] === QuickMock.USE_ACTUAL){
			if(injector.has(serviceName)){
				return injector.get(serviceName);
			}else{
				throw new Error('QuickMock: Cannot use actual "' + serviceName + '" provider because it is not available.');
			}
		}else if(opts.mocks && opts.mocks[serviceName]){
			return opts.mocks[serviceName];
		}else if(injector.has(mockPrefix + serviceName)){
			return injector.get(mockPrefix + serviceName);
		}else if(type && (type === 'value' || type === 'constant') && injector.has(serviceName)){
			return injector.get(mockPrefix + serviceName);
		}else{
			throw new Error('QuickMock: Tried to inject mock for "' + serviceName + '" but no such mock exists. Please create one called "' + mockPrefix + serviceName + '" and try again.');
		}
	}

	function spyOnProviderMethods(provider){
		angular.forEach(provider, function(property, propertyName){
			if(typeof property === 'function'){
				spyOn(provider, propertyName).and.callThrough();
			}
		});
	}

	function getParamNames(func) {
		var funStr = func.toString();
		return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
	}

	function getProviderType(providerName, invokeQueue){
		for(var i=0; i<invokeQueue.length; i++){
			var providerInfo = invokeQueue[i];
			if(providerInfo[2][0] === providerName){
				if(providerInfo[0] === '$provide')
					return providerInfo[1];
				else if(providerInfo[0] === '$controllerProvider')
					return 'controller';
				else if(providerInfo[0] === '$compileProvider')
					return 'directive';
			}
		}
		return 'unknown';
	}

	function assertRequiredOptions(options){
		if(!options.moduleName){
			throw new Error('QuickMock: No moduleName given. You must give the name of the module that contains the provider/service you wish to test.');
		}
		if(!options.providerName){
			throw new Error('QuickMock: No providerName given. You must give the name of the provider/service you wish to test.');
		}

		//angular.forEach(options.mockModules = (options.mockModules || []), function(mockMod){
		//	angular.module(mockMod);
		//});

		return options;
	}

	var argIndex = 2,
		nameIndex = 0,
		dependencyListIndex = 1,
		mockPrefix = '___';

	QuickMock.MOCK_PREFIX = mockPrefix;
	QuickMock.USE_ACTUAL = 'USE_ACTUAL_IMPLEMENTATION';

	window.QuickMock = QuickMock;

	return QuickMock;
	
})(angular);