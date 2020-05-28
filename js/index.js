// Program: tfprof
// Author: twhuang
'use strict';
// ----------------------------------------------------------------------------

//// Example: Matrix multiplication
//$('#tfp_matmul').on('click', function() {
//  tfp_render_matmul();
//})
//
//$('#tfp_kmeans').on('click', function() {
//  tfp_render_kmeans();
//})
//
//$('#tfp_inference').on('click', function() {
//  tfp_render_inference();
//})
//
//$('#tfp_dreamplace').on('click', function() {
//  tfp_render_dreamplace();
//})
//
//// textarea changer event
//$('#tfp_textarea').on('input propertychange paste', function() {
//
//  if($(this).data('timeout')) {
//    clearTimeout($(this).data('timeout'));
//  }
//
//  $(this).data('timeout', setTimeout(()=>{
//    
//    var text = $('#tfp_textarea').val().trim();
//    
//    $('#tfp_textarea').removeClass('is-invalid');
//
//    if(!text) {
//      return;
//    }
//    
//    try {
//      var json = JSON.parse(text);
//      //console.log(json);
//      feed(json);
//    }
//    catch(e) {
//      $('#tfp_textarea').addClass('is-invalid');
//      console.error(e);
//    }
//
//  }, 2000));
//});
//
//function tfp_render_simple() {
//  feed(simple);
//  $('#tfp_textarea').text(JSON.stringify(simple, null, 2));
//}
//
//function tfp_render_matmul() {
//  feed(matmul);
//  $('#tfp_textarea').text(JSON.stringify(matmul));
//}
//
//function tfp_render_kmeans() {
//  feed(kmeans);
//  $('#tfp_textarea').text(JSON.stringify(kmeans));
//}
//
//function tfp_render_inference() {
//  feed(inference);
//  $('#tfp_textarea').text(JSON.stringify(inference))
//}
//
//function tfp_render_dreamplace() {
//  //feed(dreamplace);
//  feed(opentimer);
//  $('#tfp_textarea').text(JSON.stringify(dreamplace))
//}

// ----------------------------------------------------------------------------

// DOM objects
//make_tfp_structure();

const tfp = {
  
  // DOMAIN (data) -> RANGE (graph)

  // main timeline svg
  dom : null,
  svg : null,
  width: null,
  height: null,
  topMargin: 30,
  bottomMargin: 30,
  leftMargin: 100,
  rightMargin: 100,
  innerMargin: 30,
 
  // timeline chart
  tlGroup: null,
  tlW: null,
  maxLineHeight: 20,
  tlXScale: d3.scaleLinear(),
  tlWScale: d3.scaleBand(),  
  tlEScale: d3.scaleOrdinal(),
  tlZScale: d3.scaleOrdinal(),
  tlXAxis: d3.axisBottom(),
  tlXGrid: d3.axisTop(),
  tlWAxis: d3.axisRight(),
  tlEAxis: d3.axisLeft(),
  tlBrush: d3.brushX(),
  tlBrushTimeout: null,
  tlLineH: null,
  
  // bar chart
  barGroup: null,
  barW: null,
  barXScale: d3.scaleLinear(),
  barWScale: d3.scaleBand(),
  barXAxis: d3.axisBottom(),
  barWAxis: d3.axisRight(),

  // legend
  zColorMap: new Map([
    ['static', '#4682b4'],
    ['subflow', '#ff7f0e'],
    ['cudaflow', '#6A0DAD'],
    ['condition', '#41A317'],
    ['module', '#0000FF'],
    ['(grouped)', '#999DA0']
  ]),
  zScale: null,
  zGroup: null,
  zWidth: null,
  zHeight: null,

  // segmenet  
  minSegmentDuration: 0, // ms
  disableHover: false,
  
  // transition
  transDuration: 700,

  // data field
  zoomXs: [],  // scoped time data
  zoomYs: [],  // scoped line data
  data: null,
  totalNLines: 0,
  nLines: 0,
    
  timeFormat : function(d) {
    if(d >= 1e9) return `${(d/1e9).toFixed(2)}G`;
    if(d >= 1e6) return `${(d/1e6).toFixed(1)}M`;
    if(d >= 1e3) return `${(d/1e3).toFixed(0)}K`;
    return d;
  }
};

