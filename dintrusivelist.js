define(['cclass'],function(cclass) {
	var DELETE = {};
	var BREAK = {};
	return cclass({
		constructor: function(name) {
			this.root = null;
			this._nextProp = '_next'+name;
			this._prevProp = '_prev'+name;
		},
		push: function(o) {
			if (this._nextProp in o) { debugger; throw "Already in list"; }
			var next = this.root;
			if (next) {
				next[this._prevProp] = o;
			}
			o[this._nextProp] = next;
			o[this._prevProp] = null;
			this.root = o;
			this.each(function(o) {
				if (o[this._nextProp] === o) {
					throw "koek";
				}
			});
		},
		pop: function() {
			this.remove(this.root);
		},
		remove: function(o) {
			if (!(this._nextProp in o)) { debugger; throw "Not in list"; }
			var prev = o[this._prevProp];
			var next = o[this._nextProp];
			if (this.root === o) {
				this.root = next;
			} else {
				prev[this._nextProp] = next;
			}
			if (next) {
				next[this._prevProp] = prev;
			}
			delete o[this._nextProp];
			delete o[this._prevProp];
		},
		each: function(f) {
			var o = this.root;
			if (!o) { return; }
			var next;
			while(o) {
				next = o[this._nextProp];
				var r = f(o,BREAK,DELETE);
				if (r === DELETE) {
					this.remove(o);
					o = next;
					continue;
				} else if (r === BREAK) {
					break;
				} else {
					o = next;
				}
			}
		}
	});
});
