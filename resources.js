define(['eventemitter'],function(eventemitter) {
	function extend(a,b) {
		for(var n in b) { a[n] = b[n]; }
	}
	function resources(g) {
		g.resources = resources;
	}
	resources.toString = Object.prototype.toString;
	extend(resources,{
		images: {},
		audio: {},
		loadImage: function(name,complete,error) {
			var me = this;
			var img = new Image();
			img.src = name+'.png';
			if (complete) {
				img.onload = function() {
					me.images[name] = img;
					complete(img);
				};
			}
			if (error) {
				img.onerror = function() {
					console.error('Could not load image',name);
					error();
				};
			}
			return img;
		},
		loadAudio: function(name,complete,error) {
			var me = this;
			var isdone = false;
			var checkinterval = 10;
			var loadtime = 0;
			var a = new Audio(name+'.wav');
			try {
				a.addEventListener('canplaythrough', markdone, false);
			} catch(e) { }
			function checkReady() {
				if (isdone) { return; }
				if (loadtime > 5000) {
					console.error('Could not load audio',name);
					return error();
				}
				if (a.readyState) {
					markdone();
				} else {
					loadtime += checkinterval;
					setTimeout(checkReady,checkinterval);
				}
			}
			function markdone() {
				a.removeEventListener('canplaythrough', markdone);
				isdone = true;
				me.audio[name] = a;
				complete(a);
			}
			checkReady();
		},
		preload: function(obj,complete,error) {
			var me = this;
			var status = {
				total: 0,
				ready: 0,
				errors: 0
			};
			extend(status,eventemitter);

			function loadMultiple(type,loadfunction) {
				if (!obj[type]) { return; }
				obj[type].forEach(function(name) {
					status.total++;
					me[loadfunction](name,done,error);
				});
			}
			loadMultiple('images','loadImage');
			loadMultiple('audio','loadAudio');

			function done() {
				status.ready++;
				status.emit('changed');
				checkdone();
			}

			function loaderror() {
				status.errors++;
				status.emit('changed');
				checkdone();
			}

			function checkdone() {
				if (status.total <= status.ready+status.errors) {
					if (status.errors > 0) {
						error();
					} else {
						complete();
					}
				}
			}

			return status;
		}
	});
	return resources;
})