const simple_file = "js/simple.json";
//const simple_file = "js/wb_dma.json";

async function fetchTFPData(file) {
  const response = await fetch(file);
  const json = await response.json();
  return json;
}

class Database {

  constructor (rawData, maxSegments=10) {

    this.data = [];
    this.maxSegments = maxSegments;
    this.indexMap = new Map();

    let numSegments = 0, minX = null, maxX = null, k=0;

    const begParse = performance.now();

    // iterate executor
    for (let i=0, ilen=rawData.length; i<ilen; i++) {
      // iterate worker
      for (let j=0, jlen=rawData[i].data.length; j<jlen; j++) {
        
        let klen = rawData[i].data[j].data.length;

        this.data.push({
          executor: rawData[i].executor,
          worker  : rawData[i].data[j].worker,
          segments: rawData[i].data[j].data,
          range   : [0, klen]
        });
        
        if(klen > 0) {
          let b = rawData[i].data[j].data[0].span[0];
          let e = rawData[i].data[j].data[klen-1].span[1];
          if(minX == null || b < minX) minX = b;
          if(maxX == null || e > maxX) maxX = e; 
          numSegments += klen;
        }

        this.indexMap.set(`${rawData[i].executor}+&+${rawData[i].data[j].worker}`, k);
        k = k+1;
      }
    }

    this.numSegments = numSegments;
    this.minX = minX;
    this.maxX = maxX;
  }

  query(zoomX = null, zoomY = null) {

    // default selection is the entire region
    if(zoomX == null) {
      zoomX = [this.minX, this.maxX];
    }
    
    if(zoomY == null) {
      //zoomY = [...Array(this.data.length).keys()]
      zoomY = d3.range(0, this.data.length);
    }
    else {
      zoomY = zoomY.map(d => this.indexMap.get(`${d.executor}+&+${d.worker}`));
    }
    
    console.assert(zoomX[0] <= zoomX[1]);

    let R = 0;
    let S = [];
    
    // find out the segments in the range
    for(let y=0; y<zoomY.length; ++y) {

      const w = zoomY[y];

      console.log("bsearch worker", this.data[w].worker);
      
      const slen = this.data[w].segments.length;
            
      let l = null, r = null, beg, end, mid;

      // r = maxArg {span[0] <= zoomX[1]}
      beg = 0, end = slen;
      while(beg < end) {
        mid = (beg + end) >> 1;
        if(this.data[w].segments[mid].span[0] <= zoomX[1]) {
          beg = mid + 1;
          r = (r == null) ? mid : Math.max(mid, r);
        }
        else {
          end = mid;
        }
      }

      if(r == null) {
        this.data[w].range = [0, 0];
        continue;
      }

      // l = minArg {span[1] >= zoomX[0]}
      beg = 0, end = slen;
      while(beg < end) {
        mid = (beg + end) >> 1;
        if(this.data[w].segments[mid].span[1] >= zoomX[0]) {
          end = mid;
          l = (l == null) ? mid : Math.min(mid, l);
        }
        else {
          beg = mid + 1;
        }
      };

      if(l == null) {
        this.data[w].range = [0, 0];
        continue;
      }

      // range ok
      if(l > r) {
        this.data[w].range = [0, 0];
        continue;
      }
      this.data[w].range = [l, r+1];
      R += (r+1-l);
      console.log(`  ${this.data[w].worker} has ${r+1-l} segments`);
    }

    // prune to select segments
    const P = R <= this.maxSegments ? 
      1 : Math.pow(2, Math.ceil(Math.log2(R / this.maxSegments)));

    console.log("group size", P);

    // find out the segments in the range
    for(let y=0; y<zoomY.length; ++y) {
      
      let total_t=0, st=0, dt=0, gt=0, ct=0, mt=0;

      const w = zoomY[y];
      const N = this.data[w].range[1]-this.data[w].range[0];
      
      let b = this.data[w].range[0];
      let s = [];
      while(b < this.data[w].range[1]) {
        let e = Math.min(b+P, this.data[w].range[1]);

        if(e - b == 1) {
          s.push(this.data[w].segments[b]);
        }
        else {  // group
          s.push({
            span: [this.data[w].segments[b].span[0], this.data[w].segments[e-1].span[1]],
            name: "-",
            type: "(grouped)"
          });
        }
        
        for(let i=b; i<e; i++) {
          const t = this.data[w].segments[i].span[1] - this.data[w].segments[i].span[0];
          total_t += t;
          // cumulate data
          switch(this.data[w].segments[i].type) {
            case "static"   : st += t; break;
            case "subflow"  : dt += t; break;
            case "cudaflow" : gt += t; break;
            case "condition": ct += t; break;
            case "module"   : mt += t; break;
            default         : console.assert(false); break;
          }
        }

        b = e;
      }

      S.push({
        executor: this.data[w].executor,
        worker: this.data[w].worker,
        tasks: N,
        segments: s,
        static: st,
        subflow: dt,
        cudaflow: gt,
        condition: ct,
        module: mt,
        totalTime: total_t
      });
    }
    return S;
  }

