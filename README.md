quickmock
======

quickmock is a micro-library for initializing, mocking and auto-injecting provider dependencies for Jasmine/Mocha/Chai/Sinon unit tests in AngularJS


What does it do?
----------------

Mocking out dependencies in unit tests can be a huge pain. Angular makes testing "easy", but mocking out *every* dependecy isn't so slick. If you've ever written an Angular unit test (using Jasmine/Mocha), you've probably seen a ton of `beforeEach` boilerplate that looks something like this:

```javascript
describe('zb-toggle Directive', function () {
		var scope, element, notificationService, $compile;

		beforeEach(function(){
			module('AppModule');
			module(function($provide){
				var mockNotificationService = jasmine.createSpyObj('NotificationService',
				    ['error','success','warning','basic','confirm']);
				$provide.value('NotificationService', mockNotificationService);
			});
			inject(function(_$rootScope_, _$compile_, _NotificationService_){
				scope = _$rootScope_.$new();
				$compile = _$compile_;
				notificationService = _NotificationService_;
			});
		});

		beforeEach(function(){
			element = angular.element('<div zb-toggle></div>');
			$compile(element)(scope);
			scope.$digest();
		});

	// ... write actual test cases here
});
```

The module containing the directive must first be initialized. Then any dependencies must be mocked out and "provided" to the Angular injector. Then `$rootScope`, `$compile` and the mocked service must be injected into your testing environment to be referenced later. Then you have to render, compile and `$digest()` the directive HTML. Once all that is done, you can begin writing test cases.

What if it was a lot easier?  What if we could reduce all of that down to this?

```javascript
describe('zb-toggle Directive', function () {
		var zbToggle;

		beforeEach(function(){
		    zbToggle = quickmock({
				providerName: 'zbToggle',
				moduleName: 'QuickMockDemo',
				mockModules: ['QuickMockDemoMocks'],
				html: '<div zb-toggle></div>'
			});
			zbToggle.$compile();
		});

	// ... write actual test cases here
});
```

How Does It Work?
-----------------

quickmock does all of that `beforeEach` boilerplate behind the scenes, and returns an object that contains all of the data you need to write your tests. Mocks are defined in their own reusable Angular modules. quickmock then sees which dependencies your provider (i.e. service/factory/directive/filter/controller/etc) has, looks up the mocks for those dependencies, injects them into the provider and into your test, and finally bootstraps all the required modules.

How do I use it?
----------------

Let's start with a simple example. quickmock can work with even the most complex providers, but to start out, we'll choose an easy service that we want to test. Let's say we have the following `'NotificationService'` provider:

```javascript
angular.module('QuickMockDemo', [])
    .service('NotificationService', ['$window', 'NotificationTitles', function($window, titles){
    	return {
    		error: function notificationError(msg){
    			$window.alert(titles.error + '\n\n' + msg);
    		},
    		success: function notificationSuccess(msg){
    			$window.alert(titles.success + '\n\n' + msg);
    		},
    		warning: function notificationWarning(msg){
    			$window.alert(titles.warning + '\n\n' + msg);
    		},
    		basic: function notificationBasic(msg){
    			$window.alert(titles.basic + '\n\n' + msg);
    		},
    		confirm: function notificationConfirm(msg){
    			return $window.confirm(titles.confirm + '\n\n' + msg);
    		}
    	};
    }])
```

Its a simple service that shows various alert messages to the user, by delegating to `window.alert()`. It has two dependencies: `$window` and `NotificationTitles`, which is looks like this:

```javascript
.value('NotificationTitles', {
	error: 'It looks like something went wrong...',
	success: 'Congraduations!',
	warning: 'Be careful...',
	basic: 'Check this out!',
	confirm: 'Confirm Action'
})
```

We can test this service by writing the following:

```javascript
describe('NotificationService', function () {
	var notificationService;

	beforeEach(function(){
		notificationService = quickmock({
			providerName: 'NotificationService', // the provider we wish to test
			moduleName: 'QuickMockDemo',         // the module that contains our provider
			mockModules: ['QuickMockDemoMocks']  // module(s) that contains mocks for our provider's dependencies
		});
	});
	....
```

