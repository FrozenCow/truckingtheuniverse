define(['eventemitter','cclass','objectmanager','graphics'], function(eventemitter,cclass,ObjectManager,Graphics) {
	return cclass(Object,eventemitter,{
		constructor: function(canvas, components) {
			var me = this;

			this.objects = new ObjectManager(['update','draw']);

			this.width = canvas.width;
			this.height = canvas.height;
			this.canvas = canvas;
			this.graphics = new Graphics(canvas.getContext('2d'));

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

				me.emit('preupdate',dt);
				me.objects.lists.update.each(function(o) {
					o.update(dt);
				});
				me.objects.handlePending();
				me.emit('postupdate',dt);

				me.graphics.clear();
				me.emit('predraw', me.graphics);
				me.objects.lists.draw.each(function(o) {
					o.draw(me.graphics);
				});
				me.emit('postdraw', me.graphics);
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
