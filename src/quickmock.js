(function(angular){

	var opts, mockPrefix = '___';

	function quickmock(options){
		opts = assertRequiredOptions(options);
		return mockProvider();
	}

	function mockProvider(){
		var allModules = opts.mockModules.concat(['ngMock', opts.moduleName]),
			injector = angular.injector(allModules),
			modObj = angular.module(opts.moduleName),
			invokeQueue = modObj._invokeQueue,
			providerType = getProviderType(opts.providerName, invokeQueue),
			mocks = {},
			provider = {};

		if(providerType){
			// Loop through invokeQueue, find this provider's dependencies and prefix
			// them so Angular will inject the mocked versions
			angular.forEach(invokeQueue, function(providerData){
				// Remove any prefixed dependencies that presisted from a previous call,
				// and check for any non-annotated services
				sanitizeProvider(providerData, injector);
				var currProviderName = providerData[2][0];
				if(currProviderName === opts.providerName){
					var currProviderDeps = providerData[2][1];
					for(var i=0; i<currProviderDeps.length - 1; i++){
						var depName = currProviderDeps[i];
						mocks[depName] = getMockForProvider(depName, currProviderDeps, i);
					}
				}
			});

			if(providerType === 'directive'){
				setupDirective();
			}else{
				setupInitializer();
			}
		}

		return provider;


		function setupInitializer(){
			provider = initProvider();
			if(opts.spyOnProviderMethods){
				spyOnProviderMethods(provider);
			}
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
				case 'animation':
					return {
						$animate: injector.get('$animate'),
						$initialize: function initAnimation(){
							angular.mock.module('ngAnimateMock');
						}
					};
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

		function getMockForProvider(depName, currProviderDeps, i){
			var depType = getProviderType(depName, invokeQueue),
				mockServiceName = depName;
			if(opts.mocks[mockServiceName] && opts.mocks[mockServiceName] === quickmock.USE_ACTUAL){
				console.log('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
			}else if(depType === 'value' || depType === 'constant'){
				if(injector.has(mockPrefix + depName)){
					mockServiceName = mockPrefix + depName;
					currProviderDeps[i] = mockServiceName;
				}
			}else if(depName.indexOf(mockPrefix) !== 0){
				mockServiceName = mockPrefix + depName;
				currProviderDeps[i] = mockServiceName;
			}
			if(!injector.has(mockServiceName)){
				if(depType === 'value' || depType === 'constant' || opts.useActualDependencies){
					console.log('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
				}else {
					throw new Error('quickmock: Cannot inject mock for "' + depName + '" because no such mock exists. Please write a mock ' + depType + ' called "'
					+ mockServiceName + '" (or set the useActualDependencies to true) and try again.');
				}
			}
			return injector.get(mockServiceName);
		}
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
		if(!window.angular){
			throw new Error('quickmock: Cannot initialize because angular is not available. Please load angular before loading the quickmock.js file.');
		}
		if(!options.moduleName){
			throw new Error('quickmock: No moduleName given. You must give the name of the module that contains the provider/service you wish to test.');
		}
		if(!options.providerName && !options.configBlocks && !options.runBlocks){
			throw new Error('quickmock: No providerName given. You must give the name of the provider/service you wish to test, or set the configBlocks or runBlocks flags.');
		}
		options.mockModules = options.mockModules || [];
		options.mocks = options.mocks || {};
		return options;
	}

	function spyOnProviderMethods(provider){
		angular.forEach(provider, function(property, propertyName){
			if(angular.isFunction(property)){
				if(window.jasmine){
					var spy = spyOn(provider, propertyName);
					spy.andCallThrough ? spy.andCallThrough() : spy.and.callThrough();
				}else if(window.sinon){
					sinon.spy(provider, propertyName);
				}
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
					case '$animateProvider':
						return 'animation';
				}
			}
		}
		return null;
	}

	quickmock.MOCK_PREFIX = mockPrefix;
	quickmock.USE_ACTUAL = 'USE_ACTUAL_IMPLEMENTATION';

	window.quickmock = quickmock;

	return quickmock;
	
})(angular);