  minX() { return this.minX; }

  maxX() { return this.maxX; }

  numSegments() { return this.numSegments; }
}

function _adjust_dimensions() {

  tfp.width = tfp.dom.style('width').slice(0, -2)
    - tfp.dom.style('padding-right').slice(0, -2)
    - tfp.dom.style('padding-left').slice(0, -2);

  tfp.tlW = tfp.width - tfp.leftMargin - tfp.rightMargin;
  tfp.tlH = tfp.data.length * tfp.maxLineHeight;
  tfp.barW = tfp.tlW;
  tfp.barH = tfp.tlH;

  tfp.height = tfp.tlH + tfp.topMargin + tfp.innerMargin + tfp.barH + tfp.bottomMargin;

  tfp.svg.transition().duration(tfp.transDuration)
    .attr('width', tfp.width)
    .attr('height', tfp.height);
}

function _render_tlXAxis() {

  tfp.tlXScale
    .domain(tfp.zoomXs[tfp.zoomXs.length - 1])
    .range([0, tfp.tlW]).clamp(true);

  tfp.tlXAxis.scale(tfp.tlXScale)
    .tickSizeOuter(0)
    .tickSize(-tfp.tlH)
    .tickFormat(tfp.timeFormat);
    //.tickFormat(d3.format('.2s'))
    //.ticks(numXTicks(tfp.tlW));
  
  tfp.tlGroup.select('g.tfp-tl-x-axis')
    .attr('transform', `translate(0, ${tfp.tlH})`)
    .transition().duration(tfp.transDuration)
      .call(tfp.tlXAxis)
      .attr('font-size', 16);
}

function _render_tlWAxis() {
  tfp.tlWScale
    .domain(tfp.data.map(d=>`${d.executor}+&+${d.worker}`))
    .range([0, tfp.tlH]);

  tfp.tlWAxis.scale(tfp.tlWScale)
    .tickSizeOuter(0)
    .tickFormat(d => d.split('+&+')[1]);
  
  tfp.tlGroup.select('g.tfp-tl-w-axis')
    .attr('transform', `translate(${tfp.tlW}, 0)`)
    .transition().duration(tfp.transDuration)
      .call(tfp.tlWAxis)
      .attr('font-size', 14);
  
  tfp.tlGroup.select('g.tfp-tl-w-axis').selectAll('text')
    .on('click', d => console.log(d));
}

