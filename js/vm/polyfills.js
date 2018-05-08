'use strict';
define(
	['js/lib/polyfills/fetch.min', 'js/lib/polyfills/promise.min'],
	function () {
		return (function () {
			if (!Array.prototype.find) {
				Array.prototype.find = function (predicate) {
					if (this == null) {
						throw new TypeError('Array.prototype.find called on null or undefined');
					}
					if (typeof predicate !== 'function') {
						throw new TypeError('predicate must be a function');
					}

					var list = Object(this);
					var length = list.length >>> 0;
					var thisArg = arguments[1];
					var value;

					for (var i = 0; i < length; i++) {
						value = list[i];
						if (predicate.call(thisArg, value, i, list)) {
							return value;
						}
					}

					return undefined;
				};
			}

			if (typeof Object.create !== 'function') {
				// Production steps of ECMA-262, Edition 5, 15.2.3.5
				// Reference: http://es5.github.io/#x15.2.3.5
				Object.create = (function() {
					// To save on memory, use a shared constructor
					function Temp() {}

					// make a safe reference to Object.prototype.hasOwnProperty
					var hasOwn = Object.prototype.hasOwnProperty;

					return function (O) {
						// 1. If Type(O) is not Object or Null throw a TypeError exception.
						if (typeof O !== 'object') {
							throw TypeError('Object prototype may only be an Object or null');
						}

						// 2. Let obj be the result of creating a new object as if by the
						//    expression new Object() where Object is the standard built-in
						//    constructor with that name
						// 3. Set the [[Prototype]] internal property of obj to O.
						Temp.prototype = O;
						var obj = new Temp();
						Temp.prototype = null; // Let's not keep a stray reference to O...

						// 4. If the argument Properties is present and not undefined, add
						//    own properties to obj as if by calling the standard built-in
						//    function Object.defineProperties with arguments obj and
						//    Properties.
						if (arguments.length > 1) {
							// Object.defineProperties does ToObject on its first argument.
							var Properties = Object(arguments[1]);
							for (var prop in Properties) {
								if (hasOwn.call(Properties, prop)) {
									obj[prop] = Properties[prop];
								}
							}
						}

						// 5. Return obj
						return obj;
					};
				})();
			}
		})();
	}
);
