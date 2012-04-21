define(['cclass'], function(cclass) {
	var VectorClass = {
		constructor: function Vector(x,y) {
			this.x = x;
			this.y = y;
		},
		set: function(x,y) {
			this.x = x;
			this.y = y;
			return this;
		},
		add: function(x,y) {
			this.x += x;
			this.y += y;
			return this;
		},
		substract: function(x,y) {
			this.x -= x;
			this.y -= y;
			return this;
		},
		multiply: function(f) {
			this.x *= f;
			this.y *= f;
			return this;
		},
		divide: function(f) {
			this.x /= f;
			this.y /= f;
			return this;
		},
		length: function() {
			return Math.sqrt(this.x*this.x+this.y*this.y);
		},
		distanceTo: function(x,y) {
			var dx = this.x-x;
			dx*=dx;
			var dy = this.y-y;
			dy*=dy;
			//console.log(dy);
			return Math.sqrt(dx+dy);
		},
		normalize: function() {
			var l = this.length();
			if (l == 0.0) { throw "Normalizing 0!" }
			this.x /= l;
			this.y /= l;
			return this;
		},
		normalizeOr: function(x,y) {
			var l = this.length();
			if (l === 0.0) { this.x = x; this.y = y; return this; }
			this.x /= l;
			this.y /= l;
			return this;
		},
		normalizeOrZero: function() {
			return this.normalizeOr(0,0);
		},
		dot: function(x,y) {
			return this.x * x + this.y * y;
		},
		negate: function() {
			this.x = -this.x;
			this.y = -this.y;
			return this;
		},
		normalRight: function() {
			var tmp = this.x;
			this.x = -this.y;
			this.y = tmp;
			return this;
		},
		normalLeft: function() {
			var tmp = this.x;
			this.x = this.y;
			this.y = -tmp;
			return this;
		},
		equals: function(x,y) {
			return this.x === x && this.y === y;
		},
		toString: function() {
			return 'Vector(' + this.x + ',' + this.y + ')';
		},
		rotate: function(r) {
			var l = this.length();
			var r = Math.atan2(this.y, this.x)+r;
			this.x = Math.cos(r)*l;
			this.y = Math.sin(r)*l;
		}
	};

	// Add helper vector-functions.
	['set','add','substract','multiply','divide','normalizeOr','dot','equals','distanceTo'].forEach(function(name) {
		var f = VectorClass[name];
		VectorClass[name+'V'] = function(v) {
			return f.call(this, v.x, v.y);
		};
	});

	var Vector = cclass(VectorClass);

	Vector.zero = new Vector(0,0);
	Vector.xaxis = new Vector(1,0);
	Vector.yaxis = new Vector(0,1);

	return Vector;
});
