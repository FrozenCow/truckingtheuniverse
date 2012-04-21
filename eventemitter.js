define(function() {
	return {
		_getEvents: function() {
			var e = this.events;
			if (!e) {
				return this.events = e = {};
			}
			return e;
		},
		on: function(name, fun) {
			var me = this;
			var l = me._getEvents()[name];
			if (!l) { l = me.events[name] = []; }
			l.push(fun);
			return this;
		},
		once: function(name, fun) {
			var me = this;
			me.on(name, function wrapper(arg) {
				if (me.removeListener(name, wrapper)) {
					fun(arg);
				}
			});
		},
		removeListener: function(name, fun) {
			var me = this;
			var l = me._getEvents()[name];
			if (l) {
				var index = l.indexOf(fun);
				if (index >= 0) {
					l.splice(index, 1);
					return true;
				}

			}
			return false;
		},
		emit: function(/* name, ... */) {
			var me = this;
			var name = arguments[0];
			var callbackArguments = Array.prototype.slice.call(arguments, 1);
			var l = this._getEvents()[name];
			if (l) {
				l.forEach(function(f) {
					f.apply(me, callbackArguments);
				});
			}
		}
	};
});
