define(function() {
	function rnd() {
		return (Math.random()-0.5)*2;
	}
	return function(g) {
		function quake(time,magnitude) {
			quake.step = magnitude/time;
			quake.magnitude = magnitude;
		};
		g.on('postupdate', function(dt) {
			if (quake.magnitude > 0) {
				quake.magnitude -= quake.step*dt;
				if (quake.magnitude < 0) {
					quake.magnitude = 0;
				}
			}
		});
		g.on('predraw', function(g) {
			g.save();
			g.context.translate(rnd()*quake.magnitude,rnd()*quake.magnitude);
		});
		g.on('postdraw', function(g) {
			g.restore();
		});

		g.quake = quake;
	};
});