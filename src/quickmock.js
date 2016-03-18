/// <reference path="../typings/angularjs/angular.d.ts" />
module.exports = Quickmock;
var Quickmock = (function () {
    function Quickmock(options) {
        var _this = this;
        this.modules = ['ng', 'ngMock'].concat(options.modules);
        this.injector = angular.injector(this.modules);
        this.invokeQueue = this.modules
            .map(function (modName) {
            var mod = angular.module(modName);
            return mod._invokeQueue;
        });
        this.invokeQueue
            .filter(function (providerData) {
            return angular.isString(providerData[2][0])
                && providerData[2][0].indexOf(mockPrefix) === -1;
        })
            .forEach(function (providerData) {
            var deps = providerData.getDependencies();
            if (angular.isFunction(deps)) {
                providerData.setDependencies(_this.standardizeAnnotation(deps));
            }
            if (angular.isArray(deps)) {
                deps
                    .map(function (depName, index) {
                    if (index !== deps.length - 1 && depName.indexOf(_this.prefix) === 0) {
                        return depName.replace(_this.prefix, '');
                    }
                    return depName;
                });
            }
        });
    }
    Quickmock.prototype.standardizeAnnotation = function (invokable) {
        var annotatedDependencies = this.injector.annotate(invokable);
        delete invokable.$inject;
        annotatedDependencies.push(invokable);
        return annotatedDependencies;
    };
    return Quickmock;
}());
var ProviderData = (function () {
    function ProviderData(data) {
        this.data = data;
    }
    ProviderData.prototype.getDependencies = function () {
        return this.data[2][1];
    };
    ProviderData.prototype.setDependencies = function (deps) {
        this.data[2][1] = deps;
    };
    return ProviderData;
}());
