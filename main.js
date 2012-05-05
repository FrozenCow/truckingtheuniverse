var V = {
	jump: 700,
	drivespeed: 2300,
	gravity: 900,
	planetdamping: 0.999,
	playerdamping: 0.999,
	planetsize_max: 100,
	planetsize_min: 50,
	dowcatchupspeed: 600,
	dowcatchupdistance: 550,
	dowspeed: 250
};

Array.prototype.remove = function(elem) {
	var i = this.indexOf(elem);
	if (i >= 0) {
		return this.splice(i,1);
	}
	return null;
};

function rnd() {
	return (Math.random()-0.5)*2;
}

function extend(o,extension) {
	for(var i in extension) {
		if (extension.hasOwnProperty(i)) {
			o[i] = extension[i];
		}
	}
}

require(['domready!','game','cclass','vector','editor','mouse','collision','staticcollidable','keyboard','quake','resources'],function(document,Game,cclass,Vector,editor,mouse,collision,StaticCollidable,keyboard,quake,resources) {
	var canvas = document.getElementById('main');
	
	var t = new Vector();
	var u = new Vector();

	var g = new Game(canvas, [mouse,keyboard,resources,collision,quake]);
	var game = g;
	var camera = new Vector(0,0);
	var quest = null;
	g.resources.preload({
		images: ['planet1','planet2','planet3','planet4','planet5','planet6','car','background','planetshadow','arrow','house','shop','dow_head','dow_segment','dow_tail','smoke'],
		audio: ['jump1','jump2','jump3','land','buy','emerge','dowdie','playerdie']
	},startGame,function() {
		console.error('Could not load all files! Continuing anyway...');
		startGame();
	});

	function startGame() {
	var images = g.resources.images;
	var audio = g.resources.audio;
	var messages = [];

	g.objects.addIndex('planet');
	g.objects.addIndex('radius');
	g.chains.update.push(function(dt,next) {
		g.objects.lists.radius.each(function(a) {
			g.objects.lists.radius.each(function(b) {
				if (a !== b) {
					if (a.position.distanceToV(b.position) < a.radius+b.radius) {
						a.touch(b);
					}
				}
			});
		});
		next(dt);
	});

	function extend(o,extension) {
		for(var i in extension) {
			o[i] = extension[i];
		}
	}

	function emitter(image,max,spawnrate,initializeParticle,updateParticle) {
		var i;
		var particles = [];
		for(i=0;i<max;i++) {
			particles.push({active:false});
		}
		var spawntime = spawnrate;
		return {
			update: function(dt) {
				spawntime -= dt;
				if (spawntime < 0) {
					spawntime += spawnrate;
					for(i=0;i<max;i++) {
						if (!particles[i].active) {
							particles[i].active = true;
							initializeParticle(particles[i]);
							break;
						}
					}
				}
				for(i=0;i<max;i++) {
					var p = particles[i];
					if (!p.active) { continue; }
					updateParticle(p,dt);
				}
			},
			draw: function(g) {
				for(i=0;i<max;i++) {
					var p = particles[i];
					if (!p.active) { continue; }
					g.context.globalAlpha = Math.min(1,p.time)*0.5;
					g.context.save();
					g.context.translate(p.posx, p.posy);
					g.context.rotate(p.rot);
					var s = (2-p.time)*0.3;
					g.context.scale(s,s);
					g.drawCenteredImage(image,0,0);
					g.context.restore();
					g.context.globalAlpha = 1;
				}
			}
		};
	}

	function defaultParticleUpdate(p,dt) {
		p.time -= dt;
		if (p.time < 0) {
			p.active = false;
		}
		p.posx += p.velx*dt;
		p.posy += p.vely*dt;
		p.rot += p.rotrate*dt;
	}

	var Planet = cclass({
		constructor: function Planet(x,y,radius,options) {
			this.residents = [];
			this.radius = radius||5;
			this.position = new Vector(x,y);
			this.velocity = new Vector(0,0);

			this.rotationspeed = Math.random()*50;
			this.rotation = Math.random()*Math.PI*2;
			this.attachments = [];
			if (options) {
				extend(this,options);
			}
		},
		planet: true,
		draw: function(g) {
			//g.fillCircle(this.position.x, this.position.y, this.radius);
			if (this.position.distanceToV(camera) < 800+this.radius) {
				var me = this;
				g.scale(me.position.x,me.position.y,me.radius/128,me.radius/128,function() {
					g.circle(me.position.x,me.position.y,128);
					g.context.clip();
					g.rotate(me.position.x,me.position.y,me.rotation, function() {
						g.drawCenteredImage(me.image(),me.position.x+((me.rotationspeed*game.time)%256),me.position.y);
						g.drawCenteredImage(me.image(),me.position.x+((me.rotationspeed*game.time)%256)-256,me.position.y);
					});
					g.drawCenteredImage(images.planetshadow,me.position.x,me.position.y);
					g.context.lineWidth=2;
					g.strokeCircle(me.position.x,me.position.y,127.5);
					g.context.lineWidth=1;
				});

				this.attachments.forEach(function(a) {
					angleToVector(a.angle,t).multiply(me.radius).addV(me.position);
					g.rotate(t.x,t.y,a.angle+Math.PI*0.5,function() {
						g.drawCenteredImage(a.image(),t.x,t.y);
					});
				});
			}
		},
		update: function(dt) {
			this.position.add(this.velocity.x*dt,this.velocity.y*dt);
			this.velocity.multiply(0.999);
		},
		touch: function(o) {
			if (o.constructor === Planet) {
				t.setV(o.position);
				t.substractV(this.position);
				var l = t.length();
				if (l === 0) { return; }
				if (l >= this.radius+o.radius) { return; }
				t.normalize();

				u.setV(o.velocity);
				u.substractV(this.velocity);
				var d = t.dotV(u);

				var oarea = Math.PI*o.radius*o.radius;
				var myarea = Math.PI*this.radius*this.radius;
				var totalarea = oarea+myarea;

				if (u.length() !== 0) {
					u.normalize();
					o.velocity.add(u.x*d*(oarea/totalarea),u.y*d*(myarea/totalarea));
					this.velocity.substract(u.x*d,u.y*d);
				}

				t.multiply(this.radius+o.radius+1);
				t.addV(this.position);
				o.position.setV(t);
			}
		},
		decreaseMass: function(mass) {
			if (this.permanent) { return; }
			var myradius = this.radius;
			var myarea = Math.PI*myradius*myradius;
			myarea -= mass;
			if (myarea < 300) {
				this.residents.forEach(function(r) {
					r.leavePlanet(0);
				});
				g.objects.remove(this);
			} else {
				myradius = Math.sqrt(myarea/Math.PI);
				this.radius = myradius;
			}
		}
	});

	function repeatToArray(c,f) {
		var r = [];
		for(var i=0;i<c;i++) {
			r.push(f(i));
		}
		return r;
	}

	var planets = {
		home: new Planet(0,0,300,{
			image: function() { return images.planet3; },
			rotationspeed: 0,
			attachments: [{
				angle: Math.random()*Math.PI*2,
				image: function() { return images.house; }
			}]
		}),
		groceries: new Planet(7000,Math.random()*500,500,{
			image: function() { return images.planet3; },
			rotationspeed: 0,
			attachments: repeatToArray(5, function(i) {
				i=i+1;
				return {
					angle: i*Math.PI/3+Math.random()*Math.PI/4,
					image: function() { return images.shop; }
				};
			})
		}),
		vulcanic: new Planet(7000+rnd()*500,7000+rnd()*500,500,{
			image: function() { return images.planet6; }
		})
	};

	Object.keys(planets).forEach(function(name) {
		var p = planets[name];
		p.permanent = true;
		g.objects.add(p);
	});

	var player = {
		position: new Vector(50,50),
		velocity: new Vector(0,0),
		
		planet: null,
		angle: 0,

		jumping: 0,

		radius: 10,
		powerup: null,
		movement: 1,
		use: function(powerup) {
			if (this.powerup === powerup) { return; }
			if (this.powerup) {
				this.powerup.deactivate();
				g.objects.remove(this.powerup);
				this.powerup = null;
			}
			this.powerup = powerup;
			if (this.powerup) {
				g.objects.add(this.powerup);
				this.powerup.activate();
			}
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

			if (this.planet) {
				var circum = Math.PI*this.planet.radius*2;
				circum = Math.max(100,circum);
				this.angle += dt*this.movement*V.drivespeed/circum;
			}
			this.smokeEmitter.update(dt);
		},
		leavePlanet: function(force) {
			if (!this.planet) { throw "What planet?!"; }

			var planetmass = this.planet.radius;
			var mymass = this.radius;
			var totalmass = mymass+planetmass;

			var takeOffAngle = this.angle-Math.PI*0.2*this.movement;
			t.set(Math.cos(takeOffAngle),Math.sin(takeOffAngle));
			t.multiply(this.movement);
			t.normalRight();
			t.multiply(force);
			
			var f = planetmass/totalmass;
			this.velocity.set(t.x*f,t.y*f);
			this.velocity.addV(this.planet.velocity);

			/*t.set(Math.cos(this.angle),Math.sin(this.angle));
			t.normalRight();
			t.multiply(1000);
			this.velocity.addV(t);*/

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
			audio.land.play();
			this.planet = p;
			this.planet.residents.push(this);
			t.setV(this.position);
			t.substractV(p.position);
			t.normalize();
			this.angle = Math.atan2(t.y,t.x);

			g.quake(0.1,5);
			if (p.makepowerup) {
				this.use(p.makepowerup(this));
			}
		},
		draw: function(g) {
			var px,py,angle,sx,sy;
			sx=-0.3;sy=0.3;
			if (this.planet) {
				t.set(Math.cos(this.angle),Math.sin(this.angle));
				t.multiply(this.planet.radius+this.radius);
				t.addV(this.planet.position);
				px=t.x;py=t.y;
				angle = this.angle+Math.PI*0.5;
				sx*=this.movement;
			} else {
				px=this.position.x;py=this.position.y;
				angle = Math.atan2(this.velocity.y,this.velocity.x);
				sy*=this.movement;
			}
			this.smokeEmitter.draw(g);
			g.scalerotate(px,py,sx,sy,angle,function() {
				g.drawCenteredImage(images.car,px,py);
			});
		},
		touch: function(o) {
			if (this.planet !== o && o.constructor === Planet) {
				if (this.planet) {
					t.set(Math.cos(this.angle),Math.sin(this.angle));
					t.normalRight();
					var d = t.dot(this.position.x-o.position.x,this.position.y-o.position.y);
					if (d*this.movement > 0) { return; }
					this.leavePlanet(0);
				} else {
					t.setV(o.position);
					t.substractV(this.position);
					t.normalize();
					t.normalRight();
					this.movement = (t.dotV(this.velocity) < 0) ? 1 : -1;
				}
				this.enterPlanet(o);
			}
		}
	};

	player.smokeEmitter = emitter(images.smoke,50,0.01,function(p) {
		randomAngle(t);
		t.multiply(Math.random()*5);
		p.posx = player.position.x+t.x;
		p.posy = player.position.y+t.y;
		p.rotrate = Math.random()*Math.PI*1;
		p.velx = rnd()*10;
		p.vely = rnd()*10;
		p.rot = Math.random()*Math.PI*2;
		p.time = 0.5+Math.random();
	},defaultParticleUpdate);

	var DowSegment = cclass({
		constructor: function(owner,x,y) {
			this.owner = owner;
			this.position = new Vector(x,y);
		},
		update: function(dt) {
			t.setV(this.owner.position);
			t.substractV(this.position);
			var l = t.length();
			if (l === 0) { return; }
			t.normalize();
			if (l > 100) {
				t.multiply(Math.min(l,1000*dt));
				this.position.addV(t);
			}
		},
		drawsegment: function(g) {
			var me = this;
			t.setV(this.owner.position);
			t.substractV(this.position);
			g.rotate(this.position.x,this.position.y,Math.atan2(t.y,t.x),function() {
				g.drawCenteredImage(images.dow_segment,me.position.x,me.position.y);
			});
		}
	});

	var Dow = cclass({
		constructor: function(x,y) {
			this.position = new Vector(x,y);
			this.velocity = new Vector(1,0);
			this.radius = 100;
			var segments = [];
			var prev = this;
			for(var i=0;i<10;i++) {
				var s = new DowSegment(prev,x,y);
				segments.push(s);
				g.objects.add(s);
				prev = s;
			}
			this.segments=segments;
		},
		update: function(dt) {
			t.setV(player.position);
			t.substractV(this.position);
			var dist = t.length();
			t.normalize();
			var speed = V.dowcatchupspeed;
			if (dist < V.dowcatchupdistance) {
				speed = V.dowspeed;
			}
			t.multiply(speed);
			this.velocity.set(this.velocity.x*0.95+t.x*0.05,this.velocity.y*0.95+t.y*0.05);
			this.position.add(this.velocity.x*dt,this.velocity.y*dt);
		},
		draw: function(g) {
			var me = this;
			for(var i=this.segments.length-1;i>=0;i--) {
				this.segments[i].drawsegment(g);
			}
			g.rotate(this.position.x,this.position.y,Math.atan2(this.velocity.y,this.velocity.x),function() {
				g.drawCenteredImage(images.dow_head,me.position.x,me.position.y);
			});
		},
		touch: function(o) {
			if (o === planets.vulcanic) {
				dowdied();
				return;
			}
			if (o.constructor === Planet) {
				t.setV(o.position);
				t.substractV(this.position);
				var l = t.length();
				if (l === 0) { return; }
				t.normalize();

				u.setV(o.velocity);
				u.substractV(this.velocity);
				o.decreaseMass(1000);
			} else if (o === player) {
				playerdied();
			}
		},
		destroy: function() {
			g.objects.remove(this);
			for(var i=this.segments.length-1;i>=0;i--) {
				g.objects.remove(this.segments[i]);
			}
		}
	});

	function angleToVector(a,v) {
		v.set(Math.cos(a), Math.sin(a));
		return v;
	}
	function randomAngle(v) {
		var r=Math.random()*Math.PI*2;
		angleToVector(r,v);
		return v;
	}

	function doQuest(q) {
		if (q === quest) {
			quest.end();
			quest.begin();
			return;
		}
		if (quest) {
			quest.end();
			g.objects.remove(quest);
			g.objects.handlePending();
		}
		if (q && q.HACK) {
			q=goVulcanicPlanet();
		}
		quest = q;
		if (quest) {
			g.objects.add(quest);
			quest.begin();
		}

	}

	function drawArrow(g,p) {
		if (camera.distanceToV(p) > 300) {
			t.setV(p);
			t.substractV(camera);
			t.normalize();
			t.multiply(300);
			t.addV(camera);
		} else {
			t.setV(p);
		}
		var endx = t.x; var endy = t.y;

		g.save();
		g.context.translate(t.x,t.y);
		t.substractV(camera);
		g.context.rotate(Math.atan2(t.y,t.x));

		g.drawCenteredImage(images.arrow,0,0);
		g.restore();
	}


	var dow = null;

	var goHomePostdowQuest = {
		message: 'Go home, drink beer',
		begin: function() {
			messages.push(this.message);
		},
		end: function() {
			messages.remove(this.message);
		},
		goal: function() {
			return planets.home.position;
		},
		draw: function(g) { drawArrow(g,this.goal()); },
		update: function(dt) {
			if (player.position.distanceToV(planets.home.position)-planets.home.radius < 10) {
				doQuest(TempQuest(function() {
					var message = 'Thanks for playing!';
					messages.push(message);
					setTimeout(function() {
						messages.remove(message);
						doQuest(null);
					}, 5000);
				}));
			}
		}
	};

	var goVulcanicPlanet = function() { return {
		HACK: true,
		message: 'OMFG WTF IS THAT?!',
		message2: 'Go to the vulcanic planet',
		begin: function() {
			var me = this;
			randomAngle(t).multiply(100).add(0,-800).addV(player.position);
			
			dow = new Dow(t.x,t.y);
			g.objects.add(dow);

			messages.push(this.message2);
			messages.push(this.message);
			setTimeout(function() {
				messages.remove(me.message);
			}, 2000);
		},
		end:function() {
			messages.remove(this.message);
			messages.remove(this.message2);
			if (dow) {
				dow.destroy();
				dow = null;
			}
		},
		goal: function() {
			return planets.vulcanic.position;
		},
		draw: function(g) { drawArrow(g,this.goal()); },
		dowdied: function() {
			doQuest(TempQuest(function() {
				var message = 'Phew, that thing is dead...';
				messages.push(message);
				setTimeout(function() {
					messages.remove(message);
					doQuest(goHomePostdowQuest);
				}, 1000);
			}));
		},
		checkpoint: function() {
			return planets.groceries;
		}
	}; };

	var goHomePredowQuest = {
		message: 'Go home to drink your beer',
		begin: function(){
			messages.push(this.message);
			setTimeout(function() {
				doQuest(TempQuest(function() {
					var message = 'You hear something rumbing';
					messages.push(message);
					audio.emerge.play();
					setTimeout(function() {
						messages.remove(message);
						doQuest(goVulcanicPlanet());
					}, 2000);
				}));
			}, 10000);
		},
		end:function(){
			messages.remove(this.message);
		},
		goal: function() {
			return planets.home.position;
		},
		draw: function(g) { drawArrow(g,this.goal()); },
		update: function(dt) {
			if (player.position.distanceToV(planets.home.position)-planets.home.radius < 10) {
				doQuest(null);
			}
		}
	};

	var getGroceriesQuest = {
		message: 'Get ur beer at the shop!',
		begin:function(){
			messages.push(this.message);
		},
		end:function(){
			messages.remove(this.message);
		},
		goal: function() {
			return planets.groceries.position;
		},
		update: function(dt) {
			if (player.position.distanceToV(planets.groceries.position)-planets.groceries.radius < 10) {
				doQuest(TempQuest(function() {
					var message = 'BEER GET!';
					messages.push(message);
					audio.buy.play();
					setTimeout(function(){
						messages.remove(message);
						doQuest(goHomePredowQuest);
					},2000);
				}));
			}
		},
		draw: function(g) { drawArrow(g,this.goal()); }
	};

	function playerdied() {
		var checkpoint = quest.checkpoint();
		var q = quest;
		
		audio.playerdie.play();
		if (player.planet) {
			player.leavePlanet();
		}
		player.enterPlanet(checkpoint);
		doQuest(TempQuest(function() {
			setTimeout(function() {
				doQuest(q);
			},3000);
		}));
	}

	function dowdied() {
		audio.dowdie.play();
		if (dow) {
			g.objects.remove(dow);
			dow = null;
		}
		if (quest.dowdied) {
			quest.dowdied();
		}
	}

	function TempQuest(f) {
		return {
			begin:function(){f();},
			end:function(){},
			draw:function(){}
		};
	}

	doQuest(getGroceriesQuest);

	function jump() {
		if (player.planet) {
			g.quake(0.1,10);
			audio['jump'+(Math.floor(Math.random()*3)+1)].play();
			player.leavePlanet(V.jump);
		}
	}

	g.on('mousedown', function(button) {
		if (button === 0) {
			jump();
		}
	});
	g.on('keydown', function(button) {
		if (button === 'space') {
			jump();
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

	function slide(a,b) {
		return (b?1:0)-(a?1:0);
	}


	g.chains.draw.push(function(g,next) {
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

		function drawBackground() {
			var offx = camera.x-400;
			var offy = camera.y-300;
			offx = Math.floor(offx/256)*256;
			offy = Math.floor(offy/256)*256;

			for(var x=0;x<5;x++) {
				for(var y=0;y<4;y++) {
					g.drawImage(images.background,offx+x*256,offy+y*256);
				}
			}
		}
		drawBackground();

		next(g);
		if (quest) {
			quest.draw(g);
		}
		g.restore();

		var messageboxHeight = 80;
		var messageboxWidth = 350;
		y = 600-messageboxHeight;
		messages.forEach(function(m) {
			g.fillStyle('rgba(0,0,0,0.5)');
			g.fillRectangle(800-messageboxWidth,y,messageboxWidth,messageboxHeight);
			g.fillStyle('white');
			g.context.font = '20pt Arial';
			g.context.fillText(m,800-messageboxWidth+20,y+30,messageboxWidth);
			g.fillStyle('black');
			y -= messageboxHeight;
		});
	});

	function tryPlacePlanet(x,y) {
		var r;
		r = V.planetsize_min+Math.random()*(V.planetsize_max-V.planetsize_min);

		if (!hasPlanets(x,y,r+50)) {
			var p = new Planet(x,y,r);
			p.velocity.set(Math.cos(Math.random()),Math.sin(Math.random()));
			p.velocity.multiply(Math.random()*30);

			var type = Math.floor(Math.random()*5)+1;
			p.image = function() { return images['planet'+type]; };
			g.objects.add(p);

			return p;
		}
		return null;
	}


	function placeInitialPlanets() {
		populateArea(0,0);
	}

	function populateArea(x,y) {
		for (var i=0;i<30;i++) {
			randomAngle(t).multiply(600+Math.random()*500).add(x,y);
			var p = tryPlacePlanet(t.x,t.y);
			p.velocity.set(0,0);
		}
	}

	placeInitialPlanets();

	var time = 0;

	g.chains.update.push(function(dt,next) {
		g.objects.lists.planet.each(function(p) {
			if (!p.permanent && p.position.distanceToV(player.position) > 1500) {
				g.objects.remove(p);
			}

			time +=dt;
			var interval = 0.3;
			while (time > interval) {
				var angle = Math.random()*Math.PI*2;
				t.set(Math.cos(angle),Math.sin(angle));
				t.multiply(1000);
				t.addV(player.position);
				
				tryPlacePlanet(t.x,t.y);

				time -= interval;
			}
		});
		next(dt);
	});

	g.objects.add(player);
	//g.objects.add(blackhole);

	g.start();
	}
});
