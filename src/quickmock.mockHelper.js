(function(){

	if(!window.quickmock){
		throw new Error('quickmock.mockHelper: Cannot be initialized because quickmock is not available');
	}

	var hasBeenMocked = {},
		origModuleFunc = angular.module;

	angular.module = decorateAngularModule;

	quickmock.mockHelper = {
		hasBeenMocked: hasBeenMocked
	};

	function decorateAngularModuleObject(modObj){
		var methods = getDecoratedMethods(modObj);
		angular.forEach(methods, function(method, methodName){
			modObj[methodName] = method;
		});
		return modObj;
	}

	function decorateAngularModule(name, requires, configFn){
		var modObj = origModuleFunc(name, requires, configFn);
		return decorateAngularModuleObject(modObj);
	}

	function getDecoratedMethods(modObj){

		function basicMock(providerName, initFunc, providerType){
			hasBeenMocked[providerName] = true;
			var newModObj = modObj[providerType](quickmock.MOCK_PREFIX + providerName, initFunc);
			return decorateAngularModuleObject(newModObj);
		}

		return {
			mockService: function mockService(providerName, initFunc){
				return basicMock(providerName, initFunc, 'service', modObj);
			},
			mockFactory: function mockFactory(providerName, initFunc){
				return basicMock(providerName, initFunc, 'factory', modObj);
			},

			mockFilter: function mockFilter(providerName, initFunc){
				return basicMock(providerName, initFunc, 'filter', modObj);
			},

			mockController: function mockController(providerName, initFunc){
				return basicMock(providerName, initFunc, 'controller', modObj);
			},

			mockProvider: function mockProvider(providerName, initFunc){
				return basicMock(providerName, initFunc, 'provider', modObj);
			},

			mockValue: function mockValue(providerName, initFunc){
				return basicMock(providerName, initFunc, 'value', modObj);
			},

			mockConstant: function mockConstant(providerName, initFunc){
				return basicMock(providerName, initFunc, 'constant', modObj);
			},

			mockAnimation: function mockAnimation(providerName, initFunc){
				return basicMock(providerName, initFunc, 'animation', modObj);
			}
		};
	}

})();