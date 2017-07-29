
$(function(){
	if(window.location.hash){
		if(window.location.hash.length > 1){
			var loc = window.location.hash.slice(1);
			loc = loc.charAt(0).toLowerCase() + loc.slice(1);
			var k = $('.administrative-area').filter(function(){
				return $(this).data('document') && $(this).data('document').slice(3) === loc;
			});
			if(k.length === 0){
				k = $('.administrative-area')[1];
				loc = 'taipei';
			}
			var name = loc;
			name = name.charAt(0).toUpperCase() + name.slice(1);
			$.getJSON('js/data/'+ $(k).data('document') + '.json', function(r){
				$('#svg').html('');
				initData(r);
				window.location.hash = name;
			});
		}
	}else{
		$.getJSON('js/data/01-taipei.json', function(r){
			$('#svg').html('');
			initData(r);
			window.location.hash = "Taipei";
		});
	}
	$('.administrative-area').on('click', function(){
		if($(this).data('document')){
			var name = $(this).data('document').split('-')[1];
			name = name.charAt(0).toUpperCase() + name.slice(1);
			$.getJSON('js/data/'+ $(this).data('document') + '.json', function(r){
				$('#svg').html('');
				initData(r);
				window.location.hash = name;
			});
		}
	});
});

function initData(datahere){

	var margin = {top: 20, right: 90, bottom: 30, left: 90};
	var width = $(document).width() - 100 - margin.left - margin.right;
	var height = ($(document).height() > 900 ? $(document).height() - 100 : 800 ) - margin.top - margin.bottom;

	var svg = d3
		.select('#svg').append('svg')
		.attr('width', width + margin.right + margin.left)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate('+ margin.left + ',' + margin.top + ')');

	var i = 0;
	var duration = 750;
	var root;

	var treemap = d3.tree().size([height, width]);

	root = d3.hierarchy(datahere, function(d) { return d.children; });
	root.x0 = height / 2;
	root.y0 = 0;

	root.children.forEach(collapse);

	update(root);

	function collapse(d) {
		if(d.children) {
			d._children = d.children
			d._children.forEach(collapse)
			d.children = null
		}
	}

	function update(source) {

		var treeData = treemap(root);

		var nodes = treeData.descendants();
		var links = treeData.descendants().slice(1);

		nodes.forEach(function(d){ d.y = d.depth * 180});


		var node = svg.selectAll('g.node')
			.data(nodes, function(d) {return d.id || (d.id = ++i); });

		var nodeEnter = node.enter().append('g')
				.attr('class', 'node')
				.attr('transform', function(d) {
					return 'translate(' + source.y0 + ',' + source.x0 + ')';
			})
			.on('click', click);

		nodeEnter
			.append('circle')
			.attr('class', 'node')
			.attr('r', 1e-6)
			.style('fill', function(d) {
					return d._children ? 'lightsteelblue' : '#fff';
			});

		nodeEnter.append('text')
				.attr('dy', '.35em')
				.attr('x', function(d) {
						return d.children || d._children ? -13 : 13;
				})
				.attr('text-anchor', function(d) {
						return d.children || d._children ? 'end' : 'start';
				})
				.text(function(d) { return d.data.name; });

		var nodeUpdate = nodeEnter.merge(node);

		nodeUpdate
			.transition()
			.duration(duration)
			.attr('transform', function(d) {
					return 'translate(' + d.y + ',' + d.x + ')';
			});

		nodeUpdate
			.select('circle.node')
			.attr('r', 10)
			.style('fill', function(d) {
					return d._children ? 'lightsteelblue' : '#fff';
			})
			.attr('cursor', 'pointer');


		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr('transform', function(d) {
					return 'translate(' + source.y + ',' + source.x + ')';
			})
			.remove();

		nodeExit.select('circle')
			.attr('r', 1e-6);

		nodeExit.select('text')
			.style('fill-opacity', 1e-6);


		var link = svg.selectAll('path.link')
			.data(links, function(d) { return d.id; });

		var linkEnter = link.enter().insert('path', 'g')
			.attr('class', 'link')
			.attr('d', function(d){
				var o = {x: source.x0, y: source.y0}
				return diagonal(o, o)
			});

		var linkUpdate = linkEnter.merge(link);

		linkUpdate.transition()
				.duration(duration)
				.attr('d', function(d){ return diagonal(d, d.parent) });

		var linkExit = link.exit().transition()
				.duration(duration)
				.attr('d', function(d) {
					var o = {x: source.x, y: source.y}
					return diagonal(o, o)
				})
				.remove();

		nodes.forEach(function(d){
			d.x0 = d.x;
			d.y0 = d.y;
		});

		function diagonal(s, d) {

			path = `M ${s.y} ${s.x}
				C ${(s.y + d.y) / 2} ${s.x},
				${(s.y + d.y) / 2} ${d.x},
				${d.y} ${d.x}`

			return path
		}

		function click(d) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			var siblings = d.parent.children.filter(function(x){return x.data.name !== d.data.name});
			Object.keys(siblings).forEach(function(i){
				collapse(siblings[i]);
			});
			update(d);
		}
	}
}