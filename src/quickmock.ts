/// <reference path="../typings/angularjs/angular.d.ts" />

import IServiceProvider = angular.IServiceProvider;
import IInjectorService = angular.auto.IInjectorService;

module Quickmock {

    export class Quickmock {
        public prefix:string;

        availableProviders:{ [name: string]: Provider };
        modules:string[];
        module:IModule;
        injector:IInjectorService;
        invokeQueue:any[][];
        mocks:{};

        constructor(options:Options) {

            this.modules = ['ng', 'ngMock'].concat(options.modules);
            this.injector = angular.injector(this.modules);
            this.invokeQueue = this.modules
                .map((modName:string) => {
                    let mod:IModule = angular.module(modName);
                    return mod._invokeQueue;
                });

            this.invokeQueue
                .filter((providerData) => {
                    return angular.isString(providerData[2][0])
                        && providerData[2][0].indexOf(mockPrefix) === -1;
                })
                .forEach((providerData:ProviderData) => {
                    let deps = providerData.getDependencies();
                    if (angular.isFunction(deps)) {
                        providerData.setDependencies(this.standardizeAnnotation(deps));
                    }
                    if (angular.isArray(deps)) {
                        deps
                            .map((depName, index) => {
                                if (index !== deps.length - 1 && depName.indexOf(this.prefix) === 0) {
                                    return depName.replace(this.prefix, '');
                                }
                                return depName;
                            })
                    }
                });
        }

        standardizeAnnotation(invokable:Function | any[]) {
            let annotatedDependencies = this.injector.annotate(invokable);
            delete invokable.$inject;
            annotatedDependencies.push(invokable);
            return annotatedDependencies;
        }
    }

    interface Options {
        providerName: string;
        modules: string[];
        mocks: any;
    }

    interface Provider {
        name: string;
        configFn: Function;
        dependencies: {};
        type: IServiceProvider;
    }

    class ProviderData {
        data:any[];

        constructor(data:any[]) {
            this.data = data;
        }

        getDependencies() {
            return this.data[2][1];
        }

        setDependencies(deps:any[]) {
            this.data[2][1] = deps;
        }
    }

}