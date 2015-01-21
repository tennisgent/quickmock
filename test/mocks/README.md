Writing Mocks
-------------

Where do those mocks come from?  We can provide mocks for each of the dependencies by creating a separate javascript file and writing a separate Angular module to contain those mocks. You can find examples in [`mocksModule.js`](https://github.com/tennisgent/quickmock/blob/master/test/mocksModule.js). Here is an one example:

```javascript
angular.module('QuickMockDemoMocks', [])
	.factory('___$window', [function() {
		return jasmine.createSpyObj('$window', ['alert','confirm']);
	}])
```

Notice the prefix to the name of the `___$window` mock. By declaring each mocked service with a pre-defined prefix, quickmock will know which mocks relate to which services. The default prefix is `'___'` (three underscores), but this prefix is configurable if you prefer a different one.  The great thing about these mocks is that they can be reused every time you need to test any future services that have these same dependencies.

**Important:** If you don't have a mock registered for any of the required dependencies, quickmock will throw an error when it tries to inject the mock. So be sure to register a `___`-prefixed mock for each of the tested provider's dependencies. If you wish to delgate to actual implementations of the dependencies, instead of throwing this error, you can set the `useActualDependencies: true` flag on the config object that is passed into quickmock.

**NOTE:** You don't have to provide mocks for `.value()` and `.constant()` providers. These dependencies are always delegated to the actual implementations. So, in our example, we don't have to mock out the `NotificationTitles` object because it is a `value` provider. 