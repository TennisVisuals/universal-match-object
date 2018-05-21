// TODO: color the gamescore in the momentum chart

function momentumChart() {

    var data;
    var update;
    var fish_school = [];
    var images = { left: undefined, right: undefined };

    var options = {
        id: 'm1',
        fullWidth: window.innerWidth,
        fullHeight: window.innerHeight,
        margins: {
           top:    1, bottom: 1,  // Chrome bug can't be 0
           left:   3, right:  3   // Chrome bug can't be 0
        },
        fish: {
           gridcells: ['0', '15', '30', '40', 'G'],
           cell_size: undefined,
           min_cell_size: 5,
           max_cell_size: 10
        },
        display: {
           continuous:  false,
           reverse:     false,
           orientation: 'vertical',
           leftImg:     false,
           rightImg:    false,
           show_images: undefined,
           transition_time: 0,
           sizeToFit:   true,
           service:     true,
           player:      true,
           rally:       true,
           score:       false,
           momentum_score: true,
           grid:        true
        },
        colors: {
           players: { 0: 'red', 1: 'black' },
           results: { 'Out': 'red', 'Net': 'coral', 'Unforced Error': 'red', 'Forced': 'orange', 
                      'Ace': 'lightgreen', 'Serve Winner': 'lightgreen', 'Winner': 'lightgreen', 
                      'Forced Volley Error': 'orange', 'Forced Error': 'orange', 'In': 'yellow', 
                      'Passing Shot': 'lightgreen', 'Out Passing Shot': 'red', 'Net Cord': 'yellow', 
                      'Out Wide': 'red', 'Out Long': 'red', 'Double Fault': 'red', 'Unknown': 'blue',
                      'Error': 'red'
           }
        }
    };

    function width() { return options.fullWidth - options.margins.left - options.margins.right }
    function height() { return options.fullHeight - options.margins.top - options.margins.bottom }

    options.height = height();
    options.width = width();

    var default_colors = { default: "#235dba" };
    var colors = JSON.parse(JSON.stringify(default_colors));

    var events = {
       'score':      { 'click': null },
       'leftImage':  { 'click': null },
       'rightImage': { 'click': null },
       'update':     { 'begin': null, 'end': null },
       'point':      { 'mouseover': null, 'mouseout': null, 'click': null },
    };

    function chart(selection) {
      selection.each(function () {
         dom_parent = d3.select(this);

       var root = dom_parent.append('div')
           .attr('class', 'momentumRoot')
           .attr('transform', "translate(0, 0)")

       var momentumFrame = root.append('svg').attr('class','momentumFrame');

       momentumFrame.node().setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
       momentumFrame.node().setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

       var bars = momentumFrame.append('g').attr('id', 'momentumBars');
       var fish = momentumFrame.append('g').attr('id', 'momentumFish');
       var game = momentumFrame.append('g').attr('id', 'momentumGame');
 
       update = function(opts) {

          if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
             var dims = selection.node().getBoundingClientRect();
             if (options.display.orientation == 'vertical') {
                options.fullWidth = Math.max(dims.width, 100);
                options.fullHeight = Math.max(dims.height, 100);
             } else {
                // options.fullWidth = Math.max(dims.width, 100);
                options.fullHeight = Math.max(dims.height, 100);
                // options.fullHeight = cellSize() * maxDiff() * 2;
             }
          }

          options.height = height();
          options.width = width();

          var vert = options.display.orientation == 'vertical' ? 1 : 0;
          var fish_offset = vert ? options.width : options.height;
          var fish_length = vert ? options.height : options.width;
          var midpoint = fish_offset / 2;

          var all_games = groupGames(data);
          var max_rally = 0;
          data.forEach(function(point) {
             if (point.rally != undefined && point.rally.length > max_rally) max_rally = point.rally.length;
          })

          var cell_size = cellSize();

          // remove extraneous fish instances
          var old_fish = fish_school.slice(all_games.length);
          old_fish.forEach(function(f) {
              d3.selectAll('.c' + f.options().id).remove();
          });
          // trim school based on length of data
          fish_school = fish_school.slice(0, all_games.length);

          var radius;
          var coords = [0, 0];
          var score_lines = [];
          all_games.forEach(function(g, i) {
             // add fish where necessary
             if (!fish_school[i]) { 
                fish_school.push(gameFish()); 
                momentumFrame.call(fish_school[i]);
                fish_school[i].g({ 
                   bars: bars.append('g').attr('class', 'cGF' + i), 
                   fish: fish.append('g').attr('class', 'cGF' + i), 
                   game: game.append('g').attr('class', 'cGF' + i) 
                });
                fish_school[i].options({
                   id: 'GF' + i, 
                   display: { score: false, point_score: false },
                   fish: { school: true },
                });
             }
             fish_school[i].width(fish_offset).height(fish_offset);
             fish_school[i].options({ 
                score: g.score, 
                fish: { cell_size: cell_size, max_rally: max_rally },
                display: { 
                   orientation: options.display.orientation,
                   service: options.display.service,
                   rally: options.display.rally,
                   player: options.display.player,
                   grid: options.display.grid
                },
                colors: { players: { 0: options.colors.players[0], 1: options.colors.players[1] }}
             });
             fish_school[i].data(g.points);
             fish_school[i].coords(coords).update();
             var new_coords = fish_school[i].coords();
             coords[0] += vert ? new_coords[0] : new_coords[1] - (new_coords[2] / 2);
             coords[1] += vert ? new_coords[1] : new_coords[0] + (new_coords[2] / 2);
             score_lines.push({ 
                score: g.score, 
                index: g.index,
                l: coords[1] + (new_coords[2] * 1.75),
                o: coords[0] + (new_coords[2] * 1.75),
                set_end: g.last_game
             });
             if (g.last_game && !options.display.continuous) { coords[vert ? 0 : 1] = 0; }
             radius = new_coords[2] / 2;
          });

          // This resize *must* take place after the fishshcool has been generated!
          // ---------------------------------------------------------------------
          root
             .attr('width', options.width + 'px')
             .attr('height', (vert ? (100 + coords[1]) : options.height) + 'px')
             .on('mouseover', showImages)
             .on('mouseout', hideImages);

          momentumFrame
             .attr('width',    options.width + 'px')
             .attr('height',   (vert ? (100 + coords[1])  : options.height) + 'px');
          // ---------------------------------------------------------------------

          var midline = fish.selectAll('.midline' + options.id)
             .data([0])

          midline.enter()
            .append('line')
            .attr("class",          "midline" + options.id)
            .attr("x1",             vert ? midpoint : radius)
            .attr("x2",             vert ? midpoint : coords[0] + (5 * (radius || 0)))
            .attr("y1",             vert ? radius : midpoint)
            .attr("y2",             vert ? coords[1] + (5 * radius) : midpoint)
            .attr("stroke-width",   lineWidth)
            .attr("stroke",         "#ccccdd")

          midline.exit().remove()

          midline
            .transition().duration(options.display.transition_time)
            .attr("x1",             vert ? midpoint : radius)
            .attr("x2",             vert ? midpoint : coords[0] + (5 * (radius || 0)))
            .attr("y1",             vert ? radius : midpoint)
            .attr("y2",             vert ? coords[1] + (5 * radius) : midpoint)
            .attr("stroke-width",   lineWidth)
            .attr("stroke",         "#ccccdd")

          var scoreLines = fish.selectAll('.score_line' + options.id)
             .data(score_lines)

          scoreLines.enter()
            .append('line')
            .attr("class",          "score_line" + options.id)
            .attr("x1",             function(d) { return vert ? cell_size * 2 : d.o })
            .attr("x2",             function(d) { return vert ? fish_offset - cell_size * 2 : d.o })
            .attr("y1",             function(d) { return vert ? d.l : cell_size * 3 })
            .attr("y2",             function(d) { return vert ? d.l : fish_offset - cell_size * 3 })
            .attr("stroke-width",   lineWidth)
            .attr("stroke-dasharray", function(d) { return d.set_end ? "0" : "5,5"; })
            .attr("stroke",         function(d) { return d.set_end ? "#000000" : "#ccccdd"; })
 
          scoreLines.exit().remove()
 
          scoreLines
            .transition().duration(options.display.transition_time)
            .attr("x1",             function(d) { return vert ? cell_size * 2 : d.o })
            .attr("x2",             function(d) { return vert ? fish_offset - cell_size * 2 : d.o })
            .attr("y1",             function(d) { return vert ? d.l : cell_size * 3 })
            .attr("y2",             function(d) { return vert ? d.l : fish_offset - cell_size * 3 })
            .attr("stroke-width",   lineWidth)
            .attr("stroke-dasharray", function(d) { return d.set_end ? "0" : "5,5"; })
            .attr("stroke",         function(d) { return d.set_end ? "#000000" : "#ccccdd"; })


          if (options.display.momentum_score) {
             var score_text = fish.selectAll(".score_text" + options.id)
                .data(score_lines)

             score_text.exit().remove()

             score_text.enter()
                .append('g')
                .attr("class", "score_text" + options.id)
                .attr('transform',  scoreText)
                .on('click', function(d) { if (events.score.click) events.score.click(d); }) 
               .merge(score_text)
                .attr("class", "score_text" + options.id)
                .attr('transform',  scoreText)
                .on('click', function(d) { if (events.score.click) events.score.click(d); }) 

             var scores = score_text.selectAll(".score" + options.id)
                .data(function(d) { return d.score; })

             scores.exit().remove()

             scores.enter()
                .append('text')
                .attr('class',          'score' + options.id)
                .attr('transform',      scoreT)
                .attr('font-size',      radius * 4.0 + 'px')
                .attr('opacity',        .1)
                .attr('text-anchor',    'middle')
                .text(function(d) { return d } )
               .merge(scores)
                .attr('class',          'score' + options.id)
                .transition().duration(options.display.transition_time)
                .attr('transform',      scoreT)
                .attr('font-size',      radius * 4.0 + 'px')
                .attr('opacity',        .1)
                .attr('text-anchor',    'middle')
                .text(function(d) { return d } )
          } else {
             fish.selectAll(".score_text" + options.id).remove();
          }

          function scoreText(d) { return translate(0, (vert ? d.l : d.o - radius), 0); }
          function scoreT(d, i) {
             var offset = vert ? fish_offset / 3 : options.height / 3;
             var o = i ? midpoint + offset : midpoint - offset + radius * 3;
             var l = -1 * radius * (vert ? .25 : .5);
             return translate(o, l, 0);
          }

          function translate(o, l, rotate) {
             var x = vert ? o : l;
             var y = vert ? l : o;
             return "translate(" + x + "," + y + ") rotate(" + rotate + ")" 
          }

          function lineWidth(d, i) { return radius > 20 ? 2 : 1; }

          function cellSize() {
             var cell_size;

             if (options.display.orientation == 'vertical') {
                // if the display is vertical use the width divided by maxDiff
                cell_size = options.width / 2 / (maxDiff() + 1);
             } else {
                // if the display is horizontal use the width divided by # points
                // var radius = options.width / (data.points().length + 4);
                var radius = options.width / (data.length + 4);
                var cell_size = Math.sqrt(2 * radius * radius);
             }
            return Math.min(options.fish.max_cell_size, cell_size);
          }

          function maxDiff() {
             var max_diff = 0;
             var cumulative = [0, 0];

             data.forEach(function(episode)  {
                cumulative[episode.point.winner] += 1;
                var diff = Math.abs(cumulative[0] - cumulative[1]);
                if (diff > max_diff) max_diff = diff;
             });

             return max_diff;
          }

          if (options.display.rightImg) {
             images.right = momentumFrame.selectAll('image.rightImage')
                .data([0])
 
             images.right.exit().remove();
 
             images.right.enter()
               .append('image')
               .attr('class', 'rightImage')
               .attr('xlink:href', options.display.rightImg)
               .attr('x', options.width - 20)
               .attr('y', 5)
               .attr('height', '20px')
               .attr('width',  '20px')
               .attr('opacity', options.display.show_images ? 1 : 0)
               .on('click', function() { if (events.rightImage.click) events.rightImage.click(options.id); }) 
              .merge(images.right)
               .attr('x', options.width - 20)
               .attr('xlink:href', options.display.rightImg)
               .on('click', function() { if (events.rightImage.click) events.rightImage.click(options.id); }) 
 
          } else {
             momentumFrame.selectAll('image.rightImage').remove();
          }

          if (options.display.leftImg) {
             images.left = momentumFrame.selectAll('image.leftImage')
                .data([0])

             images.left.enter()
               .append('image')
               .attr('class', 'leftImage')
               .attr('xlink:href', options.display.leftImg)
               .attr('x', 10)
               .attr('y', 5)
               .attr('height', '20px')
               .attr('width',  '20px')
               .attr('opacity', options.display.show_images ? 1 : 0)
               .on('click', function() { if (events.leftImage.click) events.leftImage.click(); }) 
              .merge(images.left)
               .attr('xlink:href', options.display.leftImg)
               .on('click', function() { if (events.leftImage.click) events.leftImage.click(options.id); }) 

             images.left.exit().remove();
          } else {
             momentumFrame.selectAll('image.leftImage').remove();
          }

          function showImages() {
             if (options.display.show_images == false) return;
             if (options.display.leftImg) images.left.attr('opacity', 1);
             if (options.display.rightImg) images.right.attr('opacity', 1);
          }

          function hideImages() {
             if (options.display.show_images) return;
             if (options.display.leftImg) images.left.attr('opacity', 0);
             if (options.display.rightImg) images.right.attr('opacity', 0);
          }

       }
      });
    }

    // ACCESSORS

    chart.exports = function() {
       return { function1: function1, function1: function1 }
    }

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
              if (typeof oo == 'object' && typeof vo !== 'function' && oo.constructor !== Array) {
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

    chart.width = function(value) {
        if (!arguments.length) return options.fullWidth;
        options.fullWidth = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return options.fullHeight;
        options.fullHeight = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return chart;
    };

    chart.update = function(opts) {
      if (events.update.begin) events.update.begin(); 
      if (typeof update === 'function' && data) update(opts);
       setTimeout(function() { 
         if (events.update.end) events.update.end(); 
       }, options.display.transition_time);
    }

    chart.colors = function(color3s) {
        if (!arguments.length) return colors;
        if (typeof color3s !== 'object') return false;
        var keys = Object.keys(color3s);        
        if (!keys.length) return false;
        // remove all properties that are not colors
        keys.forEach(function(f) { if (! /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f])) delete color3s[f]; })
        if (Object.keys(color3s).length) {
           colors = color3s;
        } else {
           colors = JSON.parse(JSON.stringify(default_colors));
        }
        return chart;
    }

   return chart;
}

