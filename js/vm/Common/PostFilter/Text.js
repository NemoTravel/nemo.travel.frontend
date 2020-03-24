'use strict';
define(
	['knockout', 'jquery','js/vm/helpers', 'js/vm/Common/PostFilter/Abstract', 'js/vm/EventManager'],
	function (ko, $, helpers, BaseModel) {
		function PostFilterText(initialData, controller) {
			BaseModel.apply(this, arguments);

			this.inputValue = ko.observable('');
			this.isOpen = ko.observable(false);
		}

		PostFilterText.prototype.toggle = function () {
			this.isOpen(!this.isOpen());
			this.value('');
		};

		PostFilterText.prototype.inputBlur = function () {
			if (!this.value()) {
				this.isOpen(false);
			}
		};

		PostFilterText.prototype.setFocus = function () {
			this.isOpen(true);

			var name = this.config.name;

			setTimeout(function () {
				$('.js-postFilters-text__' + name).focus();
			});
		};

		helpers.extendModel(PostFilterText, [BaseModel]);

		PostFilterText.prototype.buildInternalValues = function () {
			return ['', ''];
		};

		PostFilterText.prototype.computeStatus = function () {
			if (this.value().length > 0) {
				this.status(this.CONST_STATUS_HASVALUE);

				$('html, body').animate({scrollTop: 0}, 300);
			}
			else {
				this.status(this.CONST_STATUS_CLEARED);
			}
		};

		PostFilterText.prototype.clear = function () {
			this.value('');
			this.isOpen(false);
		};

		PostFilterText.prototype.checkValue = function (obj) {
			var data = this.config.getter(obj);

			return data.toLowerCase().indexOf(this.value().toLowerCase()) !== -1;
		};

		return PostFilterText;
	}
);
