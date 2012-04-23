define(['cclass','intrusivelist','dintrusivelist'],function(cclass,IntrusiveList,DIntrusiveList) {
	return cclass({
		constructor: function(lists) {
			var me = this;
			this.lists = {};
			this.objects = new DIntrusiveList('object');
			this.named = {};
			if (lists) {
				lists.forEach(function(n) {
					me.lists[n] = new DIntrusiveList(n);
					me.lists[n].property = n;
				});
			}
			this.pendingAdd = new IntrusiveList('pendingAdd');
			this.pendingRemove = new IntrusiveList('pendingRemove');
		},
		add: function(o) {
			this.pendingAdd.push(o);
		},
		addIndex: function(property) {
			if (this.lists[property]) {
				return;
			}
			var list = this.lists[property] = new DIntrusiveList(property);
			this.lists[property].property = property;
			this.objects.each(function(o) {
				list.push(o);
			});
		},
		remove: function(o) {
			this.pendingRemove.push(o);
		},
		handlePending: function() {
			var me = this;
			me.pendingAdd.each(function(o,_,DELETE) {
				me.objects.push(o);
				for(var n in me.lists) {
					if (o[me.lists[n].property]) {
						me.lists[n].push(o);
					}
				}
				if (o.name) {
					if (me.named[o.name]) {
						throw "Another object with the same name was already added.";
					}
					me.named[o.name] = o;
				}
				return DELETE;
			});
			me.pendingRemove.each(function(o,_,DELETE) {
				delete o.__pendingRemove;
				for(var n in me.lists) {
					if (o[me.lists[n].property]) {
						me.lists[n].remove(o);
					}
				}
				if (o.name) {
					delete me.named[o.name];
				}
				return DELETE;
			});
		}
	});
});
