define(['vector','staticcollidable'],function(Vector,StaticCollidable){
	return function(g) {
		g.objects.addIndex('serialize');
		var tools = {
			'0': { // Draw
				mousemove: function(x,y) {
					if (g.mouse.buttons[0]) {
						polygon[polygon.length-1].set(x,y);
					}
				},
				mousedown: function(button,x,y) {
					if (button === 0) {
						polygon.push(new Vector(x,y));
					}
				},
				keydown: function(key) {
					if (key === 'enter') {
						g.objects.add(new StaticCollidable(null,polygon));
						polygon=[];
					}
				},
				postdraw: function(g) {
					g.strokeStyle('black');
					g.strokePolygon(polygon);
				}
			},
			'1': { // Place objects
				mousedown: function(button,x,y) {
				}
			}
		};
		var tool = tools[0];
		var polygon = [];
		function pass(name) {
			g.on(name, function() {
				if (tool[name]) {
					tool[name].apply(tool, arguments);
				}
			});
		}
		pass('mousemove');
		pass('mousedown');
		pass('mouseup');
		pass('keydown');
		pass('keyup');
		//pass('predraw');
		//pass('postdraw');

		g.on('keydown', function(button) {
			if (tools[button]) {
				tool = tools[button];
			}
		});
	};
});