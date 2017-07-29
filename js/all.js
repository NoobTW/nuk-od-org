var root;
var treemap;
var svg;
var i = 0;
var duration = 350;
var margin = {top: 20, right: 20, bottom: 30, left: 120};
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var aspect = height / width;

$(function(){
	console.log('kkk');
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
			var documentName = $(this).data('document');
			$.getJSON('js/data/'+ $(this).data('document') + '.json', function(r){
				$('#svg').html('');
				initData(r);
			});
		}
	});

	$('.open-all').on('click', function(){
		root.children.forEach(expand);
		update(root);
		update(root);
	})

	$('.close-all').on('click', function(){
		root.children.forEach(collapse);
		update(root);
	});

	$(window).resize(function() {
		$(theSvg).attr('width', $('#svg').width());
		$(theSvg).attr('height', $('#svg').height());
	});

	window.onpopstate = function(){
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
});

function collapse(d) {
	if (d.children) {
		d._children = d.children;
		d._children.forEach(collapse);
		d.children = null;
	}
}

function expand(d) {
	if (d._children) {
		d.children = d._children;
		d.children.forEach(expand);
		d._children = null;
	}
}

function update(source) {

	var deepest = getDepth();
	if($('.node-' + (deepest-1)).length * 25 > height){
		treemap = d3.tree().size([$('.node-' + (deepest-1)).length * 25, width]);
	}else{
		treemap = d3.tree().size([height, width]);
	}

	var treeData = treemap(root);

	var nodes = treeData.descendants();
	var links = treeData.descendants().slice(1);

	nodes.forEach(function(d){ d.y = d.depth * 180});


	var node = svg.selectAll('g.node')
		.data(nodes, function(d) {return d.id || (d.id = ++i); });

	var nodeEnter = node.enter().append('g')
			.attr('class', function(d){
				return 'node node-' + d.depth;
			})
			.attr('transform', function(d) {
				return 'translate(' + source.y0 + ',' + source.x0 + ')';
		})
		.on('click', click);

	nodeEnter
		.append('rect')
		.attr('width', function(d){
			if(d.depth === 0){
				return d.data.name.length * 20 + 15;
			}
			return d.data.name.length*15 + 15
		})
		.attr('height', '20')
		.attr('x', function(d){
			if(d.depth === 0){
				return d.data.name.length*-20 +3 ;
			}
			return -10;
		})
		.attr('y', -10).attr('rx', 5).attr('ry', 5)
		.style('fill', '#FFFF8D').style('stroke-width', '2px').style('stroke', '#ccc');

	nodeEnter
		.append('circle')
		.attr('class', 'node')
		.attr('r', 5)
		.style('fill', function(d) {
				return d._children ? 'lightsteelblue' : '#fff';
		});

	nodeEnter.append('text')
			.attr('dy', '.35em')
			.attr('x', function(d) {
					return d.depth === 0 ? -8 : 8;
			})
			.attr('text-anchor', function(d) {
					return d.depth === 0 ? 'end' : 'start';
			})
			.attr('class', function(d){
				return d.depth === 0 ? 'root' : '';
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
		.attr('r', 5)
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

	nodeExit.select('rect')
		.style('stroke-opacity', 1e-6)
		.style('fill-opacity', 1e-6);

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
			${d.y} ${d.x}`;
		return path;
	}

	function click(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		// if(d.parent){
		// 	var siblings = d.parent.children.filter(function(x){return x.data.name !== d.data.name});
		// 	Object.keys(siblings).forEach(function(i){
		// 		collapse(siblings[i]);
		// 	});
		// }
		update(d);
	}
}

function getDepth(obj) {
	if(!obj) obj = root;
	var depth = 0;
	if (obj.children) {
		obj.children.forEach(function (d) {
			var tmpDepth = getDepth(d)
			if (tmpDepth > depth) {
				depth = tmpDepth;
			}
		})
	}
	return 1 + depth;
}

function initData(datahere){

	svg = d3
		.select('#svg').append('svg')
		.attr('width', $('#svg').width())
		.attr('height', $('#svg').height())
		.attr("preserveAspectRatio", "xMidYMid")
		.attr('viewBox', '0 0 800 800')
		.attr('id', 'the-svg')
		.append('g')
		.attr('transform', 'translate('+ margin.left + ',' + margin.top + ')');

	treemap = d3.tree().size([height, width]);

	root = d3.hierarchy(datahere, function(d) { return d.children; });
	root.x0 = height / 2;
	root.y0 = 0;

	root.children.forEach(expand);

	update(root);
	update(root);

	theSvg = $('#the-svg')[0];
	svgPanZoom(theSvg);

	document.title = root.data.name + '局處單位';
	console.log(root.data.name + ' initialized');
}
