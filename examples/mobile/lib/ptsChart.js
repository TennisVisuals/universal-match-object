function ptsMatch() {

   var match_data;

   var options = {

      id: 0,
      class: 'ptsMatch',

      resize: true,
      width: window.innerWidth,
	   height: 80,
	   max_height: 100,

      margins: {
         top: 0, 
         right: 0, 
         bottom: 0, 
         left: 0
      },

      set: {
         average_points: 56
      },

      lines: {
         width: 2,
         interpolation: 'linear'
      },

      points: {
         max_width_points: 100
      },

      score: {
         font: 'Arial',
         font_size: '12px',
         font_weight: 'bold',
         reverse: true
      },

      header: {
         font: 'Arial',
         font_size: '14px',
         font_weight: 'bold'
      },

      display: {
         sizeToFit: true,
         transition_time: 0,
         point_highlighting: true,
         point_opacity: .4,
         win_err_highlight: true,
         game_highlighting: true,
         game_opacity: .2,
         game_boundaries: true,
         gamepoints: false,
         score: true,
         points: true,
         winner: true
      },

      colors: {
         orientation: 'yellow',
         gamepoints: 'black',
         players: { 0: "#a55194", 1: "#6b6ecf" }
      }
   }

   // functions which should be accessible via ACCESSORS
   var update;

   // programmatic
   var pts_sets = [];
   var dom_parent;

   // prepare charts
   pts_charts = [];
   for (var s=0; s < 5; s++) {
      pts_charts.push(ptsChart());
   }

   // DEFINABLE EVENTS
   // Define with ACCESSOR function chart.events()
   var events = {
       'update': { begin: null, end: null},
       'set_box': { 'mouseover': null, 'mouseout': null },
       'update': { 'begin': null, 'end': null },
       'point_bars': { 'mouseover': null, 'mouseout': null, 'click': null }
   };

   function chart(selection) {
        dom_parent = selection;

        if (options.display.sizeToFit) {
           var dims = selection.node().getBoundingClientRect();
           options.width = Math.max(dims.width, 400);
        }

        // append svg
        var root = dom_parent.append('div')
            .attr('class', options.class + 'root')
            .style('width', options.width + 'px')
            .style('height', options.height + 'px' );

        for (var s=0; s < 5; s++) {
           pts_sets[s] = root.append("div")
              .attr("class", "pts")
              .style('display', 'none')
           pts_sets[s].call(pts_charts[s]);
        }

        update = function(opts) {
           var sets = match_data.sets();

           if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
              var dims = selection.node().getBoundingClientRect();
              options.width = Math.max(dims.width, 400);
              options.height = (dims.height - (+options.margins.top + +options.margins.bottom)) / sets.length;
              if (options.height > options.max_height) options.height = options.max_height;
           }

           var true_height = 0;
           for (var s=0; s < pts_charts.length; s++) {
              if (sets[s] && sets[s].history.points().length) {
                 pts_sets[s].style('display', 'inline');
                 pts_charts[s].width(options.width); 
                 pts_charts[s].height(options.height); 
                 pts_charts[s].update();
                 true_height += +options.height + 5;
              } else {
                 pts_sets[s].style('display', 'none')
              }
           }

           root
             .style('width', options.width + 'px')
             .style('height', true_height + 'px');
     
        }
   }

    // ACCESSORS

    // allows updating individual options and suboptions
    // while preserving state of other options
    chart.options = function(values) {
        if (!arguments.length) return options;
        keyWalk(values, options);
        return chart;
    }

    function keyWalk(valuesObject, optionsObject) {
        if (!valuesObject || !optionsObject) return;
        var vKeys = Object.keys(valuesObject);
        var oKeys = Object.keys(optionsObject);
        for (var k=0; k < vKeys.length; k++) {
           if (oKeys.indexOf(vKeys[k]) >= 0) {
              var oo = optionsObject[vKeys[k]];
              var vo = valuesObject[vKeys[k]];
              if (typeof oo == 'object' && typeof vo !== 'function' && oo && oo.constructor !== Array) {
                 keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
              } else {
                 optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
              }
           }
        }
    }

    chart.events = function(functions) {
         if (!arguments.length) return events;
         keyWalk(functions, events);
         return chart;
    }

    chart.colors = function(colores) {
        if (!arguments.length) return options.colors;
        options.colors.players = colores;
        return chart;
    }

    chart.width = function(value) {
        if (!arguments.length) return options.width;
        options.width = value;
        if (typeof update === 'function') update(true);
        pts_charts.forEach(function(e) { e.width(value) });
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return options.height;
        options.height = value;
        if (typeof update === 'function') update(true);
        pts_charts.forEach(function(e) { e.height(value) });
        return chart;
    };

    chart.duration = function(value) {
        if (!arguments.length) return options.display.transition_time;
       options.display.transition_time = value;
       return chart;
    }

    chart.update = function(opts) {
       if (events.update.begin) events.update.begin(); 
       var sets = match_data.sets();
       var max_width_points = Math.max(...sets.map((set, index) => set.history.points().filter(f=>f.set == index).length));
       if (sets.length > 1) chart.options({ points: { max_width_points }});
       sets.forEach(function(e, i) {
          pts_charts[i].data(sets[i]);
          pts_charts[i].options({ id: i });
          pts_charts[i].options({ lines: options.lines, points: options.points, score: options.score, header: options.header});
          pts_charts[i].options({ set: options.set, display: options.display, colors: options.colors});
          pts_charts[i].events(events);
          pts_charts[i].width(options.width).height(options.height).update(opts);
       })
       if (typeof update === 'function') update(opts);
       setTimeout(function() { 
         if (events.update.end) events.update.end(); 
       }, options.display.transition_time);
       return true;
    }

    chart.data = function(matchObject) {
       if (!arguments.length) { return match_data; }
       match_data = matchObject;
       chart.update();
    }

   function lastElement(arr) { return arr[arr.length - 1]; }

   return chart;
}

