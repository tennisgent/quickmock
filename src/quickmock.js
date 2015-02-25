(function(angular){

	var opts, mockPrefix;

	quickmock.MOCK_PREFIX = mockPrefix = (quickmock.MOCK_PREFIX || '___');
	quickmock.USE_ACTUAL = 'USE_ACTUAL_IMPLEMENTATION';
	quickmock.MUTE_LOGS = false;

	function quickmock(options){
		opts = assertRequiredOptions(options);
		return mockProvider();
	}

	function mockProvider(){
		var allModules = opts.mockModules.concat(['ngMock']),
			injector = angular.injector(allModules.concat([opts.moduleName])),
			modObj = angular.module(opts.moduleName),
			invokeQueue = modObj._invokeQueue || [],
			providerType = getProviderType(opts.providerName, invokeQueue),
			mocks = {},
			provider = {};

		angular.forEach(allModules || [], function(modName){
			invokeQueue = invokeQueue.concat(angular.module(modName)._invokeQueue);
		});

		if(providerType){
			// Loop through invokeQueue, find this provider's dependencies and prefix
			// them so Angular will inject the mocked versions
			angular.forEach(invokeQueue, function(providerData){
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

		angular.forEach(invokeQueue, function(providerData) {
			// Remove any prefixed dependencies that persisted from a previous call,
			// and check for any non-annotated services
			sanitizeProvider(providerData, injector);
		});

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

			provider.$compile = function quickmockCompile(html){
				html = html || opts.html;
				if(!html){
					throw new Error('quickmock: Cannot compile "' + opts.providerName + '" directive. No html string/object provided.');
				}
				if(angular.isObject(html)){
					html = generateHtmlStringFromObj(html);
				}
				provider.$element = angular.element(html);
				prefixProviderDependencies(opts.providerName, invokeQueue);
				$compile(provider.$element)(provider.$scope);
				prefixProviderDependencies(opts.providerName, invokeQueue, true);
				provider.$isoScope = provider.$element.isolateScope();
				provider.$scope.$digest();
			};
		}

		function getMockForProvider(depName, currProviderDeps, i){
			var depType = getProviderType(depName, invokeQueue),
				mockServiceName = depName;
			if(opts.mocks[mockServiceName] && opts.mocks[mockServiceName] === quickmock.USE_ACTUAL){
				quickmockLog('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
			}else if(depType === 'value' || depType === 'constant'){
				if(injector.has(mockPrefix + depName)){
					mockServiceName = mockPrefix + depName;
					currProviderDeps[i] = mockServiceName;
				}else{
					quickmockLog('quickmock: Using actual implementation of "' + depName + '" ' + depType + ' instead of mock');
				}
			}else if(depName.indexOf(mockPrefix) !== 0){
				mockServiceName = mockPrefix + depName;
				currProviderDeps[i] = mockServiceName;
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
			return injector.get(mockServiceName);
		}
	}

	function sanitizeProvider(providerData, injector){
		if(angular.isString(providerData[2][0]) && providerData[2][0].indexOf(mockPrefix) === -1){
			if(angular.isFunction(providerData[2][1])){
				// provider declaration function has been provided without the array annotation,
				// so we need to annotate it so the invokeQueue can be prefixed
				var annotatedDependencies = injector.annotate(providerData[2][1]);
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
	}

	function assertRequiredOptions(options){
		if(!window.angular){
			throw new Error('quickmock: Cannot initialize because angular is not available. Please load angular before loading quickmock.js.');
		}
		if(!options.providerName && !options.configBlocks && !options.runBlocks){
			throw new Error('quickmock: No providerName given. You must give the name of the provider/service you wish to test, or set the configBlocks or runBlocks flags.');
		}
		if(!options.moduleName){
			throw new Error('quickmock: No moduleName given. You must give the name of the module that contains the provider/service you wish to test.');
		}
		options.mockModules = options.mockModules || [];
		options.mocks = options.mocks || {};
		return options;
	}

	function spyOnProviderMethods(provider){
		angular.forEach(provider, function(property, propertyName){
			if(angular.isFunction(property)){
				if(window.jasmine && window.spyOn && !property.calls){
					var spy = spyOn(provider, propertyName);
					spy.andCallThrough ? spy.andCallThrough() : spy.and.callThrough();
				}else if(window.sinon && window.sinon.spy){
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

	function prefixProviderDependencies(providerName, invokeQueue, unprefix){
		angular.forEach(invokeQueue, function(providerData){
			if(providerData[2][0] === providerName && providerData[2][0].indexOf(mockPrefix) === -1){
				var currProviderDeps = providerData[2][1];
				if(angular.isArray(currProviderDeps)){
					for(var i=0; i<currProviderDeps.length - 1; i++){
						if(unprefix){
							currProviderDeps[i] = currProviderDeps[i].replace(mockPrefix, '');
						}else if(currProviderDeps[i].indexOf(mockPrefix) !== 0){
							currProviderDeps[i] = mockPrefix + currProviderDeps[i];
						}
					}
				}
			}
		});
	}

	function generateHtmlStringFromObj(html){
		if(!html.$tag){
			throw new Error('quickmock: Cannot compile "' + opts.providerName + '" directive. Html object does not contain $tag property.');
		}
		var htmlAttrs = html,
			tagName = htmlAttrs.$tag,
			htmlContent = htmlAttrs.$content;
		html = '<' + tagName + ' ';
		angular.forEach(htmlAttrs, function(val, attr){
			if(attr !== '$content' && attr !== '$tag'){
				html += snake_case(attr) + (val ? ('="' + val + '" ') : ' ');
			}
		});
		html += htmlContent ? ('>' + htmlContent) : '>';
		html += '</' + tagName + '>';
		return html;
	}

	function quickmockLog(msg){
		if(!quickmock.MUTE_LOGS){
			console.log(msg);
		}
	}

	var SNAKE_CASE_REGEXP = /[A-Z]/g;
	function snake_case(name, separator) {
		separator = separator || '-';
		return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
			return (pos ? separator : '') + letter.toLowerCase();
		});
	}

	window.quickmock = quickmock;

	return quickmock;

})(angular);