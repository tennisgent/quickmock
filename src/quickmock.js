(function(angular){

	var opts, mockPrefix = '___';

	function quickmock(options){
		opts = assertRequiredOptions(options);
		return mockProvider();
	}

	function mockProvider(){
		var allModules = opts.mockModules.concat(['ngMock', opts.moduleName]);
		var injector = angular.injector(allModules);
		var invokeQueue = angular.module(opts.moduleName)._invokeQueue;
		var providerType = getProviderType(opts.providerName, invokeQueue);
		var mocks = {},
			provider = {};

		// Loop through invokeQueue, find this provider's dependencies and prefix
		// them so Angular will inject the mocked versions
		angular.forEach(invokeQueue, function(providerData){
			// Remove any prefixed dependencies that presisted from a previous call,
			// and check for any non-annotated services
			sanitizeProvider(providerData, injector);
			var currProviderName = providerData[2][0],
				currProviderType = providerData[1];
			if(currProviderName === opts.providerName){
				var currProviderDeps = providerData[2][1];
				for(var i=0; i<currProviderDeps.length - 1; i++){
					var depName = currProviderDeps[i],
						mockServiceName = depName,
						depType = getProviderType(depName, invokeQueue);
					if(opts.useActualDependencies || opts.mocks[mockServiceName] && opts.mocks[mockServiceName] === quickmock.USE_ACTUAL){
						// don't do anything different
					}else if(depType === 'value' || depType === 'constant'){
						// don't do anything different
					}else if(depName.indexOf(mockPrefix) !== 0){
						mockServiceName = mockPrefix + depName;
						currProviderDeps[i] = mockServiceName;
					}
					if(!injector.has(mockServiceName)){
						throw new Error('quickmock: Cannot inject mock for "' + depName + '" because no such mock exists. Please write a mock ' + depType + ' called "'
							+ mockServiceName + '" (or set the useActualDependencies to true) and try again.');
					}
					mocks[depName] = injector.get(mockServiceName);
				}
			}
		});

		function setupInitializer(){
			provider = initProvider();
			spyOnProviderMethods(provider);
			provider.$mocks = mocks;
			provider.$initialize = setupInitializer;
		}

		function initProvider(){
			switch(providerType){
				case 'controller':
					var $controller = injector.get('$controller');
					return $controller(opts.providerName, mocks);
				case 'filter':
					var $filter = injector.get('$filter');
					return $filter(opts.providerName);
				default:
					return injector.get(opts.providerName);
			}
		}

		function setupDirective(){
			var $compile = injector.get('$compile');
			provider.$scope = injector.get('$rootScope').$new();
			provider.$mocks = mocks;
			provider.$compile = function(html){
				if(!html && !opts.html){
					throw new Error('quickmock: Cannot compile "' + opts.providerName + '" directive. No html string provided.');
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

	function sanitizeProvider(providerData, injector){
		if(angular.isFunction(providerData[2][1])){
			// provider declaration function has been provided without the array annotation,
			// so we need to annotate it so the invokeQueue can be prefixed
			var annotatedDependencies = injector.annotate(providerData[2][1]);
			delete providerData[2][1].$inject;
			annotatedDependencies.push(providerData[2][1]);
			providerData[2][1] = annotatedDependencies;
		}
		var currProviderDeps = providerData[2][1];
		for(var i=0; i<currProviderDeps.length - 1; i++){
			if(currProviderDeps[i].indexOf(mockPrefix) === 0){
				currProviderDeps[i] = currProviderDeps[i].replace(mockPrefix, '');
			}
		}
	}

	function assertRequiredOptions(options){
		if(!options.moduleName){
			throw new Error('quickmock: No moduleName given. You must give the name of the module that contains the provider/service you wish to test.');
		}
		if(!options.providerName){
			throw new Error('quickmock: No providerName given. You must give the name of the provider/service you wish to test.');
		}
		options.mockModules = options.mockModules || [];
		options.mocks = options.mocks || {};
		return options;
	}

	function spyOnProviderMethods(provider){
		angular.forEach(provider, function(property, propertyName){
			if(angular.isFunction(property)){
				spyOn(provider, propertyName).and.callThrough();
			}
		});
	}

	function getProviderType(providerName, invokeQueue){
		for(var i=0; i<invokeQueue.length; i++){
			var providerInfo = invokeQueue[i];
			if(providerInfo[2][0] === providerName){
				switch(providerInfo[0]){
					case '$provide':
						return providerInfo[1];
					case '$controllerProvider':
						return 'controller';
					case '$compileProvider':
						return 'directive';
					case '$filterProvider':
						return 'filter';
				}
			}
		}
		return 'unknown';
	}

	quickmock.MOCK_PREFIX = mockPrefix;
	quickmock.USE_ACTUAL = 'USE_ACTUAL_IMPLEMENTATION';

	window.quickmock = quickmock;

	return quickmock;
	
})(angular);