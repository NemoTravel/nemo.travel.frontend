'use strict';

function initAnalytics($) {
	function Analytics() {}

	Analytics.tap = function (eventName, params) {
		if ($) {
			var options = $.extend({
				noPrefix: false,
				value: null
			}, params);

			var info = {};
			
			if (options.value) {
				info.value = options.value;
			}
			
			if (options.name) {
				info.name = options.name;
			}

			if (!options.noPrefix) {
				eventName = 'analytics.' + eventName;
			}

			console.log(eventName);

			$(document).trigger(eventName, info);
		}
	};
	
	return Analytics;
}

if (typeof define === 'function') {
	define(
		['jquery'],
		function ($) {
			return initAnalytics($);
		}
	);
}
else {
	window.Analytics = initAnalytics(window.jQuery || window.$);
}