function ptsChart() {

    var set_data;

    var game_data;
    var points_to_set;

    var winners = ['Ace', 'Winner', 'Serve Winner'];
    var errors = ['Forced Error', 'Unforced Error', 'Double Fault', 'Penalty', 'Out', 'Net'];

    var options = {
      id: 0,
      class: 'ptsChart',

      resize: true,
      width: window.innerWidth,
	   height: 80,

      margins: {
         top: 5, 
         right: 15, 
         bottom: 5, 
         left: 5
      },

      set: {
         average_points: 56
      },

      lines: {
         width: 2,
         interpolation: 'linear'
      },

      points: {
         max_width_points: 100
      },

      score: {
         font: 'Arial',
         font_size: '12px',
         font_weight: 'bold',
         reverse: true
      },

      header: {
         font: 'Arial',
         font_size: '14px',
         font_weight: 'bold'
      },

      display: {
         transition_time: 0,
         point_highlighting: true,
         point_opacity: .4,
         win_err_highlight: true,
         game_highlighting: true,
         game_opacity: .2,
         game_boundaries: false,
         gamepoints: false,
         score: true,
         points: true,
         winner: true
      },

      colors: {
         orientation: 'yellow',
         gamepoints: 'black',
         players: { 0: "blue" , 1: "purple" }
      }

    }

    // functions which should be accessible via ACCESSORS
    var update;

    // programmatic
    var dom_parent;

    // DEFINABLE EVENTS
    // Define with ACCESSOR function chart.events()
    var events = {
       'set_box': { 'mouseover': null, 'mouseout': null },
       'update': { 'begin': null, 'end': null },
       'point_bars': { 'mouseover': null, 'mouseout': null, 'click': null }
    };

    function chart(selection) {
        selection.each(function () {

            dom_parent = d3.select(this);

            // append svg
            var root = dom_parent.append('svg')
                .attr('class', options.class + 'root')
                .style('width', options.width + 'px' )
                .style('height', options.height + 'px' );

            // append children g
            var pts = root.append('g').attr('class', options.class + 'pts')
                          .attr('transform', 'translate(5, 5)')

            // For Point Bars which must always be on top
            var ptsHover = root.append('g').attr('class', options.class + 'pts')
                          .attr('transform', 'translate(5, 5)')

            // append labels
            var set_winner = pts.append('text')
                    .attr('class', options.class + 'Header')
                    .attr('opacity', 0)
                    .attr('font-size', options.header.font_size)
                    .attr('font-weight', options.header.font_weight)
                    .attr('x', function(d, i) { return (options.margins.left) + 'px'})
                    .attr('y', function(d, i) { return (options.margins.top + 8) + 'px' })

            var set_score = pts.append('text')
                    .attr('class', options.class + 'Score')
                    .attr('opacity', 0)
                    .attr('font-size', options.score.font_size)
                    .attr('font-weight', options.score.font_weight)
                    .attr('x', function(d, i) { return (options.margins.left) + 'px'})
                    .attr('y', function(d, i) { return (options.margins.top + 20) + 'px' })

            // resize used to disable transitions during resize operation
            update = function(opts, resize) {
               if (!set_data) { return false; }

               root
                .transition().duration(options.display.transition_time)
                .style('width', options.width + 'px')
                .style('height', options.height + 'px');

               var points = set_data.history.action('addPoint').filter(f=>f.point.set == options.id);
               var range_start = points[0].point.index;

               game_data = groupGames(points);
               points_to_set = points.map(p => p.needed.points_to_set);
               var pts_max = Math.max(...[].concat(points_to_set.map(p=>p[0]), points_to_set.map(p=>p[1])));
               var pts_start = Math.max(...points_to_set[0]);

               // add pts prior to first point
               points_to_set.unshift([pts_start, pts_start]);

               var longest_rally = Math.max.apply(null, points.map(function(m) { return m.point.rally ? m.point.rally.length : 0 })) + 2;

               displayScore(resize);

               var xScale = d3.scaleLinear()
                    .domain([0, calcWidth()])
                    .range([0, options.width - (options.margins.left + options.margins.right)]);

               function pointScale(d, r, a) { 
                  if (d.range[r] < range_start) return xScale(d.range[r] + a);
                  return xScale(d.range[r] + a - range_start); 
               }

               var yScale = d3.scaleLinear()
                    .range([options.height - (options.margins.top + options.margins.bottom), options.margins.bottom])
                    .domain([-2, pts_max - 1]);

               // Set Box
               var set_box = pts.selectAll("." + options.class + "SetBox")
                   .data([options.id]) // # of list elements only used for index, data not important

               set_box.enter()
                   .append("rect")
                   .attr("class", options.class + "SetBox")
                   .style("position", "relative")
                   .attr("height", function() { return options.height - (options.margins.top + options.margins.bottom) } )
                   .attr("width", function() { return xScale(boxWidth() + 1); })
                   .attr('stroke', 'black')
                   .attr('stroke-width', 1)
                   .attr('fill', 'none')
                   .on('mouseover', function(d, i) { if (events.set_box.mouseover) events.set_box.mouseover(d, i); })
                   .on('mouseout', function(d, i) { if (events.set_box.mouseout) events.set_box.mouseout(d, i); })
                  .merge(set_box)
                   .transition().duration(resize ? 0 : options.display.transition_time)
                   .attr("height", function() { return options.height - (options.margins.top + options.margins.bottom) } )
                   .attr("width", function() { return xScale(boxWidth() + 1); })

                set_box.exit()
                   .transition().duration(resize ? 0 : options.display.transition_time)
                   .style('opacity', 0)
                   .remove()

                // Game Boundaries
                var game_boundaries = pts.selectAll("." + options.class + "GameBoundary")
                   .data(game_data)

                game_boundaries.exit().remove()

                game_boundaries.enter()
                   .append('rect')
                   .attr("class", options.class + "GameBoundary")
                  .merge(game_boundaries)
                   .attr("id", function(d, i) { return options.class + options.id + 'boundary' + i; })
                   .transition().duration(resize ? 0 : options.display.transition_time)
                   .attr('opacity', function() { return options.display.game_boundaries ? .02 : 0 })
                   .attr("transform", function(d, i) { return "translate(" + pointScale(d, 0, 0) + ", 0)"; })
                   .attr("height", yScale(-2))
                   .attr('width', function(d) { return pointScale(d, 1, 1) - pointScale(d, 0, 0); })
                   .attr('stroke', 'black')
                   .attr('stroke-width', 1)
                   .attr('fill', 'none')

                // Game Boxes
                var game_boxes = pts.selectAll("." + options.class + "Game")
                   .data(game_data)

                game_boxes.exit().remove()

                game_boxes.enter()
                   .append('rect')
                   .attr("class", options.class + "Game")
                  .merge(game_boxes)
                   .attr("id", function(d, i) { return options.class + options.id + 'game' + i; })
                   .transition().duration(resize ? 0 : options.display.transition_time)
                   .attr('opacity', function() { return options.display.game_boundaries ? .02 : 0 })
                   .attr("transform", function(d, i) { return "translate(" + pointScale(d, 0, 0) + ", 0)"; })
                   .attr("height", yScale(-2))
                   .attr('width', function(d) { return pointScale(d, 1, 1) - pointScale(d, 0, 0); })
                   .attr('stroke', function(d) { return options.colors.players[d.winner]; })
                   .attr('stroke-width', 1)
                   .attr('fill', function(d) { return d.winner != undefined ? options.colors.players[d.winner] : 'none'; })

                // Player PTS Lines
                var lineGen = d3.line()
                   .x(function(d, i) { return xScale(i); })
                   .y(function(d) { return yScale(pts_max - d); })

                var pts_lines = pts.selectAll("." + options.class + "Line")
                   .data([0, 1])

                pts_lines.exit().remove();

                pts_lines.enter()
                   .append('path')
                   .attr('class', options.class + 'Line')
                   .attr('id', function(d) { return options.class + options.id + 'player' + d + 'Line'; })
                   .attr('fill', 'none')
                  .merge(pts_lines)
                   .transition().duration(resize ? 0 : options.display.transition_time / 2)
                   .style('opacity', .1)
                   .transition().duration(resize ? 0 : options.display.transition_time / 2)
                   .style('opacity', 1)
                   .attr('stroke', function(d) { return options.colors.players[d]; })
                   .attr('stroke-width', function(d) { return options.lines.width; })
                   // .attr('d', function(d) { return lineGen(player_data[d]) })
                   .attr('d', function(d) { return lineGen(points_to_set.map(p=>p[d])) })

                // var bp_data = [points_to_set.map(p=>p[0]), points_to_set.map(p=>p[1])];
                var bp_data = [points_to_set.map(p=>{ return { pts:p[0] }}), points_to_set.map(p=>{ return { pts: p[1] }})];
                var bp_wrappers = pts.selectAll('.' + options.class + 'BPWrapper')
                   .data(bp_data) 

                bp_wrappers.enter()
                   .append('g')
                   .attr('class', options.class + 'BPWrapper');

                bp_wrappers.exit().remove();

                var breakpoints = bp_wrappers.selectAll('.' + options.class + 'Breakpoint')
                   .data(function(d, i) { return add_index(d, i); })

                breakpoints.exit().attr('opacity', '0').remove()

                breakpoints.enter()
                   .append('circle')
                   .attr('class', options.class + 'Breakpoint')
                   .attr('opacity', '0')
                  .merge(breakpoints)
                   .transition().duration(resize ? 0 : options.display.transition_time / 2)
                   .style('opacity', 0)
                   .transition().duration(resize ? 0 : options.display.transition_time / 2)
                   .attr('fill', function(d, i) { 
                      if (points[i - 1] && points[i - 1].point.breakpoint != undefined) {
                         return options.colors.players[d._i]; 
                      }
                   })
                   .style('opacity', function(d, i) { 
                      if (points[i - 1]) {
                         if (points[i - 1].point.breakpoint != undefined) {
                            // return points[i - 1].point.breakpoint == d._i ? 1 : 0
                            return points[i - 1].point.server == 1 - d._i ? 1 : 0
                         }
                      }
                   })
                   .attr("cx", function(d, i) { return xScale(i); })
                   .attr("cy", function(d) { return yScale(pts_max - d.pts); })
                   .attr("r", 2)

                var points_index = d3.range(points.length);
                var barsX = d3.scaleBand()
                   .domain(points_index)
                   .range([0, xScale(points.length)])
                   .round(true)

                var bX = d3.scaleLinear()
                   .domain([0, points.length])
                   .range([0, xScale(points.length)])

                // gradients cause hover errors when data is replaced
                pts.selectAll('.gradient' + options.id).remove();

                var gradients = pts.selectAll('.gradient' + options.id)
                     .data(d3.range(points.length)) // data not important, only length of array

                gradients.exit().remove();

                gradients.enter()
                     .append('linearGradient')
                     .attr("id", function(d, i) { return 'gradient' + options.id + i; })
                     .attr("class", function() { return "gradient" + options.id })
                     .attr("gradientUnits", "userSpaceOnUse")
                     .attr("x1", function(d) { return barsX.bandwidth() / 2; })
                     .attr("y1", function(d) { return 0 })
                     .attr("x2", function(d) { return barsX.bandwidth() / 2; })
                     .attr("y2", function(d) { return yScale(-2) })
                    .merge(gradients)
                     .attr("transform", function(d, i) { return "translate(" + bX(i) + ", 0)"; })
  
                var point_stops = gradients.selectAll(".points_stop")
                     .data(function(d, i) { console.log(d); return calcStops(points[d].point, i); })
    
                point_stops.exit().remove();

                point_stops.enter()
                     .append("stop")
                     .attr("class", "points_stop")
                     .attr("offset", function(d) { return d.offset; })
                     .attr("stop-color", function(d) { return d.color; })
                    .merge(point_stops)
                     .attr("offset", function(d) { return d.offset; })

                var point_bars = ptsHover.selectAll("." + options.class + "Bar")
                   .data(d3.range(points.length)) // data not important, only length of array

                point_bars.exit()
                   .transition().duration(resize ? 0 : options.display.transition_time)
                   .attr('opacity', '0')
                   .remove()

                point_bars.enter()
                   .append("line")
                   .attr("class", options.class + "Bar")
                   .attr('opacity', '0')
                  .merge(point_bars)
                   .attr('opacity', '0')
                   .attr("transform", function(d, i) { return "translate(" + bX(i) + ", 0)"; })
                   .attr("x1", function(d) { return barsX.bandwidth() / 2; })
                   .attr("y1", function(d) { return 0 })
                   .attr("x2", function(d) { return barsX.bandwidth() / 2; })
                   .attr("y2", function(d) { return yScale(-2) })
                   .attr("stroke-width", function() { return barsX.bandwidth(); })
                   .attr("stroke", function(d, i) { return 'url(#gradient' + options.id + i + ')' })
                   .attr("uid", function(d, i) { return 'point' + i; })
                   .on("mousemove", function(d, i) { 
                      if (options.display.point_highlighting) { d3.select(this).attr("opacity", options.display.point_opacity); }
                      if (options.display.game_highlighting && points[i]) {
                         d3.select('[id="' + options.class + options.id + 'game' + points[i].point.game + '"]').attr("opacity", options.display.game_opacity);
                      }
                      if (events.point_bars.mouseover) { events.point_bars.mouseover(points[d], i); };
                      if (d==0) {
                         ptsHover.selectAll('.' + options.class + 'Bar').attr("opacity", options.display.point_opacity);
                      }
                      // highlightScore(d, i);
                   })
                   .on("mouseout", function(d, i) { 
                      ptsHover.selectAll('.' + options.class + 'Bar').attr("opacity", 0);
                      pts.selectAll('.' + options.class + 'Game').attr("opacity", "0");
                      if (events.point_bars.mouseout) { events.point_bars.mouseout(points[d], i); }; 
                      displayScore();
                   })
                   .on("click", function(d, i) {
                      if (events.point_bars.click) { events.point_bars.click(points[d], i, this); }; 
                   })

               function displayScore(resize) {
                  var winner = set_data.winner(); 
                  let players = set_data.metadata.players();
                  function lastName(name) { 
                     let split = name.split(' ');
                     return split[split.length - 1];
                  }
                  var legend = winner != undefined ? players[winner].name : `${lastName(players[0].name)}/${lastName(players[1].name)}`;

                  set_winner
                    .transition().duration(resize ? 0 : options.display.transition_time)
                    .attr('opacity', 1)
                    .attr('fill', winner != undefined ? options.colors.players[winner] : 'black')
                    .text(legend);

                  var game_score = set_data.scoreboard(winner);
                  set_score
                    .transition().duration(resize ? 0 : options.display.transition_time)
                    .attr('opacity', 1)
                    .attr('fill', winner != undefined ? options.colors.players[winner] : 'black')
                    .text(game_score);
               }

               function calcStops(point, i) {
                  var win_pct = 0;
                  var err_pct = 0;
                  var u_pct = 0;

                  if (options.display.win_err_highlight) {
                     console.log('calcstops:', point);
                     var rally = point.rally;
                     var result = point.result;
                     var rally_pct = rally ? 100 - Math.floor(rally.length / longest_rally * 100) : 100;
                     if (winners.indexOf(result) >= 0) {
                        win_pct = rally_pct;
                     } else if (errors.indexOf(result) >= 0) {
                        err_pct = rally_pct;
                     } else {
                        u_pct = rally_pct;
                     }
                  }

                  return [ {offset: "0%", color: 'blue' }, 
                           {offset: u_pct + "%", color: 'blue' }, 
                           {offset: u_pct + "%", color: 'green' }, 
                           {offset: u_pct + win_pct + "%", color: 'green' }, 
                           {offset: u_pct + win_pct + "%", color: 'red' }, 
                           {offset: u_pct + win_pct + err_pct + "%", color: 'red' }, 
                           {offset: u_pct + win_pct + err_pct + "%", color: options.colors.orientation }, 
                           {offset: "100%", color: options.colors.orientation } ] 
               }

            }
        });
    }

    // REUSABLE functions
    // ------------------

    function add_index(d, i) {
       for (var v=0; v<d.length; v++) { d[v]['_i'] = i; }
       return d;
    }

    function boxWidth() {
       var dl = set_data.history.points().filter(f=>f.set == options.id).length - 1;
       var pw = set_data.complete() ? dl : dl < options.set.average_points ? options.set.average_points : dl;
       return pw;
    }

    function calcWidth() {
       var dl = set_data.history.points().filter(f=>f.set == options.id).length - 1;
       var mw = Math.max(dl, options.points.max_width_points, options.set.average_points);
       return mw;
    }

    function groupGames(point_episodes) {
       let games = [{ points: [], range: [0, 0] }];
       let game_counter = 0;
       let current_game = 0;
       point_episodes.forEach(episode => {
          let point = episode.point;
          if (point.game != current_game) {
             game_counter += 1;
             current_game = point.game;
             games[game_counter] = { points: [], range: [point.index, point.index] };
          }
          games[game_counter].points.push(point);
          games[game_counter].index = game_counter;
          games[game_counter].set = episode.set.index;
          games[game_counter].score = episode.game.games;
          games[game_counter].complete = episode.game.complete;
          games[game_counter].range[1] = point.index;
          if (episode.game.complete) {
             games[game_counter].winner = point.winner;
          }
       });
       return games;
       if (set != undefined) games = games.filter(function(game) { return game.set == set });
    }

    // ACCESSORS

    // allows updating individual options and suboptions
    // while preserving state of other options
    chart.options = function(values) {
        if (!arguments.length) return options;
        var vKeys = Object.keys(values);
        var oKeys = Object.keys(options);
        for (var k=0; k < vKeys.length; k++) {
           if (oKeys.indexOf(vKeys[k]) >= 0) {
              if (typeof(options[vKeys[k]]) == 'object') {
                 var sKeys = Object.keys(values[vKeys[k]]);
                 var osKeys = Object.keys(options[vKeys[k]]);
                 for (var sk=0; sk < sKeys.length; sk++) {
                    if (osKeys.indexOf(sKeys[sk]) >= 0) {
                       options[vKeys[k]][sKeys[sk]] = values[vKeys[k]][sKeys[sk]];
                    }
                 }
              } else {
                 options[vKeys[k]] = values[vKeys[k]];
              }
           }
        }
        return chart;
    }

    chart.data = function(set_object) {
      if (!arguments.length) return set_data;
      set_data = set_object;
    }

   chart.events = function(functions) {
        if (!arguments.length) return events;
        var fKeys = Object.keys(functions);
        var eKeys = Object.keys(events);
        for (var k=0; k < fKeys.length; k++) {
           if (eKeys.indexOf(fKeys[k]) >= 0) events[fKeys[k]] = functions[fKeys[k]];
        }
        return chart;
   }

    chart.colors = function(colores) {
        if (!arguments.length) return options.colors;
        options.colors.players = colores;
        return chart;
    }

    chart.width = function(value) {
        if (!arguments.length) return options.width;
        options.width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return options.height;
        options.height = value;
        return chart;
    };

    chart.update = function(opts) {
       if (events.update.begin) events.update.begin(); 
       if (typeof update === 'function') update(opts);
        setTimeout(function() { 
          if (events.update.end) events.update.end(); 
        }, options.display.transition_time);
       return true;
    }

    chart.duration = function(value) {
        if (!arguments.length) return options.display.transition_time;
       options.display.transition_time = value;
       return chart;
    }

    function lastElement(arr) { return arr[arr.length - 1]; }

    return chart;
}
