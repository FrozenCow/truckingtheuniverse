define(['cclass'],function(cclass) {
	return cclass({
		constructor: function(context) {
			this.context = context;
		},
		clear: function() {
			this.save();
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.context.clearRect(0, 0, 9000, 9000);
			this.restore();
		},
		fillStyle: function(s) {
			if (s) { this.context.fillStyle = s; }
			else { return s; }
		},
		strokeStyle: function(s) {
			if (s) { this.context.strokeStyle = s; }
			else { return s; }
		},
		circle: function(x,y,radius) {
			this.context.beginPath();
			this.context.arc(x, y, radius, 0, Math.PI*2, true);
			this.context.closePath();
		},
		rectangle: function(x,y,w,h) {
			this.context.rect(x,y,w,h);
		},
		polygon: function(points) {
			this.context.beginPath();
			if (points.length > 0) {
				this.context.moveTo(points[0].x,points[0].y);
				for(var i=1;i<points.length;i++) {
					this.context.lineTo(points[i].x,points[i].y);
				}
			}
			this.context.closePath();
		},
		strokePolygon: function(points) {
			this.polygon(points);
			this.context.stroke();
		},
		fillPolygon: function(points) {
			this.polygon(points);
			this.context.fill();
		},
		strokeRectangle: function(x,y,w,h) {
			this.context.strokeRect(x,y,w,h);
		},
		fillRectangle: function(x,y,w,h) {
			this.context.fillRect(x,y,w,h);
		},
		strokeCircle: function(x,y,radius) {
			this.circle(x,y,radius);
			this.context.stroke();
		},
		fillCircle: function(x,y,radius) {
			this.circle(x,y,radius);
			this.context.fill();
		},
		line: function(x1,y1,x2,y2) {
			this.context.beginPath();
			this.context.moveTo(x1,y1);
			this.context.lineTo(x2,y2);
			this.context.closePath();
		},
		strokeLine: function(x1,y1,x2,y2) {
			this.line(x1,y1,x2,y2);
			this.context.stroke();
		},

		rotate: function(x,y,r,rotated) {
			this.save();
			this.context.translate(x,y);
			this.context.rotate(r);
			this.context.translate(-x,-y);
			rotated();
			this.restore();
		},
		scale: function(x,y,sx,sy,scaled) {
			this.save();
			this.context.translate(x,y);
			this.context.scale(sx,sy);
			this.context.translate(-x,-y);
			scaled();
			this.restore();
		},
		scalerotate: function(x,y,sx,sy,r,rotatedscaled) {
			this.save();
			this.context.translate(x,y);
			this.context.rotate(r);
			this.context.scale(sx,sy);
			this.context.translate(-x,-y);
			rotatedscaled();
			this.restore();
		},
		drawImage: function(img,sx,sy,sw,sh,dx,dy,dw,dh) {
			if (img) {
				this.context.drawImage.apply(this.context,arguments);
			}
		},
		drawCenteredImage: function(img,x,y) {
			if (img) {
				this.context.drawImage(img,x-img.width/2,y-img.height/2);
			}
		},
		loadImage: function(name,complete,error) {
			var img = new Image();
			img.src = name+'.png';
			if (complete) {
				img.onload = function() {
					complete(img);
				};
			}
			if (error) {
				img.onerror = error;
			}
			return img;
		},
		loadAnimation: function(name,sizex,sizey,frames,complete,error) {
			var me = this;
			this.loadImage(name,function(image) {
				complete({
					frame: 0,
					rate: 1,
					update: function(dt) {
						var rate = this.rate;
						this.frame += dt*rate;
						while (this.frame > rate*frames) { this.frame -= rate*frames; }
					},
					draw: function(ctx,dx,dy,dw,dh) {
						var frame = Math.floor(this.frame);
						me.context.drawImage(image,sizex*frame,0,sizex,sizey,dx,dy,dw,dh);
					}
				});
			},error);
		},
		save: function() {
			if (!this._depth) { this._depth = 0; }
			this._depth++;
			this.context.save();
		},
		restore: function() {
			if (this._depth <= 0) { debugger; console.log('NOES'); throw "NOES"; }
			this.context.restore();
			this._depth--;
		}
	});
});