function _render_tlEAxis() {

  let group = tfp.data.reduce((res, item) => {
   res[item.executor] = [...res[item.executor] || [], item.worker];
   return res;
  }, {});

  group = Object.keys(group).map(e => { return {executor: e, workers: group[e]} });
  
  console.log(group);

  tfp.tlEScale.domain(group.map(d=>d.executor));

  let cntLines = 0;

  tfp.tlEScale.range(group.map(d => {
    const pos = (cntLines + d.workers.length/2)*tfp.maxLineHeight;
    cntLines += d.workers.length;
    return pos;
  }));
  
  tfp.tlEAxis.scale(tfp.tlEScale).tickSizeOuter(0);
  
  tfp.tlGroup.select('g.tfp-tl-e-axis')
    .attr('transform', `translate(0, 0)`)
    .transition().duration(tfp.transDuration)
      .call(tfp.tlEAxis)
      .attr('font-size', 14)
  
  tfp.tlGroup.select('g.tfp-tl-e-axis').selectAll('text')
    .on('click', d => console.log(d));
  
  // rect
  var ed1 = tfp.tlGroup.select('g.tfp-tl-e-rect').selectAll('rect').data(group);

  ed1.exit().transition().duration(tfp.transDuration)
    .style('stroke-opacity', 0)
    .style('fill-opacity', 0)
    .remove();
  
  ed1 = ed1.merge(ed1.enter().append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', 0)
    .attr('width', 0)
    //.on('mouseover', tfp.executorTooltip.show)
    //.on('mouseout', tfp.executorTooltip.hide);
  );

  ed1.transition().duration(tfp.transDuration)
    .attr('width', tfp.tlW)
    .attr('height', d => tfp.maxLineHeight * d.workers.length)
    .attr('y', d => tfp.tlEScale(d.executor) - d.workers.length/2*tfp.maxLineHeight);
}

function _render_tlZAxis() {

  let zGroup = tfp.tlGroup.select('g.tfp-tl-legend');
  zGroup.transition().duration(tfp.transDuration)
    .attr('transform', `translate(0, ${-tfp.maxLineHeight})`);

  tfp.tlZScale.domain(Array.from(tfp.zColorMap.keys()));
  tfp.tlZScale.range(Array.from(tfp.zColorMap.values()));

  const zW = tfp.tlW;
  const zH = tfp.maxLineHeight;
  const binW = zW / tfp.tlZScale.domain().length;

  let slot = zGroup.selectAll('g').data(tfp.tlZScale.domain());

  slot.exit().remove();

  const newslot = slot.enter().append('g')
    .attr('transform', (d, i) => `translate(${binW * i}, -5)`);

  newslot.append('rect');
  newslot.append('text')
    .on('click', d => console.log("click legend", d));
  
  slot = slot.merge(newslot);

  slot.select('rect')
    .attr('width', binW)
    .attr('height', zH)
    .attr('fill', d => tfp.tlZScale(d));

  slot.select('text').text(d => d).attr('x', binW*0.5).attr('y', zH*0.5);
  
}

