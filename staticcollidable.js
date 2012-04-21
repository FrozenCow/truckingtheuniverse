define(['cclass','vector','linesegment'],function(cclass,Vector,LineSegment) {
	function pointsToSegments(points) {
		// Create segments from points.
		var lineSegments = [];
		var prevPoint = points[points.length-1];
		points.forEach(function(point) {
			lineSegments.push(new LineSegment(prevPoint.x, prevPoint.y, point.x, point.y));
			prevPoint = point;
		});

		// Link segments (next/previous)
		var prev = lineSegments[lineSegments.length-1];
		lineSegments.forEach(function(segment,i) {
			segment.previous = prev;
			prev.next = segment;
			prev = segment;
		});

		return lineSegments;
	}

	return cclass({
		constructor: function(imageUrl,points) {
			if (imageUrl) {
				this.image = new Image(imageUrl);
			}
			this.collisionlines = pointsToSegments(points);
			function max(a,f) {
				var r = null;
				a.forEach(function(e) {
					if (!r || f(e,a)) {
						r= e;
					}
				});
				return r;
			}
			this.bounds = {
				left: max(this.collisionlines, function(a,b) { return a.x < b.x; }),
				right: max(this.collisionlines, function(a,b) { return a.x > b.x; }),
				top: max(this.collisionlines, function(a,b) { return a.y < b.y; }),
				bottom: max(this.collisionlines, function(a,b) { return a.y > b.y; })
			};
			this.position = new Vector((this.bounds.left+this.bounds.right)/2,(this.bounds.top+this.bounds.bottom)/2);
		},
		draw: function(g) {
			if (this.image) {
				g.drawImage(this.image,this.position.x-this.image.width/2,this.position.y-this.image.height/2);
			} else {
				g.context.beginPath();
				var b = true;
				this.collisionlines.forEach(function(ls) {
					if (b) {
						g.context.moveTo(ls.start.x,ls.start.y);
						b=false;
					}
					g.context.lineTo(ls.end.x,ls.end.y);
				});
				g.context.closePath();
				g.context.fill();
			}
		}
	});
});
