(function(angular){

	function QuickMock(options){
		if(!options.moduleName){
			throw new Error('QuickMock: No moduleName given. You must give the name of the module that contains the provider you wish to test.');
		}
		if(!options.providerName){
			throw new Error('QuickMock: No providerName given. You must give the name of the provider you wish to test.');
		}
		if(options.mockModules){
			angular.forEach(options.mockModules, function(mockMod){
				angular.module(mockMod);
			});
		}

		return mockProvider(options.moduleName, options.providerName, options.mockModules || [], options.mocks || {});
	}

	function mockProvider(moduleName, providerName, mockModules, overrideMocks){

		var allModules = ['ngMock', moduleName].concat(mockModules),
			injector = angular.injector(allModules),
			$controller = injector.get('$controller'),
			invokeQueue = angular.module(moduleName)._invokeQueue,
			providerType = getProviderType(providerName, invokeQueue);

		if(!injector.has(providerName) && providerType !== 'controller'){
			throw new Error('QuickMock: Cannot get mocks for "' + providerName + '" because no such provider exists');
		}

		var dependencies = getProviderDependenciesFromInvokeQueue(providerName, invokeQueue),
			mocks = injectMocksForDependencies(injector, dependencies, overrideMocks, providerType),
			provider;

		function initializeProvider(){
			return (providerType === 'controller')
				? $controller(providerName, mocks)
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

		setupInitializer();

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

	function injectMocksForDependencies(injector, dependencies, override, type){
		var mocks = {};
		angular.forEach(dependencies, function(dep){
			if(typeof dep === 'string'){
				if(override[dep] === QuickMock.USE_ACTUAL){
					if(injector.has(dep)){
						mocks[dep] = injector.get(dep);
					}else{
						throw new Error('QuickMock: Cannot use actual "' + dep + '" provider because it is not available.');
					}
				}else if(override[dep]){
					mocks[dep] = override[dep];
				}else if(injector.has(mockPrefix + dep)){
					mocks[dep] = injector.get(mockPrefix + dep);
				}else if(type && (type === 'value' || type === 'constant') && injector.has(dep)){
					mocks[dep] = injector.get(mockPrefix + dep);
				}else{
					throw new Error('QuickMock: Tried to inject mock for "' + dep + '" but no such mock exists. Please create one called "' + mockPrefix + dep + '" and try again.');
				}
			}
		});
		return mocks;
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
			}
		}
		return 'unknown';
	}

	var argIndex = 2,
		nameIndex = 0,
		dependencyListIndex = 1,
		mockPrefix = '___';

	QuickMock.MOCK_PREFIX = mockPrefix;
	QuickMock.USE_ACTUAL = 'USE_ACTUAL_IMPLEMENTATION';

	/* Stolen from the angular.js source code */
	var SNAKE_CASE_REGEXP = /[A-Z]/g;
	function snake_case(name, separator) {
	    separator = separator || '_';
	    return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
	        return (pos ? separator : '') + letter.toLowerCase();
	    });
	}
	/* End plaigarism */

	window.QuickMock = QuickMock;

	return QuickMock;
	
})(angular);