function _render_tlSegments() {

  tfp.tlLineH = tfp.tlH / tfp.data.length*0.8;
  tfp.lineOffset = (tfp.maxLineHeight - tfp.tlLineH) / 2;

  var sd1 = tfp.tlGroup.select('g.tfp-tl-s-rect').selectAll('g').data(tfp.data)
  sd1.exit().remove();
  sd1 = sd1.merge(sd1.enter().append('g'));

  sd1.transition().duration(tfp.transDuration)
    .attr('transform', d => {
      const y = tfp.tlWScale(`${d.executor}+&+${d.worker}`);
      return `translate(0, ${y})`
    });

  var sd2 = sd1.selectAll('rect').data(d => d.segments);
  sd2.exit().remove();

  sd2 = sd2.merge(sd2.enter().append('rect')
    .attr('rx', 1)
    .attr('ry', 1)
    .attr('x', tfp.tlW/2)    // here we initialize the rect to avoid
    .attr('y', tfp.tlH/2)    // NaN y error during transition
    .attr('width', 0)
    .attr('height', 0)
    .style('fill-opacity', 0)
    .on('mouseover.tlTooltip', tfp.tlTooltip.show)
    .on('mouseout.tlTooltip', tfp.tlTooltip.hide)
    .on("mouseover", function(d) {

      if (tfp.disableHover) return;

      const r = tfp.lineOffset; // enlarge ratio

      d3.select(this).transition().duration(250).style('fill-opacity', 1)
        .attr("width", d => d3.max([1, tfp.tlXScale(d.span[1])-tfp.tlXScale(d.span[0])]) + r)
        .attr('height', tfp.tlLineH+r)
        .attr('x', d => tfp.tlXScale(d.span[0])-r/2)
        .attr('y', d => tfp.lineOffset-r/2);
    })
    .on("mouseout", function(d) {
      d3.select(this).transition().duration(250).style('fill-opacity', .8)
        .attr("width", d => d3.max([1, tfp.tlXScale(d.span[1])-tfp.tlXScale(d.span[0])]))
        .attr('height', tfp.tlLineH)
        .attr('x', d => tfp.tlXScale(d.span[0]))
        .attr('y', d => tfp.lineOffset)
        .style('fill', d => tfp.zColorMap.get(d.type));
    })
  );

  sd2.transition().duration(tfp.transDuration)
    .attr('x', d => tfp.tlXScale(d.span[0]))
    .attr('width', d => d3.max([1, tfp.tlXScale(d.span[1])-tfp.tlXScale(d.span[0])]))
    .attr('y', tfp.lineOffset)
    .attr('height', tfp.tlLineH)
    .style('fill-opacity', .8)
    .style('fill', d => tfp.zColorMap.get(d.type));
}

function _render_tlBrush() {
  tfp.tlBrush
    .extent([[0, 0], [tfp.tlW, tfp.tlH]])
    .on('end', function() { 

      const s = d3.event.selection;
      
      console.log("brush ends at source", s); 

      // Consume the brush action
      if (s) {
        console.log("zoom to ", s.map(x=>tfp.tlXScale.invert(x)));
      
        tfp.zoomXs.push(s.map(x=>tfp.tlXScale.invert(x)));
        tfp.zoomYs.push(tfp.zoomYs[tfp.zoomYs.length-1])
        tfp.data = tfp.database.query(
          tfp.zoomXs[tfp.zoomXs.length-1], tfp.zoomYs[tfp.zoomYs.length-1]
        );
        _render_tlXAxis();
        _render_tlSegments();

        tfp.tlGroup.select("g.tfp-tl-brush").call(tfp.tlBrush.move, null);
      }
      else { // double-click detection
        if (!tfp.tlBrushTimeout) {
          return (tfp.tlBrushTimeout = setTimeout(() => {
            tfp.tlBrushTimeout = null;
          }, 350));
        }
        
        console.log("double click detected!", tfp.zoomXs, tfp.zoomYs);
        
        console.assert(tfp.zoomXs.length == tfp.zoomYs.length);
        
        if(tfp.zoomXs.length > 1) {
          tfp.zoomXs.pop();
          tfp.zoomYs.pop();
          const zoomX = tfp.zoomXs[tfp.zoomXs.length-1];
          const zoomY = tfp.zoomYs[tfp.zoomYs.length-1];
          tfp.data = tfp.database.query(zoomX, zoomY);
          _render_tlXAxis();
          _render_tlSegments();
        }
      }
    });

  tfp.tlGroup.select('g.tfp-tl-brush').call(tfp.tlBrush);
}

