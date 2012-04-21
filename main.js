var V = {
	jump: 700,
	gravity: 900,
	planetdamping: 0.999,
	playerdamping: 0.999,
	planetsize_max: 100,
	planetsize_min: 50
};

Array.prototype.remove = function(elem) {
	var i = this.indexOf(elem);
	if (i >= 0) {
		return this.splice(i,1);
	}
	console.log('not removed!');
	return null;
};

require(['domready','game','cclass','vector','editor','mouse','collision','staticcollidable','keyboard','quake'],function(domready,Game,cclass,Vector,editor,mouse,collision,StaticCollidable,keyboard,quake) {
	domready(function(){
	"use strict";
	var canvas = document.getElementById('main');
	var g = new Game(canvas, [mouse,keyboard,collision,quake]);
	var camera = new Vector(0,0);
	var quest = null;

	g.objects.addIndex('planet');
	g.objects.addIndex('radius');
	g.objects.addIndex('postdraw');
	g.on('postupdate', function(dt) {
		g.objects.lists.radius.each(function(a) {
			g.objects.lists.radius.each(function(b) {
				if (a !== b) {
					if (a.position.distanceToV(b.position) < a.radius+b.radius) {
						a.touch(b);
					}
				}
			});
		});
	});

	var blackhole = {
		radius: 20,
		position: new Vector(400, 300),
		draw: function(g) {
			g.fillStyle('red');
			g.fillCircle(this.position.x, this.position.y, this.radius);
			g.fillStyle('black');
		},
		update: function(dt) {
			var me = this;
			g.objects.lists.radius.each(function(o) {
				if (o.constructor === Planet) {
					t.setV(o.position);
					t.substractV(me.position);
					t.normalize();
					o.velocity.substractV(t);
				}
			});
		},
		touch: function(o) {
			if (o.constructor === Planet) {
				var oradius = o.radius;
				var oarea = Math.PI*oradius*oradius;
				var myradius = this.radius;

				var overlap = -(this.position.distanceToV(o.position)-oradius-myradius);
				if (overlap > 0) {
					oarea -= overlap*100;

					if (oarea < 300) {
						o.residents.forEach(function(r) {
							r.leavePlanet(0);
						});
						g.objects.remove(o);
					} else {
						oradius = Math.sqrt(oarea/Math.PI);
						o.radius = oradius;
					}
				}
			} else if (o === player) {
				console.log('u died');
			}
		}
	};

	var Planet = cclass({
		constructor: function Planet(x,y,radius) {
			this.residents = [];
			this.radius = radius||5;
			this.position = new Vector(x,y);
			this.velocity = new Vector(0,0);
		},
		planet: true,
		draw: function(g) {
			g.fillCircle(this.position.x, this.position.y, this.radius);
		},
		update: function(dt) {
			this.position.add(this.velocity.x*dt,this.velocity.y*dt);
			this.velocity.multiply(0.999);
		},
		touch: function(o) {
			if (o.constructor === Planet) {
				if (this.radius > o.radius || (this.radius === o.radius && this.x < o.x)) {
					var oradius = o.radius;
					var oarea = Math.PI*oradius*oradius;
					var myradius = this.radius;
					var myarea = Math.PI*myradius*myradius;

					var overlap = -(this.position.distanceToV(o.position)-oradius-myradius);
					if (overlap > 0) {
						oarea -= overlap*100;
						myarea += overlap*100;

						if (oarea < 300) {
							o.residents.forEach(function(r) {
								r.leavePlanet(0);
							});
							g.objects.remove(o);
						} else {
							oradius = Math.sqrt(oarea/Math.PI);
							myradius = Math.sqrt(myarea/Math.PI);

							this.radius = myradius;
							o.radius = oradius;
						}
					}
				}
			} else if (o === player) {
				g.quake(0.1,10);
				if (this.makepowerup) {
					o.use(this.makepowerup());
				}
			}
		}
	});

	var t = new Vector();
	var player = {
		position: new Vector(50,50),
		velocity: new Vector(0,0),
		
		planet: null,
		angle: 0,

		jumping: 0,

		radius: 10,
		movement: 1,
		powerup: null,
		use: function(powerup) {
			if (this.powerup === powerup) { return; }
			if (this.powerup) {
				this.powerup.deactivate();
			}
			this.powerup = powerup;
			this.powerup.activate();
		},
		update: function(dt) {
			if (this.planet) {
				t.set(Math.cos(this.angle),Math.sin(this.angle));
				t.multiply(this.planet.radius+this.radius+1);
				t.addV(this.planet.position);
				this.position.setV(t);
			} else {
				this.position.add(this.velocity.x*dt,this.velocity.y*dt);
				this.velocity.multiply(V.playerdamping);

				var p = closestPlanet(this.position.x,this.position.y);
				if (p) {
					t.setV(p.position);
					t.substractV(this.position);
					t.normalize();
					t.multiply(V.gravity);
					this.velocity.add(t.x*dt,t.y*dt);
				}
			}

			var speed = 100;
			if (this.planet) {
				var circum = Math.PI*this.planet.radius*2;
				circum = Math.max(100,circum);
				this.angle += speed*this.movement/circum*0.5;
			}
		},
		leavePlanet: function(force) {
			if (!this.planet) { throw "What planet?!"; }

			var planetmass = this.planet.radius;
			var mymass = this.radius;
			var totalmass = mymass+planetmass;

			t.set(Math.cos(this.angle),Math.sin(this.angle));
			t.multiply(force);
			
			var f = planetmass/totalmass;
			this.velocity.set(t.x*f,t.y*f);
			this.velocity.addV(this.planet.velocity);
			f = mymass/totalmass;
			this.planet.velocity.substract(t.x*f,t.y*f);

			t.set(Math.cos(this.angle),Math.sin(this.angle));
			t.multiply(this.planet.radius+this.radius+1);
			t.addV(this.planet.position);
			this.position.setV(t);

			this.planet.residents.remove(this);
			this.planet = null;
			this.use(null);
		},
		enterPlanet: function(p) {
			if (!p) { throw "What planet?!"; }
			if (this.planet) { throw "Already on planet!"; }
			this.planet = p;
			this.planet.residents.push(this);
			t.setV(this.position);
			t.substractV(p.position);
			t.normalize();
			this.angle = Math.atan2(t.y,t.x);
			//p.touch(this);
		},
		move: function(dt,vx,vy) {
			var speed = 100;
			if (this.planet) {
				var circum = Math.PI*this.planet.radius*2;
				this.angle += speed*vx/circum*0.5;
			}/* else {
				t.set(vx,vy);
				t.multiply(speed*dt);
				this.velocity.addV(t);
			}*/
		},
		draw: function(g) {
			var px,py,angle;
			if (this.planet) {
				t.set(Math.cos(this.angle),Math.sin(this.angle));
				t.multiply(this.planet.radius+this.radius);
				t.addV(this.planet.position);
				px=t.x;py=t.y;
			} else {
				px=this.position.x;py=this.position.y;
			}
			g.fillCircle(px, py, this.radius);
		},
		touch: function(o) {
			if (this.planet !== o && o.constructor === Planet) {
				if (this.planet) {
					t.set(Math.cos(this.angle),Math.sin(this.angle));
					t.normalRight();
					t.multiply(this.movement);
					var d = t.dot(this.position.x-o.position.x,this.position.y-o.position.y);
					if (d > 0) { return; }
					this.leavePlanet(0);
				}
				this.enterPlanet(o);
			}
		}
	};

	function angleToVector(a,v) {
		v.set(Math.cos(a), Math.sin(a));
		return v;
	}
	function randomAngle(v) {
		var r=Math.random()*Math.PI*2;
		angleToVector(r,v);
		return v;
	}
	quest = {
		goal: randomAngle(new Vector(0,0)).multiply(10000).addV(player.position),
		update: function(dt) {
			if (player.position.distanceToV(this.goal) < 200) {
				player.gotpackage = true;
			}
		},
		postdraw: function(g) {
			if (camera.distanceToV(this.goal) > 300) {
				t.setV(this.goal);
				t.substractV(camera);
				t.normalize();
				t.multiply(300);
				t.addV(camera);
			} else {
				t.setV(this.goal);
			}
			var endx = t.x; var endy = t.y;
			g.fillStyle('red');
			g.fillCircle(t.x,t.y,30);
			g.fillStyle('black');
		}
	};
	g.objects.add(quest);

	g.on('mousedown', function(button) {
		if (button === 0) {
			if (player.planet) {
				player.leavePlanet(V.jump);
			}
		}
	});
	g.on('keydown', function(button) {
		if (button === 'space') {
			if (player.planet) {
				player.leavePlanet(V.jump);
			}
		}
	});

	function closestPlanet(x,y) {
		var resultrange = null;
		var result;
		g.objects.lists.radius.each(function(p,BREAK) {
			if (p.constructor === Planet) {
				var dist = p.position.distanceTo(x,y) - p.radius;
				if (!resultrange || dist < resultrange) {
					resultrange = dist;
					result = p;
				}
			}
		});
		return result;
	}

	function hasPlanets(x,y,r) {
		var result = false;
		g.objects.lists.radius.each(function(p,BREAK) {
			result = p.position.distanceTo(x,y) < r+p.radius;
			if (result) {
				return BREAK;
			}
		});
		return result;
	}

	function outOfBounds(x,y) {
		return x<0 || x>800 || y<0 || y>600;
	}

	var lastradius = 0;
	var lastx = 800/2;
	var lasty = 600/2;
	for (var i=0;i<10;i++) {
		var radius = 50+Math.random()*50;
		var range = lastradius+radius+10+Math.random()*100;
		for(var j=0;j<10;j++) {
			var angle = Math.random()*Math.PI*2;
			var x = Math.cos(angle)*range+lastx;
			var y = Math.sin(angle)*range+lasty;
			if (!outOfBounds(x,y) && !hasPlanets(x,y,radius)) {
				break;
			}
		}
		var p = new Planet(x,y,radius);
		g.objects.add(p);
		g.objects.handlePending();

		if (!player.planet) {
			player.enterPlanet(p);
		}

		lastradius = radius;
		lastx = x;
		lasty = y;
	}

	function slide(a,b) {
		return (b?1:0)-(a?1:0);
	}

	g.on('predraw', function(g) {
		g.save();
		var p = player.position;
		if (player.planet && player.planet.radius < 250) {
			p = player.planet.position;
		}

		var x=p.x;
		var y=p.y;
		camera.set(
			camera.x*0.9+x*0.1,
			camera.y*0.9+y*0.1
		);
		g.context.translate(-camera.x+400, -camera.y+300);
	});

	g.on('postdraw', function(graphics) {
		quest.postdraw(graphics);
		graphics.restore();
	});

	g.on('preupdate', function(dt) {
		player.move(dt,slide(g.keys.left,g.keys.right),-slide(g.keys.down, g.keys.up));
	});

	var time = 0;
	/*g.on('postupdate', function(dt) {
		time +=dt;
		var interval = 0.3;
		while (time > interval) {
			var angle = Math.random()*Math.PI*2;
			var x = 600*Math.cos(angle)+400;
			var y = 600*Math.sin(angle)+300;
			var p = new Planet(x,y,V.planetsize_min+Math.random()*(V.planetsize_max-V.planetsize_min));
			p.velocity.set(Math.cos(angle),Math.sin(angle));
			p.velocity.negate();
			p.velocity.multiply(100);
			g.objects.add(p);
			time -= interval;
		}
	});*/
	g.on('postupdate', function(dt) {
		g.objects.lists.planet.each(function(p) {
			if (p.position.distanceToV(player.position) > 1500) {
				g.objects.remove(p);
			}

			time +=dt;
			var interval = 0.3;
			while (time > interval) {
				var angle = Math.random()*Math.PI*2;
				t.set(Math.cos(angle),Math.sin(angle));
				t.multiply(1000);
				t.addV(player.position);
				
				var r;
				r = V.planetsize_min+Math.random()*(V.planetsize_max-V.planetsize_min);

				if (!hasPlanets(t.x,t.y,r+50)) {
					var p = new Planet(t.x,t.y,r);
					p.velocity.set(Math.cos(Math. random()),Math.sin(Math.random()));
					p.velocity.multiply(Math.random()*30);

					g.objects.add(p);
				}

				time -= interval;
			}
		});
	});

	g.objects.add(player);
	//g.objects.add(blackhole);

	g.start();
});
});
