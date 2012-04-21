define(['cclass','vector'],function(cclass,Vector) {
	return cclass({
		constructor: function(startx, starty, endx, endy, next, previous) {
			this.start = new Vector(startx, starty);
			this.end = new Vector(endx, endy);
			var n = new Vector(0,0);
			n.setV(this.end);
			n.substractV(this.start);
			this.length = n.length();
			n.normalize();
			n.normalLeft();
			this.normal = n;
			this.next = next;
			this.previous = previous;
		}
	});
});