function _render_tl() {

  tfp.tlGroup.attr('transform', `translate(${tfp.leftMargin}, ${tfp.topMargin})`);

  _render_tlXAxis();  // x-axis
  _render_tlWAxis();  // w-axis
  _render_tlEAxis();  // e-axis
  _render_tlZAxis();  // z-axis
  _render_tlSegments();  // s-rect
  _render_tlBrush();  // brush
}

function _render_barXAxis() {
  tfp.barXScale
    .domain([0, d3.max(tfp.data, d=>d.totalTime)])
    .range([0, tfp.barW]).clamp(true);

  tfp.barXAxis.scale(tfp.barXScale)
    .tickSizeOuter(0)
    .tickSize(-tfp.barH)
    .tickFormat(tfp.timeFormat);

  tfp.barGroup.select('g.tfp-bar-x-axis')
    .attr('transform', `translate(0, ${tfp.barH})`)
    .transition().duration(tfp.transDuration)
      .call(tfp.barXAxis)
      .attr('font-size', 16);
}

function _render_barWAxis() {
  tfp.barWScale.padding(0.2)
    .domain(tfp.data.map(d=>`${d.executor}+&+${d.worker}`))
    .range([0, tfp.barH]);
  
  tfp.barWAxis.scale(tfp.barWScale)
    .tickSizeOuter(0)
    .tickFormat(d => d.split('+&+')[1]);

  tfp.barGroup.select('g.tfp-bar-w-axis')
    .attr('transform', `translate(${tfp.barW}, 0)`)
    .transition().duration(tfp.transDuration)
      .call(tfp.barWAxis)
      .attr('font-size', 14);
  
  tfp.barGroup.select('g.tfp-bar-w-axis').selectAll('text')
    .on('click', d => console.log(d));
}

function _render_barGraph() {
  
  const keys = Array.from(tfp.zColorMap.keys());
  keys.pop(); 

  var stacked_data = d3.stack().keys(keys)(tfp.data);
  var l1 = tfp.barGroup.select('g.tfp-bar-graph')
    .selectAll('g')
    .data(stacked_data);

  l1.exit().remove();
  l1 = l1.enter().append('g').merge(l1)
    .attr("type", function(d) { return d.key; })
    .attr("fill", d => tfp.zColorMap.get(d.key));

  var l2 = l1.selectAll("rect").data(d=>d);

  l2.exit().remove(); 

  var newbars = l2.enter().append("rect")
    .attr('rx', 0)
    .attr('ry', 0)
    .attr('width', 0)
    .attr('height', 0)
    .attr('x', 0)
    .attr('y', 0)
    .style('fill-opacity', 0.8)
    .on('mouseover.barTooltip', tfp.barTooltip.show)
    .on('mouseout.barTooltip', tfp.barTooltip.hide);
    
  newbars
    .on('mouseover', function() {
      if(tfp.disableHover) return;
      d3.select(this).transition().duration(250).style('fill-opacity', 1)
        .attr('y', d => tfp.barWScale(`${d.data.executor}+&+${d.data.worker}`))
        .attr('x', d => tfp.barXScale(d[0]))
        .attr('width', d => d3.max([1, tfp.barXScale(d[1]) - tfp.barXScale(d[0])]))
        .attr('height', tfp.barWScale.bandwidth());
    })
    .on('mouseout', function(d) {
      d3.select(this).transition().duration(250).style('fill-opacity', 0.8)
        .attr('y', d => tfp.barWScale(`${d.data.executor}+&+${d.data.worker}`))
        .attr('x', d => tfp.barXScale(d[0]))
        .attr('width', d => d3.max([1, tfp.barXScale(d[1]) - tfp.barXScale(d[0])]))
        .attr('height', tfp.barWScale.bandwidth());
    });

  l2.merge(newbars)
    .transition().duration(tfp.transDuration)
    .attr('y', d => tfp.barWScale(`${d.data.executor}+&+${d.data.worker}`))
    .attr('x', d => tfp.barXScale(d[0]))
    .attr('width', d => d3.max([1, tfp.barXScale(d[1]) - tfp.barXScale(d[0])]))
    .attr('height', tfp.barWScale.bandwidth());
}

