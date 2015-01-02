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
			invokeQueue = angular.module(moduleName)._invokeQueue,
			dependencies = [],
			mocks = {};

		if(!injector.has(providerName)){
			throw new Error('Cannot get mocks for "' + providerName + '" because no such provider exists');
		}

		dependencies = getProviderDependenciesFromInvokeQueue(providerName, invokeQueue);

		mocks = injectMocksForDependencies(injector, dependencies, overrideMocks);

		var provider = injector.invoke(dependencies, this, mocks);
		spyOnProviderMethods(provider);

		function setupInitializer(){
			provider.$initialize = function(){
				provider = injector.invoke(dependencies, this, mocks);
				spyOnProviderMethods(provider);
				setupInitializer();
			};
			provider.$mocks = mocks;
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

	function injectMocksForDependencies(injector, dependencies, override){
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
				}else{
					throw new Error('QuickMock: Tried to inject mock for "' + dep + '" but no such mock exists. Please create one and try again.');
				}
			}
		});
		return mocks;
	}

	function spyOnProviderMethods(provider){
		angular.forEach(provider, function(property, propertyName){
			if(typeof property === 'function'){
				spyOn(provider, propertyName).andCallThrough();
			}
		});
	}

	function getParamNames(func) {
		var funStr = func.toString();
		return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
	}

	var argIndex = 2,
		nameIndex = 0,
		dependencyListIndex = 1,
		mockPrefix = 'mock_';

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
	/* End plaigerism */

	return QuickMock;
	
})(angular);