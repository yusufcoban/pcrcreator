"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
	function ModuleManager() {
		_classCallCheck(this, ModuleManager);

		var instances = {};
		this.getInstance = function (obj) {
			return instances[obj];
		};
		this.setInstance = function (key, value) {
			instances[key] = value;
		};
		this.modules = [];
	}

	_createClass(ModuleManager, [{
		key: "attachModule",
		value: function attachModule(module) {
			this.modules.push(module);
			module.manager = this;
			return this;
		}
	}, {
		key: "sendEvent",
		value: function sendEvent(eventName, data) {
			return this.modules.map(function (m) {
				return m.handleEvent(eventName, data);
			});
		}
	}, {
		key: "get",
		value: function get(value) {
			var result = null;
			var iterable = this.modules;
			for (var i = 0, m; i < iterable.length; i++) {
				m = iterable[i];
				var aux = m.get(value);
				result = aux != null ? aux : result;
			}
			return result;
		}
	}, {
		key: "handle",
		value: function handle(type, data) {
			var result = null;
			var iterable = this.modules;
			for (var i = 0, m; i < iterable.length; i++) {
				m = iterable[i];
				if (result != null) {
					return;
				}
				var aux = m.handle(type, data);
				result = aux != null ? aux : result;
			}
			return result;
		}
	}]);

	return ModuleManager;
}();