function _render_bar() {

  tfp.barGroup.attr('transform', 
    `translate(${tfp.leftMargin}, ${tfp.topMargin + tfp.innerMargin + tfp.tlH})`
  );

  _render_barXAxis();  
  _render_barWAxis();
  _render_barGraph();
}

async function main() {
  
  // initialize static field
  tfp.dom = d3.select('#tfp');
  tfp.svg = tfp.dom.append('svg').attr('width', 0).attr('height', 0);

  tfp.tlGroup = tfp.svg.append('g').attr('class', 'tfp-tl-group');
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-legend');
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-x-axis');
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-w-axis');
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-e-axis');
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-e-rect');  // layer 1
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-brush');   // layer 2
  tfp.tlGroup.append('g').attr('class', 'tfp-tl-s-rect');  // layer 3

  tfp.barGroup = tfp.svg.append('g').attr('class', 'tfp-bar-group');
  tfp.barGroup.append('g').attr('class', 'tfp-bar-x-axis');
  tfp.barGroup.append('g').attr('class', 'tfp-bar-w-axis');
  tfp.barGroup.append('g').attr('class', 'tfp-bar-graph');

  //tfp.transition = tfp.svg
  //  .transition("tfpTransition")
  //  .duration(700)
  //  .on("start", () => { console.log("beg zoom"); tfp.zoomInProgress = true; });
  //  .on("end", () => { console.log("end zoom"); tfp.zoomInProgress = false; });
  
  // tl tooltips
  tfp.tlTooltip = d3.tip()
    .attr('class', 'tfp-tooltip')
    .direction('s')
    .offset([10, 0])
    .html(d => {
      return `Type: ${d.type}<br>
              Name: ${d.name}<br>
              Span: [${d.span}]<br>
              Time: ${d.span[1]-d.span[0]}`;
    });
  
  tfp.svg.call(tfp.tlTooltip);


  // bar tooltips
  tfp.barTooltip = d3.tip()
    .attr('class', 'tfp-tooltip')
    .direction('s')
    .offset([10, 0])
    .html(function(d) {
      //var type = this.parentNode.getAttribute("type");
      //console.log(j, d)
      //const p = ((d[1]-d[0]) * 100 / (state.maxX - state.minX)).toFixed(2);
      //const p = ((d[1]-d[0]) * 100 / (d.data.busy)).toFixed(2);
      return `Type: ${this.parentNode.getAttribute("type")}<br>
              Total Time: ${d[1]-d[0]}`;
    });

  tfp.svg.call(tfp.barTooltip);

  
  //console.log("svg dimsntion", tfp.dom, tfp.dom.style('height'));

  let begFetch = performance.now();
  const res = await fetchTFPData(simple_file);
  let endFetch = performance.now();
  
  let begParse = performance.now();
  tfp.database = new Database(res);
  let endParse = performance.now();
  
  //console.log(database.data, database.numSegments);
  console.log(`Fetch time: ${endFetch - begFetch} ms`);
  console.log(`Parse time: ${endParse - begParse} ms`);

  tfp.zoomXs.push([tfp.database.minX, tfp.database.maxX]);
  tfp.zoomYs.push([
    {executor: "executor 0", worker: "worker 1"},
    {executor: "executor 0", worker: "worker 2"},
    {executor: "executor 0", worker: "worker 3"},
    {executor: "executor 1", worker: "worker 1"}
  ])
  tfp.data = tfp.database.query(
    tfp.zoomXs[tfp.zoomXs.length-1], tfp.zoomYs[tfp.zoomYs.length-1]
  );

  console.log(tfp.data)

  _adjust_dimensions();
  _render_tl();
  _render_bar();
}

main();

//console.log(simple);

//tfp_render_simple();
//tfp_render_dreamplace();






