angular.module('SampleModule', [])
  .service('SampleDependency1', function(){
    return {
      get: angular.noop,
      set: angular.noop
    };
  })
  .mockServiceSpyObj('SampleDependency1', ['get','set'])
  .service('SampleService', ['SampleDependency1', function(SampleDependency1){
    var count = 0;
    return {
      someMethod: function(val){
        return SampleDependency1.get(val);
      },
      someOtherMethod: function(inc){
        return count + inc;
      }
    }
  }]);

describe('SampleService', function(){
  var service;

  beforeEach(function(){
    service = quickmock({
      providerName: 'SampleService',
      moduleNames: ['SampleModule']
    });
  });

  describe('someMethod', function(){
    it('should retreive the given value', function(){
      service.someMethod('myValue');
      expect(service.$mocks.SampleDependency1.get).toHaveBeenCalledWith('myValue');
    });
  });

})
