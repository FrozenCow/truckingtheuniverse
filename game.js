define(['eventemitter','cclass','objectmanager','graphics'], function(eventemitter,cclass,ObjectManager,Graphics) {
	function chain(fs,next) {
		function call(i,args) {
			if (i < fs.length) {
				var f = fs[i];
				var fargs = [function(){return call(i+1,arguments);}];
				Array.prototype.unshift.apply(fargs,args);
				return f.apply(null,fargs);
			} else {
				return next.apply(null,args);
			}
		}
		return function(/*...*/) {
			call(0,arguments);
		};
	}

	return cclass(Object,eventemitter,{
		constructor: function(canvas, components) {
			var me = this;

			this.objects = new ObjectManager(['update','draw']);
			this.chains = {
				draw: [],
				update: []
			};

			this.width = canvas.width;
			this.height = canvas.height;
			this.canvas = canvas;
			this.graphics = new Graphics(canvas.getContext('2d'));
			this.time = 0;

			if (components) {
				components.forEach(function(c) {
					c(me);
				});
				this.components = components;
			}
		},
		start: function() {
			if (this.isRunning) { throw 'Already started'; }
			var me = this;
			var runningToken = {};
			me.time = 0;
			me.running = runningToken;
			this.canvas.setAttribute('tabIndex', '0');
			this.canvas.focus();

			var requestAnimationFrame =
				window.requestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) { window.setTimeout(callback, 1000 / 60); };

			var lastUpdate=new Date().getTime();
			requestAnimationFrame(update);
			function update() {
				var now=new Date().getTime();
				var dt = (now-lastUpdate)/1000;
				lastUpdate = now;
				dt = Math.min(1/30,dt);

				me.time += dt;

				chain(me.chains.update,function(dt) {
					me.objects.lists.update.each(function(o) {
						o.update(dt);
					});
					me.objects.handlePending();
				})(dt);

				me.graphics.clear();

				chain(me.chains.draw,function(g) {
					me.objects.lists.draw.each(function(o) {
						o.draw(g);
					});
				})(me.graphics);

				if (me.running === runningToken) {
					requestAnimationFrame(update);
				}
			}
		},
		stop: function() {
			delete this.running;
		}
	});
});