function gameFish() {

    var data;
    var fish_width;
    var fish_height;
    var coords = [0, 0];
    var last_coords;
    var update;
    var images = { left: undefined, right: undefined };

    var options = {
        id: 'gf1',
        score: [0, 0],
        width: window.innerWidth,
        height: window.innerHeight,
        margins: {
           top:    10, bottom: 10, 
           left:   10, right:  10
        },
        fish: {
           school:    false,
           gridcells: ['0', '15', '30', '40', 'G'],
           max_rally: undefined,
           cell_size: undefined,
           min_cell_size: 5,
           max_cell_size: 20
        },
        set: {
           tiebreak_to: 7
        },
        display: {
           orientation: 'vertical',
           transition_time: 0,
           sizeToFit:   false,
           leftImg:     false,
           rightImg:    false,
           show_images: undefined,
           reverse:     false,
           point_score: true,
           service:     true,
           player:      true,
           rally:       true,
           score:       true,
           grid:        true,
        },
        colors: {
           players: { 0: 'red', 1: 'black' },
           results: { 'Out': 'red', 'Net': 'coral', 'Unforced Error': 'red', 'Forced': 'orange', 
                      'Ace': 'lightgreen', 'Serve Winner': 'lightgreen', 'Winner': 'lightgreen', 
                      'Forced Volley Error': 'orange', 'Forced Error': 'orange', 'In': 'yellow', 
                      'Passing Shot': 'lightgreen', 'Out Passing Shot': 'red', 'Net Cord': 'yellow', 
                      'Out Wide': 'red', 'Out Long': 'red', 'Double Fault': 'red', 'Unknown': 'blue',
                      'Error': 'red'
           }
        }
    };

    var default_colors = { default: "#235dba" };
    var colors = JSON.parse(JSON.stringify(default_colors));

    var events = {
       'leftImage':  { 'click': null },
       'rightImage': { 'click': null },
       'update':  { 'begin': null, 'end': null },
       'point':    { 'mouseover': null, 'mouseout': null, 'click': null }
    };

    var fishFrame;
    var root;
    var bars;
    var fish;
    var game;

    function chart(selection) {
      var parent_type = selection._groups[0][0].tagName.toLowerCase();

      if (parent_type != 'svg') {
         root = selection.append('div')
             .attr('class', 'fishRoot');

         fishFrame = root.append('svg')
           .attr('id',    'gameFish' + options.id)
           .attr('class', 'fishFrame')

         bars = fishFrame.append('g');
         fish = fishFrame.append('g');
         game = fishFrame.append('g');

      }

      update = function(opts) {

         if (bars == undefined || fish == undefined || game == undefined) return;

         if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
            var dims = selection.node().getBoundingClientRect();
            options.width = Math.max(dims.width, 100);
            options.height = Math.max(dims.height, 100);
         }

         if (options.fish.cell_size && !options.fish.school) {
            var multiplier = Math.max(10, data.length + 2);
            options.height = options.fish.cell_size * multiplier * .9;
         }

         var tiebreak = false;
         var max_rally = 0;
         data.forEach(function(e) { 
            if (e.rally && e.rally.length > max_rally) max_rally = e.rally.length;
            if (e.score.indexOf('T') > 0) tiebreak = true; 
         });

         if (options.fish.max_rally && options.fish.max_rally > max_rally) max_rally = options.fish.max_rally;

         fish_width  = options.width  - (options.margins.left + options.margins.right);
         fish_height = options.height - (options.margins.top + options.margins.bottom);
         var vert = options.display.orientation == 'vertical' ? 1 : 0;
         var fish_offset = vert ? fish_width : fish_height;
         var fish_length = vert ? fish_height : fish_width;
         var midpoint = (vert ? options.margins.left : options.margins.top) + fish_offset / 2;
         var sw = 1;    // service box % offset
         var rw = .9;   // rally_width % offset

         bars.attr('transform', 'translate(' + (vert ? 0 : coords[0]) + ',' + (vert ? coords[1] : 0) + ')');
         fish.attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');
         game.attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');

         if (options.fish.cell_size) {
            var cell_size = options.fish.cell_size;
         } else {
            var offset_divisor = tiebreak ? options.set.tiebreak_to + 4 : options.fish.gridcells.length + 2;
            var cell_offset = fish_offset / (options.fish.gridcells.length + (options.display.service ? offset_divisor : 0));
            var cell_length = fish_length / (data.length + 2);
            var cell_size = Math.min(cell_offset, cell_length);
            var cell_size = Math.max(options.fish.min_cell_size, cell_size);
            var cell_size = Math.min(options.fish.max_cell_size, cell_size);
         }

         var diag = Math.sqrt(2 * Math.pow(cell_size, 2));
         var radius = diag / 2;

         grid_data = [];
         grid_labels = [];
         var grid_side = tiebreak ? options.set.tiebreak_to : options.fish.gridcells.length - 1;
         for (var g=0; g < grid_side; g++) {
            var label = tiebreak ? g : options.fish.gridcells[g];
            // l = length, o = offset
            grid_labels.push({ label: label, l: (g + (vert ? 1.25 : .75)) * radius, o: (g + (vert ? .75 : 1.25)) * radius, rotate: 45 });
            grid_labels.push({ label: label, l: (g + 1.25) * radius, o: -1 * (g + .75) * radius, rotate: -45 });
            for (var c=0; c < grid_side; c++) {
               grid_data.push([g, c]);
            }
         }

         var score_offset = options.display.score ? cell_size : 0;

         // check if this is a standalone SVG or part of larger SVG
         if (root) {
            root
               .attr('width',    options.width  + 'px')
               .attr('height',   options.height + 'px')

            fishFrame
               .attr('width',    options.width  + 'px')
               .attr('height',   options.height + 'px')
         }

         if (options.display.point_score) {
            var game_score = fish.selectAll('.game_score' + options.id)
               .data(grid_labels)
               
            game_score.exit().remove()

            game_score.enter()
               .append('text')
               .attr("font-size",   radius * .8 + 'px')
               .attr("transform",   gscoreT)
               .attr("text-anchor", "middle")
              .merge(game_score)
               .transition().duration(options.display.transition_time)
               .attr("class", "game_score" + options.id)
               .attr("font-size",   radius * .8 + 'px')
               .attr("transform",   gscoreT)
               .attr("text-anchor", "middle")
               .text(function(d) { return d.label })
         } else {
            fish.selectAll('.game_score' + options.id).remove();
         }

         if (options.display.grid) {
            var gridcells = fish.selectAll('.gridcell' + options.id)
               .data(grid_data);

            gridcells.exit().remove()

            gridcells.enter()
               .append('rect')
               .attr("stroke",         "#ccccdd")
               .attr("stroke-width",   lineWidth)
               .attr("transform",      gridCT)
               .attr("width",          cell_size)
               .attr("height",         cell_size)
              .merge(gridcells)
               .transition().duration(options.display.transition_time)
               .attr("class",          "gridcell" + options.id)
               .attr("stroke-width",   lineWidth)
               .attr("width",          cell_size)
               .attr("height",         cell_size)
               .attr("transform",      gridCT)
               .attr("fill-opacity",   0)
         } else {
            fish.selectAll('.gridcell' + options.id).remove();
         }

         var gamecells = game.selectAll('.gamecell' + options.id)
              .data(data);

         gamecells.exit().remove()

         gamecells.enter()
            .append('rect')
            .attr("opacity",     0)
            .attr("width",          cell_size)
            .attr("height",         cell_size)
            .attr("transform",      gameCT)
            .attr("stroke",         "#ccccdd")
            .attr("stroke-width",   lineWidth)
           .merge(gamecells)
            .attr("id", function(d, i) { return options.id + 'Gs' + d.set + 'g' + d.game + 'p' + i })
            .transition().duration(options.display.transition_time)
            .attr("class",          "gamecell" + options.id)
            .attr("width",          cell_size)
            .attr("height",         cell_size)
            .attr("transform",      gameCT)
            .attr("stroke",         "#ccccdd")
            .attr("stroke-width",   lineWidth)
            .attr("opacity",        options.display.player ? 1 : 0)
            .style("fill", function(d) { return options.colors.players[d.winner]; })

         var results = game.selectAll('.result' + options.id)
            .data(data)
            
         results.exit().remove()

         results.enter()
            .append('circle')
            .attr("stroke",         "black")
            .attr("id", function(d, i) { return options.id + 'Rs' + d.set + 'g' + d.game + 'p' + i })
            .attr("class",    'result' + options.id)
            .attr("opacity",        1)
            .attr("stroke-width",   lineWidth)
            .attr("cx",             zX)
            .attr("cy",             zY)
            .attr("r",              circleRadius)
            .style("fill", function(d) { return options.colors.results[d.result]; })
           .merge(results)
            .attr("id", function(d, i) { return options.id + 'Rs' + d.set + 'g' + d.game + 'p' + i })
            .attr("class",    'result' + options.id)
            .transition().duration(options.display.transition_time)
            .attr("stroke-width",   lineWidth)
            .attr("cx",             zX)
            .attr("cy",             zY)
            .attr("r",              circleRadius)
            .style("fill", function(d) { return options.colors.results[d.result]; })

         // offset Scale
         var oScale = d3.scaleLinear()
            .range([0, fish_offset * rw])
            .domain([0, max_rally])

         // lengthScale
         var lScale = d3.scaleBand()
            .domain(d3.range(data.length))
            .range([0, (data.length) * radius])
            .round(true)

         if (options.display.rally) {
            var rally_bars = bars.selectAll(".rally_bar" + options.id)
               .data(data)

            rally_bars.exit().remove()

            rally_bars.enter()
               .append("rect")
               .attr("opacity",        0)
               .attr("transform",      rallyTstart)
               .attr("height",         vert ? lScale.bandwidth() : 0)
               .attr("width",          vert ? 0 : lScale.bandwidth())
              .merge(rally_bars)
               .attr("class",          "rally_bar" + options.id)
               .on("mouseover", function(d) { d3.select(this).attr('fill', 'yellow'); })
               .on("mouseout", function(d) { d3.select(this).attr('fill', '#eeeeff'); })
               .transition().duration(options.display.transition_time)
               .attr("id", function(d, i) { return options.id + 'Bs' + d.set + 'g' + d.game + 'p' + i })
               .attr("opacity",        1)
               .attr("stroke",         "white")
               .attr("stroke-width",   lineWidth)
               .attr("fill",           "#eeeeff")
               .attr("transform",      rallyT)
               .attr("height",         vert ? lScale.bandwidth() : rallyCalc)
               .attr("width",          vert ? rallyCalc : lScale.bandwidth())
         } else {
            bars.selectAll(".rally_bar" + options.id).remove();
         }

         if (options.display.score) {
            var score = options.score.slice();
            if (options.display.reverse) score.reverse();
            var set_score = bars.selectAll(".set_score" + options.id)
               .data(score)

            set_score.exit().remove()

            set_score.enter()
               .append('text')
               .attr("class", "set_score" + options.id)
               .attr('transform',      sscoreT)
               .attr('font-size',      radius * .8 + 'px')
               .attr('text-anchor',    'middle')
               .text(function(d) { return d } )
              .merge(set_score)
               .attr("class", "set_score" + options.id)
               .attr('transform',      sscoreT)
               .attr('font-size',      radius * .8 + 'px')
               .attr('text-anchor',    'middle')
               .text(function(d) { return d } )

            var ssb = bars.selectAll(".ssb" + options.id)
               .data(options.score)

            ssb.exit().remove()

            ssb.enter()
               .append('rect')
              .merge(ssb)
               .attr("class", "ssb" + options.id)
               .attr('transform',      ssbT)
               .attr('stroke',         'black')
               .attr('stroke-width',   lineWidth)
               .attr('fill-opacity',   0)
               .attr('height',         radius + 'px')
               .attr('width',          radius + 'px')

         } else {
            bars.selectAll(".set_score" + options.id).remove();
            bars.selectAll(".ssb" + options.id).remove();
         }

         if (options.display.service) {
            var serves = [];
            data.forEach(function(s, i) {
               var first_serve = false;
               var serve_outcomes = ['Ace', 'Serve Winner', 'Double Fault'];
               if (s.first_serve) {
                  first_serve = true;
                  serves.push({ point: i, serve: 'first', server: s.server, result: s.first_serve.error });
               }

               serves.push({ 
                  point: i, 
                  serve: first_serve ? 'second' : 'first', 
                  server: s.server,
                  result: serve_outcomes.indexOf(s.result) >= 0 ? s.result : 'In' 
               });
            });

            var service = bars.selectAll(".serve" + options.id)
               .data(serves)

            service.exit().remove()

            service.enter()
               .append("circle")
               .attr("class",          "serve" + options.id)
               .attr("cx",             sX)
               .attr("cy",             sY)
               .attr("r",              circleRadius)
               .attr("stroke",         colorShot)
               .attr("stroke-width",   lineWidth)
               .attr("fill",           colorShot)
              .merge(service)
               .attr("class",          "serve" + options.id)
               .attr("cx",             sX)
               .attr("cy",             sY)
               .attr("r",              circleRadius)
               .attr("stroke",         colorShot)
               .attr("stroke-width",   lineWidth)
               .attr("fill",           colorShot)

            var service_box = bars.selectAll(".sbox" + options.id)
               .data(data)

            service_box.exit().remove()

            service_box.enter()
               .append("rect")
               .attr("stroke",         "#ccccdd")
               .attr("fill-opacity",   0)
               .attr("transform",      sBoxT)
               .attr("class",          "sbox" + options.id)
               .attr("stroke-width",   lineWidth)
               .attr("height",         vert ? lScale.bandwidth() : 1.5 * radius)
               .attr("width",          vert ? 1.5 * radius : lScale.bandwidth())
              .merge(service_box)
               .attr("transform",      sBoxT)
               .attr("class",          "sbox" + options.id)
               .attr("stroke-width",   lineWidth)
               .attr("height",         vert ? lScale.bandwidth() : 1.5 * radius)
               .attr("width",          vert ? 1.5 * radius : lScale.bandwidth())

            var returns = bars.selectAll(".return" + options.id)
               .data(data)

            returns.exit().remove()

            returns.enter()
               .append("circle")
               .attr("class",          "return" + options.id)
               .attr("cx",             rX)
               .attr("cy",             rY)
               .attr("r",              circleRadius)
               .attr("stroke",         colorReturn)
               .attr("stroke-width",   lineWidth)
               .attr("fill",           colorReturn)
              .merge(returns)
               .attr("class",          "return" + options.id)
               .attr("cx",             rX)
               .attr("cy",             rY)
               .attr("r",              circleRadius)
               .attr("stroke",         colorReturn)
               .attr("stroke-width",   lineWidth)
               .attr("fill",           colorReturn)

         } else {
            bars.selectAll(".sbox" + options.id).remove();
            bars.selectAll(".return" + options.id).remove();
            bars.selectAll(".serve" + options.id).remove();
         }

         if (options.display.rightImg) {
            images.right = fishFrame.selectAll('image.rightImage')
               .data([0])

            images.right.exit().remove();

            images.right.enter()
              .append('image')
              .attr('class', 'rightImage')
              .attr('xlink:href', options.display.rightImg)
              .attr('x', options.width - 30)
              .attr('y', 5)
              .attr('height', '20px')
              .attr('width',  '20px')
              .attr('opacity', options.display.show_images ? 1 : 0)
              .on('click', function() { if (events.rightImage.click) events.rightImage.click(options.id); }) 
             .merge(images.right)
              .attr('x', options.width - 30)
              .attr('xlink:href', options.display.rightImg)
              .on('click', function() { if (events.rightImage.click) events.rightImage.click(options.id); }) 

         } else {
            if (fishFrame) fishFrame.selectAll('image.rightImage').remove();
         }

         if (options.display.leftImg) {
            images.left = fishFrame.selectAll('image.leftImage')
               .data([0])

            images.left.enter()
              .append('image')
              .attr('class', 'leftImage')
              .attr('xlink:href', options.display.leftImg)
              .attr('x', 10)
              .attr('y', 5)
              .attr('height', '20px')
              .attr('width',  '20px')
              .attr('opacity', options.display.show_images ? 1 : 0)
              .on('click', function() { if (events.leftImage.click) events.leftImage.click(); }) 
             .merge(images.left)
              .attr('xlink:href', options.display.leftImg)
              .on('click', function() { if (events.leftImage.click) events.leftImage.click(options.id); }) 

            images.left.exit().remove();
         } else {
            if (fishFrame) fishFrame.selectAll('image.leftImage').remove();
         }

         // ancillary functions for update()
         function circleRadius(d, i) { 
            return (options.display.player || options.display.service) ? radius / 4 : radius / 2; 
         }
         function lineWidth(d, i) { return radius > 20 ? 1 : .5; }
         function colorShot(d, i) { return options.colors.results[d.result]; }
         function colorReturn(d, i) { 
            if (d.rally == undefined) return "white";
            if (d.rally.length > 1) return 'yellow';
            if (d.rally.length == 1) return options.colors.results[d.result]; 
            return "white";
         }

         function rallyCalc(d, i) { return d.rally ? oScale(d.rally.length) : 0; }

         function sscoreT(d, i) {
            var o = i ? midpoint + radius * .5 : midpoint - radius * .5;
            var o = vert ? o : o + radius * .3;
            var l = radius * (vert ? .8 : .5);
            return translate(o, l, 0);
         }

         function ssbT(d, i) {
            var o = i ? midpoint : midpoint - radius;
            var l = 0;
            return translate(o, l, 0);
         }

         function gscoreT(d, i) {
            var o = +midpoint + d.o;
            var l = radius + d.l;
            return translate(o, l, d.rotate);
         }

         function gridCT(d, i) {
            var o = midpoint + ((d[1] - d[0] + vert - 1) * radius);
            var l = (d[0] + d[1] + 3 - vert ) * radius;
            return translate(o, l, 45);
         }

         function gameCT(d, i) {
            var o = midpoint + (findOffset(d) + vert - 1) * radius;
            var l = (i + 4 - vert) * radius;
            last_coords = [o - midpoint, l - diag, diag];
            return translate(o, l, 45);
         }

         function sBoxT(d, i) {
            var o = d.server == 0 ? midpoint - (fish_offset / 2 * sw) : midpoint + (fish_offset / 2 * sw) - (1.5 * radius);
            var l = radius + cL(d, i);
            return translate(o, l, 0); 
         }

         function rallyTstart(d, i) {
            var o = midpoint;
            var l = radius + cL(d, i);
            return translate(o, l, 0);
         }

         function rallyT(d, i) {
            var o = d.rally ? (midpoint - (oScale(d.rally.length) / 2)) : 0;
            var l = radius + cL(d, i);
            return translate(o, l, 0);
         }

         function translate(o, l, rotate) {
            var x = vert ? o : l;
            var y = vert ? l : o;
            return "translate(" + x + "," + y + ") rotate(" + rotate + ")" 
         }

         function cL(d, i) { return (i + 2.5) * radius; }

         function rX(d, i) { return vert ? rO(d, i) : rL(d, i); }
         function rY(d, i) { return vert ? rL(d, i) : rO(d, i); }
         function rL(d, i) { return radius + (i + 3) * radius; }
         function rO(d, i) {
            return d.server == 0 ? midpoint + (fish_offset / 2 * sw) - (.75 * radius) : midpoint - (fish_offset / 2 * sw) + (.75 * radius);
         }

         function sX(d, i) { return vert ? sO(d, i) : sL(d, i); }
         function sY(d, i) { return vert ? sL(d, i) : sO(d, i); }
         function sL(d, i) { return radius + (d.point + 3) * radius; }
         function sO(d) {
            var offset = ((d.serve == 'first' && d.server == 0) || (d.serve == 'second' && d.server == 1)) ? .4 : 1.1;
            return d.server == 0 ? midpoint - (fish_offset / 2 * sw) + (offset * radius) : midpoint + (fish_offset / 2 * sw) - (offset * radius);
         }

         function zX(d, i) { return vert ? zO(d, i) : zL(d, i); }
         function zY(d, i) { return vert ? zL(d, i) : zO(d, i); }
         function zL(d, i) { return radius + (i + 3) * radius; }
         function zO(d, i) { return +midpoint + findOffset(d) * radius; }
      }

      function findOffset(point) { 
         return point.points[options.display.reverse ? 0 : 1] - point.points[options.display.reverse ? 1 : 0]; 
      }
    }

    // ACCESSORS

    chart.g = function(values) {
        if (!arguments.length) return chart;
        if (typeof values != 'object' || values.constructor == Array) return;
        if (values.bars) bars = values.bars;
        if (values.fish) fish = values.fish;
        if (values.game) game = values.game;
    }

    chart.exports = function() {
       return { function1: function1, function1: function1 }
    }

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

    chart.coords = function(value) {
        if (!arguments.length) return last_coords;
        coords = value;
       return chart;
    }

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = JSON.parse(JSON.stringify(value));
        return chart;
    };

    chart.update = function(opts) {
      if (events.update.begin) events.update.begin(); 
      if (typeof update === 'function' && data) update(opts);
       setTimeout(function() { 
         if (events.update.end) events.update.end(); 
       }, options.display.transition_time);
    }

    chart.colors = function(color3s) {
        if (!arguments.length) return colors;
        if (typeof color3s !== 'object') return false;
        var keys = Object.keys(color3s);        
        if (!keys.length) return false;
        // remove all properties that are not colors
        keys.forEach(function(f) { if (! /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f])) delete color3s[f]; })
        if (Object.keys(color3s).length) {
           colors = color3s;
        } else {
           colors = JSON.parse(JSON.stringify(default_colors));
        }
        return chart;
    }

   return chart;

   // ancillary functions

   function groupGames(point_episodes) {
      var games = [{ points: [] }];
      var game_counter = 0;
      var current_game = 0;
      point_episodes.forEach(function(episode, index) {
         var point = episode.point;
         if (point.game != current_game) {
            game_counter += 1;
            current_game = point.game;
            games[game_counter] = { points: [] };
         }
         if (index == point_episodes.length)
         games[game_counter].points.push(point); 
         games[game_counter].index = game_counter;
         games[game_counter].set = episode.set.index;
         games[game_counter].score = episode.game.games;
         if (episode.set.complete) games[game_counter].last_game = true;
      });
      return games;
   }

}
