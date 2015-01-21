How do I write the mocks I need?
--------------------------------

You can provide mocks for each of the dependencies by creating a separate javascript file and writing a separate Angular module to contain those mocks. This provides several benefits: it allows your mocks to be reusable between tests, gives you a specific structure for writing your tests, and easily integrates with quickmock.

###Ways to declare your mocks

####Using quickmock.mockHelper.js

It is suggested that you use quickmock's `mockHelper` to write your mocks. It provides a simple, clean syntax for writing mocks. It also provides you with some helpful mocks for commonly-used angular services out of the box, such as `$http`, `$promise`, etc.

The following is an example of how to write simple mocks for the `NotificationService` and `UserFormValidator` services using `mockHelper`. These mocks are written using Jasmine's `createSpy()` and `createSpyObj()`, but you can use any spy-generation framework you want, such as `sinon.js` or `jsMockito`.

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

quickmock.mockHelper.js provides the following mock declaration methods:

* **`.mockService()`** - mocks providers declared using angular's `.service()` method
* **`.mockFactory()`** - mocks providers declared using angular's `.factory()` method
* **`.mockFilter()`** - mocks providers declared using angular's `.filter()` method
* **`.mockController()`** - mocks providers declared using angular's `.controller()` method
* **`.mockProvider()`** - mocks providers declared using angular's `.provider()` method
* **`.mockValue()`** - mocks providers declared using angular's `.value()` method
* **`.mockConstant()`** - mocks providers declared using angular's `.constant()` method
* **`.mockAnimation()`** - mocks providers declared using angular's `.animation()` method

When mocks are declared using the methods above, this mocks are registered with quickmock so they can be injected into your tests later.

In order to use `mockHelper`'s functionality, you will need to include the extra [`quickmock.mockHelper.js`](https://github.com/tennisgent/quickmock/blob/master/src/quickmock.mockHelper.js) file when you run your tests. This file must be included immediately after `quickmock.js`:

**Using Karma**
TODO: show files declaration

**Using Jasmine Test Runner**
TODO: show included script tags

####Using a standard Angular module

Some might feel `mockHelper` is too intrusive and might not want the heavy coupling between their mocks and their tests, nor the additional dependency on quickmock. Those are completely understandable concerns. For those developers, there is another way to declare mocks. The alternative works just as well, but the syntax is a little more clumsy. The reason it is clumsy is because of the way angular registers providers. If two providers have the same name, the first will override the second, which is not the desired behavior. So when a specific provider is declared, and then later its mocked version is declared, they can't have the same name or else the original provider will be over written. And they can't have totally different names because quickmock needs to know which mocks correspond with which providers.

So, quickmock matches mocks with their corresponding providers using a predefined prefix.  The default prefix is `___` (three underscores). This can be configured if you prefer a different prefix, but it just needs to be unique enough not to conflict with any other prefixes you might use in your code.

The following is an example of how to write simple mocks for the `NotificationService` and `UserFormValidator` services using a standard angular module:

```javascript
// Declare an Angular module that will contain any mocks you need
angular.module('SampleMocks', [])

	// now declare specific mocks for each of your dependencies
	.service('___NotificationService', [function(){
		return jasmine.createSpyObj('NotificationService', ['error','success','warning','basic','confirm']);
	}])

	.factory('___UserFormValidator', [function(){
		var spy = jasmine.createSpy('UserFormValidator');
		spy.and.returnValue(true);
		return spy;
	}])
```

By using the `___` prefix, quickmock will know how to relate a provider to its mock. When it sees a dependency for the `NotificationService` service, it will instead initialize and inject the `___NotificationService` mock in its place.

To modify the predefined prefix, you can edit line 3 of [`quickmock.js`](https://github.com/tennisgent/quickmock/blob/master/src/quickmock.js).  Just set the `mockPrefix` variable to whatever prefix you wish.

This prefix is exposed as a global via `quickmock.MOCK_PREFIX`. If you wish to make your tests as flexible as possible, you can alternatively define your mocks as shown below:

```javascript
// Declare an Angular module that will contain any mocks you need
angular.module('SampleMocks', [])

	// now declare specific mocks for each of your dependencies
	.service(quickmock.MOCK_PREFIX + 'NotificationService', [function(){
		return jasmine.createSpyObj('NotificationService', ['error','success','warning','basic','confirm']);
	}])

	.factory(quickmock.MOCK_PREFIX + 'UserFormValidator', [function(){
		var spy = jasmine.createSpy('UserFormValidator');
		spy.and.returnValue(true);
		return spy;
	}])
```

This will allow you to change the prefix later in the future, and your mock declarations will not have to be modified. Granted, it makes for a fairly hairy declaration syntax.

###Important Things To Note:

* If you don't have a mock registered for any of the required dependencies, quickmock will throw an error when it tries to inject the mock. So be sure to register a `___`-prefixed mock for each of the tested provider's dependencies. If you wish to delgate to actual implementations of the dependencies, instead of throwing this error, you can set the `useActualDependencies: true` flag on the config object that is passed into quickmock.
* You don't have to provide mocks for `.value()` and `.constant()` providers. If a mock is not available for a `.value()` or `.constant()` provider, quickmock will silently delegate to the actual implementation.