quickmock will find the `NotificationService` and lookup its list of dependencies. It will then try to find mocks for each of those dependencies and inject them into your test.

How do I write the mocks I need?
--------------------------------

You can provide mocks for each of the dependencies by creating a separate javascript file and writing a separate Angular module to contain those mocks. This provides several benefits: it allows your mocks to be reusable between tests, gives you a specific structure for writing your tests, and easily integrates with quickmock.

quickmock provides a simple syntax for declaring mocks in a module found in [`quickmock.mockHelper.js`](https://github.com/tennisgent/quickmock/blob/master/src/quickmock.mockHelper.js). It allows you to declare mocks as seen in the following simple example:

```javascript
// Declare an Angular module that will contain any mocks you need
angular.module('SampleMocks', [])

	// now declare specific mocks for each of your dependencies
	.mockService('NotificationService', [function(){
		return jasmine.createSpyObj('NotificationService', ['error','success','warning','basic','confirm']);
	}])

	.mockFactory('UserFormValidator', [function(){
		var spy = jasmine.createSpy('UserFormValidator');
		spy.and.returnValue(true);
		return spy;
	}])
```

A detailed explanation of the two possible mock declaration syntaxes (and their advantages and disadvantages) can be found [here](https://github.com/tennisgent/quickmock/tree/master/demo/mocks).

For further information about how to write specific mocks to acurately mock out your providers, see [this SitePoint article](http://www.sitepoint.com/mocking-dependencies-angularjs-tests/) or the [Angular Developer Guide: Unit Testing](https://docs.angularjs.org/guide/unit-testing).


The quickmock API
-----------------

As shown in the example above, a call to quickmock accepts a config object and returns an object, which in this case we called `notificationService`.

####The Config Object
* `providerName` (String) - The name of the provider you want to test
* `moduleName` (String) - The name of the module that contains the provider above
* `mockModules` (Array:String) - An array of the names of modules that contain mocks for any of the provider's dependencies
* `useActualDependencies` (Boolean) - If quickmock cannot find a mock for a required dependency, it will thrown an exception. If, instead, you wish to delegate to the actual implementations of the dependencies instead of mocking them out, set this flag to `true`.
* `spyOnProviderMethods` (Boolean) - If true, quickmock will automatically spy on the methods of the provider. This will give you access to all of the usual spy functionality for any methods on your provider, but will also call through to the actual implementation so you can test all required functionality. This is very useful when testing certain provider methods that call one another.
* `html` (String|Object) - For directives only, this is the default html that will be compiled when `.$compile()` is called (this is explained below).


####The Returned Object
The `notificationService` object provides all of the data you need to write tests for the `NotificationService` provider.  Here is a walk through of all the information you are given. The following properties are avaiable when testing all provider types (services/factories/directives/controllers/filters/etc):

* `.$mocks` (Object) - contains all of the mocked dependencies for the provider you are testing

```javascript
// to test the NotificationService.error() method
it('should display proper error message to the user', function(){
	notificationService.error('some fake message'); // calls to the provider
	var mock_$window = notificationService.$mocks.$window,
	    mock_NotificationTitles = notificationService.$mocks.NotificationTitles;
	var messageShown = mock_$window.alert.calls.argsFor(0)[0];
	expect(messageShown).toContain(mock_NotificationTitles.error);
	expect(messageShown).toContain('some fake message');
});
```

* `.$initialize()` (Function) - calling .$initialize() will re-initialize the provider you are testing. This is useful if you are testing any functionality that happens at the moment your service is initialized.

The following properties are specific to testing `directive` providers and will reference the following example directive:

```javascript
.directive('zbToggle', ['NotificationService', function(NotificationService){
	return {
		restrict: 'AE',
		replace: true,
		transclude: true,
		template: '<div class="toggle" ng-click="check = !check">'
			+ '<input type="checkbox" ng-model="check">'
			+ '<span ng-transclude></span>'
			+ '</div>',
		scope: {
			initState: '='
		},
		link: function(scope, elem, attrs){
			var notificationMessage = 'Your preference has been set to: ';
			scope.check = scope.initState || false;
			scope.$watch('check', function(val){
				NotificationService[val ? 'success' : 'warning'](notificationMessage + val);
			});
		}
	};
}])
```
* `.$compile([html])` (Function) - compiles the given html string/object and calls then `$scope.$digest()`. If no html string/object is given, it will default to the html provided in the config object. You can provide a javascript object, which will be generated into an html string.

```javascript
it('should compile the given html string', function(){
	zbToggle.$compile('<div zb-toggle class="btn btn-round" init-state="true"></div>');
	expect(zbToggle.$element[0].tagName).toEqual('DIV');
	expect(zbToggle.$element.hasClass('btn-round')).toEqual(true);
	expect(zbToggle.$scope.initState).toEqual(true);
	zbToggle.$compile('<span zb-toggle class="btn btn-shadow" init-state="false"></span>');
	expect(zbToggle.$element[0].tagName).toEqual('SPAN');
	expect(zbToggle.$element.hasClass('btn-shadow')).toEqual(true);
	expect(zbToggle.$scope.initState).toEqual(false);
});

it('should compile the given html object', function(){
	var htmlObj = {
		$tag: 'div',  			// $tag (required): will be the html tagName (i.e. '<zb-toggle ...>' or '<div ...>' or '<span ...>')
		$content: '',  			// $content (optional): will be inner content of the html element
		zbToggle: '',
		class: 'btn btn-round',
		initState: true			// properties are normalized (i.e. 'initState: true' will become 'init-state="true"')
	};
	zbToggle.$compile(htmlObj);
	expect(zbToggle.$element[0].tagName).toEqual('DIV');
	expect(zbToggle.$element.hasClass('btn-round')).toEqual(true);
	expect(zbToggle.$scope.initState).toEqual(true);
	htmlObj.$tag = 'span';
	htmlObj.class = 'btn btn-shadow';
	htmlObj.initState = false;
	zbToggle.$compile(htmlObj);
	expect(zbToggle.$element[0].tagName).toEqual('SPAN');
	expect(zbToggle.$element.hasClass('btn-shadow')).toEqual(true);
	expect(zbToggle.$scope.initState).toEqual(false);
});
```

* `.$element` (jQuery/jqLite Element) - provides access to the element that results from `angular.element()`.

```javascript
it('should have the toggle class', function(){
	expect(zbToggle.$element.hasClass('toggle')).toBe(true);
});

it('should show a checkbox', function(){
	var input = zbToggle.$element.find('input');
	expect(input.attr('type')).toEqual('checkbox');
});
```

* `.$scope` (Object) - provides access to the directive's Angular `scope` object

```javascript
it('should toggle the checkbox when clicked', function(){
	expect(zbToggle.$scope.check).toBe(false);
	zbToggle.$element[0].click();
	expect(zbToggle.$scope.check).toBe(true);
	zbToggle.$element[0].click();
	expect(zbToggle.$scope.check).toBe(false);
});

it('should show a success message when toggled to true', function(){
	expect(zbToggle.$scope.check).toBe(false);
	zbToggle.$scope.check = true;
	zbToggle.$scope.$digest();
	expect(zbToggle.$mocks.NotificationService.success).toHaveBeenCalled();
});
```


* `.$isoScope` (Object) - provides access to the directive's Angular `isoloateScope` object, if one exists

```javascript
it('should have an isolateScope', function(){
	expect(zbToggle.$isoScope).toBe(zbToggle.$element.isolateScope());
});
```

How do I shut it up?
--------------------

You might find that quickmock logs a fair amount of information to the console. This is simply to make sure that you know what is happening behind the scenes and are aware of any possible warnings that might pop up. If you wish to turn off logging, you can simply set the `quickmock.MUTE_LOGS` flag to `true`. This will disable the logs and you won't see any data from quickmock output to the console. This DOES NOT, however, turn off exceptions that may be thrown as a result of required parameters not being available, such as `angular` being `undefined` or if you're missing required config parameters.

More In-depth Examples
----------------------

The examples above are very simple. You will find more in-depth examples for each of the various provider types in the [`demo/app.js`](https://github.com/tennisgent/quickmock/blob/master/demo/app.js) file. Each of the providers in that file have their own quickmock test files that give more details on how to test them using quickmock. Each of these specs files are found in the [`specsUsingQuickMock`](https://github.com/tennisgent/quickmock/tree/master/demo/specsUsingQuickMock) folder.

| Type  | Name | Spec File |
| ------------- | ------------- | ------------- |
| `service`  | `APIService` | [`apiService.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/apiService.spec.js) |
| `factory`  | `UserFormValidator` | [`userFormValidatorService.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/userFormValidatorService.spec.js) |
| `service`  | `NotificationService` | [`notificationService.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/notificationService.spec.js) |
| `controller`  | `FormController` | [`formController.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/formController.spec.js) |
| `directive`  | `zb-toggle` | [`zbToggleDirective.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/zbToggleDirective.spec.js) |
| `filter`  | `firstInitialLastName` | [`firstInitialLastNameFilter.spec.js`](https://github.com/tennisgent/quickmock/blob/master/demo/specsUsingQuickMock/firstInitialLastNameFilter.spec.js) |

For those who are curious, there are also examples of testing these same providers **without** using quickmock (for comparison). These specs are found in the [`specsWithoutUsingQuickMock`](https://github.com/tennisgent/quickmock/tree/master/demo/specsWithoutUsingQuickMock) folder.

You will also find example mocks for each of these providers, as well as mocks the angular `$promise`, `$http` and `$scope` services in the [`mocks`](https://github.com/tennisgent/quickmock/tree/master/demo/mocks) folder.


Config and Run Blocks
---------------------

In order to retrieve the list of dependencies for any given provider, quickmock has to instantiate the angular modules provided in the `moduleName` and `mockModules` properties of the config object. These modules are instantiated the moment `quickmock({...})` is called. (Traditionally, this was done in `beforeEach` blocks using the `module()` method provided in the `ngMock` module.) As a side effect of this pre-instantiation, all `.config()` and `.run()` blocks declared in those modules will be run at that moment. So any code in those blocks will also be executed.

As a rule, quickmock does not inject mocked versions of any of the dependencies for a `.config` or `.run` block. So these code blocks will receive the actual implemenations of the services/providers they depend on so that the code in these blocks will function as expected. If anyone would like to see this changed, please submit an issue and it can be discussed.

If you wish to test code in a `.config()` or a `.run()` block, it is recommended that you not use quickmock. Instead, simply call angular's `module('myModule')` function, which will instantiate the `myModule` module and execute these code blocks.


Installing
----------

```
npm install quickmock
```

Testing Frameworks
------------------

As mentioned above, quickmock works with most of the popular JavaScript unit testing frameworks. It has been tested with Jasmine 1.3+, Mocha 2.0+, Sinon.js, Chai.js. It is expected to work with nearly any others. The exception to this rule is with the `spyOnProviderMethods: true` config option. This option only works with Jasmine and with Mocha (when using sinon.js).

Running the Tests
-----------------

####Karma:
An example karma config file can be found [here](https://github.com/tennisgent/quickmock/blob/master/test/karma.conf.js). You will need to include the following `files` in your karma config file:
```javascript
files: [
    'vendor/angular.js',
    'vendor/angular-mocks.js',
    'src/quickmock.js',
    'src/quickmock.mockHelper.js', // optional
    '<source code>.js',
    '<test specs>.js',
    '<any file(s) containing mocks>.js'
]
```
####Jasmine Spec Runner
In the `<head>` of the SpecRunner.html file, you will need to include references to the following files:

```html
<!-- include vendor files here... -->
<script src="vendor/angular.js"></script>
<script src="vendor/angular-mocks.js"></script>
<script src="vendor/quickmock.js"></script>

<!-- include source files here... -->
<script src="<source code>.js"></script>

<!-- include spec files here... -->
<script src="<test specs>.js"></script>
```

Ideas for Improvement?
----------------------
If you have any ideas for how to make quickmock better, please submit them as pull requests.

Issues?
-------
If you find any issues or bugs, please submit them as issues on this repository.
