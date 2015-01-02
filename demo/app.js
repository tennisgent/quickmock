(function () {

	angular.module('QuickMockDemo', [])

		.service('APIService', ['$http', function($http){
			var api_url = 'http://api.someurl.com';
			return {
				get: function(url){
					return $http.get(api_url + url);
				},
				put: function(url){
					return $http.put(api_url + url);
				},
				post: function(url){
					return $http.post(api_url + url);
				},
				delete: function(url){
					return $http.delete(api_url + url);
				}
			};
		}])

		.value('InvalidUserFormMessages', {
			emailInvalid: 'Please provide a valid email address',
			passwordLength: 'Password must be at least 8 characters in length.',
			passwordInvalid: 'Passwords can only contain letters, numbers, underscores (_) and dashes (-).',
			passwordsDontMatch: 'Passwords do not match.',
			urlInvalid: 'Website URL must be valid. Please check it and try again.'
		})

		.factory('UserFormValidator', ['InvalidFormMessages', function(msg){
			var PASSWORD_REGEX = /^[a-zA-Z0-9_-]{6,18}$/,
				EMAIL_REGEX = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
				URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

			return function(user){
				var response = {valid: false, messages: []};
				if(!user) return response;
				if(!user.email || !user.email.length || !user.email.match(EMAIL_REGEX)){
					response.messages.push(msg.emailInvalid);
				}
				if(!user.password || !user.password.length || user.password.length < 8){
					response.messages.push(msg.passwordLength);
				}
				if(!user.password.match(PASSWORD_REGEX)){
					response.messages.push(msg.passwordInvalid);
				}
				if(user.password !== user.passwordConfirm){
					response.messages.push(msg.passwordsDontMatch);
				}
				if(user.password !== user.passwordConfirm){
					response.messages.push(msg.passwordsDontMatch);
				}
				if(user.website && !user.website.match(URL_REGEX)){
					response.messages.push(msg.urlInvalid);
				}
				response.valid = !response.messages.length;
				return response;
			};
		}])

		.service('NotificationService', ['$log', '$window', function($log, $window){
			return {
				error: function(msg){
					$window.alert('It looks like something went wrong\n\n' + msg);
				},
				success: function(msg){
					$window.alert('Congraduations!\n\n' + msg);
				},
				warning: function(msg){
					$window.alert('Be Careful...\n\n' + msg);
				},
				basic: function(msg){
					$window.alert('Check this out!\n\n' + msg);
				},
				confirm: function(msg){
					return $window.confirm('Confirm Action\n\n' + msg);
				}
			};
		}])

		.controller('FormController', ['$scope', 'APIService', 'UserFormValidator', function($scope, APIService, UserFormValidator){

			APIService.get('/user/me').then(function(data){
				$scope.user = data;
			});

			$scope.editUser = function(){
				$scope.edit = !$scope.edit;
			};

			$scope.saveUser = function(){
				var user = $scope.user,
					verify = UserFormValidator(user);
				if(verify.valid){
					APIService.put('/user/me').then(function(){
						NotificationService.success('User was saved successfully');
					})
				}else{
					angular.forEach(verify.messages, function(msg){
						NotificationService.error(msg);
					});
				}
			}

		}])

})();