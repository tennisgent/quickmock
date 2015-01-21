quickmock
======

quickmock is a micro-library for initializing, mocking and auto-injecting provider dependencies for Jasmine unit tests


What does it do?
----------------

Mocking out dependencies in unit tests can be a huge pain. Angular makes testing "easy", but mocking out *every* dependecy isn't so slick. If you've ever written an Angular unit test (using Jasmine), you've probably seen a ton of `beforeEach` boilerplate that looks something like this:

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

quickmock will find the `NotificationService` and lookup its list of dependencies. It will then try to find mocks for each of those dependencies.

Writing Mocks
-------------

Where do those mocks come from?  We can provide mocks for each of the dependencies by creating a separate javascript file and writing a separate Angular module to contain those mocks. You can find examples in [`mocksModule.js`](https://github.com/tennisgent/QuickMock/blob/master/test/mocksModule.js). Here is an one example:

```javascript
angular.module('QuickMockDemoMocks', [])
	.factory('___$window', [function() {
		return jasmine.createSpyObj('$window', ['alert','confirm']);
	}])
```

Notice the prefix to the name of the `___$window` mock. By declaring each mocked service with a pre-defined prefix, quickmock will know which mocks relate to which services. The default prefix is `'___'` (three underscores), but this prefix is configurable if you prefer a different one.  The great thing about these mocks is that they can be reused every time you need to test any future services that have these same dependencies.

**Important:** If you don't have a mock registered for any of the required dependencies, quickmock will throw an error when it tries to inject the mock. So be sure to register a `___`-prefixed mock for each of the tested provider's dependencies. If you wish to delgate to actual implementations of the dependencies, instead of throwing this error, you can set the `useActualDependencies: true` flag on the config object that is passed into quickmock.

**NOTE:** You don't have to provide mocks for `.value()` and `.constant()` providers. These dependencies are always delegated to the actual implementations. So, in our example, we don't have to mock out the `NotificationTitles` object because it is a `value` provider. 


The quickmock API
-----------------

As shown in the example above, a call to quickmock accepts a config object and returns an object, which in this case we called `notificationService`.

####The Config Object
* `providerName` (String) - The name of the provider you want to test
* `moduleName` (String) - The name of the module that contains the provider above
* `mockModules` (Array:String) - An array of the names of modules that contain mocks for any of the provider's dependencies
* `useActualDependencies` (Boolean) - If quickmock cannot find a mock for a required dependency, it will thrown an exception. If, instead, you wish to delegate to the actual implementations of the dependencies instead of mocking them out, set this flag to `true`.
* `html` (String) - For directives only, this is the default html that will be compiled when `.$compile()` is called (this is explained below).


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
		link: function(scope, elem, attrs){
			var notificationMessage = 'Your preference has been set to: ';
			scope.check = false;
			scope.$watch('check', function(val){
				NotificationService[val ? 'success' : 'warning'](notificationMessage + val);
			});
		}
	};
}])
```
* `.$compile([html])` (Function) - compiles the given html string and calls then `$scope.$digest()`. If no html string is given, it will default to the html provided in the config object.

```javascript
beforeEach(function(){
    zbToggle = quickmock({
		providerName: 'zbToggle',
		moduleName: 'QuickMockDemo',
		mockModules: ['QuickMockDemoMocks'],
		html: '<div zb-toggle></div>'  // default html to compile when calling .$compile()
	});
	zbToggle.$compile();
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

More In-depth Examples
----------------------

The examples above are very simple. You will find more in-depth examples for each of the various provider types in the [`demo/app.js`]('https://github.com/tennisgent/QuickMock/blob/master/demo/app.js') file. Each of the providers in that file have their own quickmock test files that give more details on how to test them using quickmock. Each of these specs files are found in the [`specsUsingQuickMock`](https://github.com/tennisgent/QuickMock/tree/master/test/specsUsingQuickMock) folder.

| Type  | Name | Spec File |
| ------------- | ------------- | ------------- |
| `service`  | `APIService` | [`apiService.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/apiService.spec.js) |
| `factory`  | `UserFormValidator` | [`userFormValidatorService.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/userFormValidatorService.spec.js) |
| `service`  | `NotificationService` | [`notificationService.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/notificationService.spec.js) |
| `controller`  | `FormController` | [`formController.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/formController.spec.js) |
| `directive`  | `zb-toggle` | [`zbToggleDirective.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/zbToggleDirective.spec.js) |
| `filter`  | `firstInitialLastName` | [`firstInitialLastNameFilter.spec.js`](https://github.com/tennisgent/QuickMock/blob/master/test/specsUsingQuickMock/firstInitialLastNameFilter.spec.js) |

For those who are curious, there are also examples of testing these same providers **without** using quickmock for comparison. These specs are found in the [`specsWithoutUsingQuickMock`](https://github.com/tennisgent/QuickMock/tree/master/test/specsWithoutUsingQuickMock) folder.

You will also find example mocks for each of these providers, as well as mocks the angular `$promise`, `$http` and `$scope` services in the [`mocksModule.js`](https://github.com/tennisgent/QuickMock/blob/master/test/mocksModule.js) file.

Installing
----------

```
npm install quickmock
```

Running the Tests
-----------------

####Karma:
An example karma config file can be found [here](https://github.com/tennisgent/QuickMock/blob/master/test/karma.conf.js). You will need to include the following `files` in your karma config file:
```javascript
files: [
    'vendor/angular.js',
    'vendor/angular-mocks.js',
    'vendor/quickmock.js',
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

Jasmine Version
---------------
quickmock currently only supports [Jasmine 2.1](http://jasmine.github.io/2.1/introduction.html) and above. If you need support for additional versions of Jasmine, please submit an issue.

Ideas for Improvement?
----------------------
If you have any ideas for how to make quickmock better, please submit them as pull requests.

Issues?
-------
If you find any issues or bugs, please submit them as issues on this repository.
