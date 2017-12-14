"use strict";

function Puzzle15(width, height, columns, rows){
  var width = +width || 400,
      height = +height || 400,
      columns = +columns || 4,
      rows = +rows || 4, 
      frameSize   = columns * rows,
      hole        = frameSize,
      tileWidth   = Math.floor(width / columns),
      tileHeight  = Math.floor(height / rows),
      tiles       = [],
      style       = document.createElement('style'),
      isStart     = false,
      container   = {},
      button      = {},
      timer       = {},
      counter     = {};
  
  width = tileWidth * columns;
  height = tileHeight * rows;
      
  tiles.setCurrentAll = function(){
    for (var i = 0, l = this.length; i < l; i++){
      this[i].setCurrent();
    }
  }
  
  tiles.checkEqualAll = function(){
    for (var i = 0, l = this.length; i < l; i++){
      if(!this[i].checkEqual()) return false;
    }
    return true;
  }
  
  tiles.getTile = function(position){
    for (var i = 0, l = this.length; i < l; i++){
      if (this[i].currentPosition == position) return this[i];
    }
  }
  
  function Tile(elem){
    this.element = elem;    
    this.initialPosition;
    this.currentPosition;

    this.setCurrent = function(){
      this.element.dataset.currentPosition = this.currentPosition;
    }

    this.checkEqual = function(){
      if (this.initialPosition == this.currentPosition) return true;
      return false;
    }
  }
  
  function Timer(elem){
    var element = elem;
   
    this.timerId = 0;
    
    this.redraw = function(min,sec){
      min = min || 0;
      sec = sec || 0;
      element.innerHTML = ~~(min/10) +''+ min % 10 + ':' + ~~(sec/10) +''+ sec % 10;
    }
    
    this.start = function(delay){ 
      if (this.timerId) return;
      this.redraw();
      
      var self      = this, 
          startTime = new Date();
      
      this.timerId = setInterval(function(){
        var currentTime = new Date() - startTime,
            min         = ~~(currentTime / 60000),
            sec         = ~~(currentTime / 1000 - min * 60);
        self.redraw(min, sec);
      }, delay || 500);
    }
    
    this.stop = function(){
      if (!this.timerId) return;
      clearInterval(this.timerId);
      this.timerId = 0;
    }
  }
  
  function Counter(elem){
    var element = elem;
    
    this.redraw = function(amount){
      amount = amount || 0;
      element.innerHTML = Array(5 - String(amount).length).join('0') + (+amount);
    }
    
    this.increase = function(){
      this.redraw(+element.innerHTML + 1);
    }
  }

  function setInitialStyles(){
    var cssRuleSet;

    cssRuleSet = [
      '.puzzle15-container', //Selector
      'height: ' + (height + 40) + 'px;', //Declarations...
      'width: ' + width + 'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet, 0, 2);

    cssRuleSet = [
      '.puzzle15-tile',
      'width: ' + (tileWidth - 10) + 'px;',
      'height: ' + (tileHeight - 10) + 'px;',
      'line-height:' + (tileHeight - 10) + 'px;',
      'font-size: '+ (tileWidth <= tileHeight ? ~~(tileWidth*0.5) : ~~(tileHeight*0.5)) +'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet, 0, 2);
    
    cssRuleSet = [
      '.puzzle15-tile:before',
      'width: ' + tileWidth * 1.5 + 'px;',
      'height: ' + tileHeight * 0.9  + 'px;',
      'left: ' + (-tileWidth * 0.25) + 'px;',
      'top: ' + (-tileHeight * 0.5) + 'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet, 0, 2);
   
  }

  function formatCSSRuleSet(data, selectorIndent, declarationsIndent){
    var sI  = Array((selectorIndent || 0) + 1).join(' '),
        dI  = Array((declarationsIndent || 0) + 1).join(' '),
        str = sI;

    str += data[0] + ' {\n';
    for (var i = 1; i < data.length; i++){
      str += dI + data[i] + '\n';
    }
    str += sI + '}\n';

    return str;
  }

  function createTiles(){
    var tile,
        tileNo       = 0,
        cssRuleSet;

    for (var i = 0; i < rows; i++)
      for (var j = 0; j < columns; j++){
        cssRuleSet = [
          '[data-current-position="' + ++tileNo + '"]',
          'left: ' + (j * tileWidth + 5) + 'px;',
          'top: '+ (i * tileHeight + 5) + 'px;'
        ];
        style.innerHTML += formatCSSRuleSet(cssRuleSet,0,2);            

        if (i == rows - 1 && j == columns - 1) {
          continue;
        }

        tile = new Tile(document.createElement('div'));
        tile.element.className = 'puzzle15-tile';
        tile.element.innerHTML = tileNo;
        tile.initialPosition = tileNo;
        tile.currentPosition = tileNo;
        tile.setCurrent();
        
        tiles.push(tile);

        container.appendChild(tile.element);
      }
  }

  function createControlPanel(){
    var cssRuleSet,
        timerPanel,
        counterPanel;
    
    cssRuleSet = [
      '.puzzle15-control-panel',
      'top: ' + (height + 21) + 'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet,0,2);
    
    button = document.createElement('span');
    button.classList.add('puzzle15-control-panel');
    button.classList.add('button');
    button.innerHTML = '&#9655';
    
    counterPanel = document.createElement('span');
    counterPanel.classList.add('puzzle15-control-panel');
    counterPanel.classList.add('counter');
    counter = new Counter(counterPanel);
    counter.redraw();
    cssRuleSet = [
      '.puzzle15-control-panel.counter',
      'font-size: ' + (width > 150 ? 24 : width * 0.14)  + 'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet,0,2);
    
    timerPanel = document.createElement('span');
    timerPanel.classList.add('puzzle15-control-panel');
    timerPanel.classList.add('timer');
    timer = new Timer(timerPanel);
    timer.redraw();
    cssRuleSet = [
      '.puzzle15-control-panel.timer',
      'font-size: ' + (width > 150 ? 24 : width * 0.14)  + 'px;'
    ];
    style.innerHTML += formatCSSRuleSet(cssRuleSet,0,2);

    container.appendChild(counterPanel);
    container.appendChild(button);
    container.appendChild(timerPanel);
  }

  function shuffle(){
    var directions = [-columns, -1, 1, columns],
        randomDirection,
        targetPosition,
        i = 0;

    while (i < 100){
      randomDirection = directions[Math.floor(Math.random() * 4)];
      targetPosition = hole + randomDirection;
      if (targetPosition > 0 && targetPosition <= frameSize){ 
        if (tryExchange(tiles.getTile(targetPosition)) i++;
      }
    }
    tiles.setCurrentAll();
  }
  
  function tryExchange(tile){
    var targetPosition = +tile.currentPosition;
    if (targetPosition - columns == hole || 
        targetPosition + columns == hole ||
        (targetPosition - 1) % columns  && (targetPosition - 1 == hole) ||
        targetPosition % columns        && (targetPosition + 1 == hole) 
       )
    {
      tile.currentPosition = hole;
      hole = targetPosition;
      return true;
    }
    return false;
  }

  function reset(){
    for (var i = 0, l = tiles.length; i < l; i++){
      tiles[i].currentPosition = tiles[i].initialPosition;
    }
    tiles.setCurrentAll();
    hole = frameSize;
    timer.stop();
    isStart = false;
  }

  function winHandler(){
    timer.stop();
    isStart = false;
    container.classList.add('win');
  }

  function tileClickHandler(event){
    if (!isStart) return;
    event.preventDefault();
    event.stopPropagation();
    var target = event.target;
        
    if (!target.classList.contains('puzzle15-tile')) return; 

    var tile = tiles.getTile(target.dataset.currentPosition);
    
    if (tryExchange(tile)){
      tile.setCurrent();
      counter.increase();
      if (tiles.checkEqualAll()) winHandler();
    }
  }   

  function startGame(){
    container.classList.remove('win');
    counter.redraw();
    shuffle();
    timer.stop();
    timer.start();
    isStart = true;
  }
  
  function destroy(){
    if ('stop' in timer) timer.stop();
    if (style) style.remove();
    if ('innerHTML' in container) container.innerHTML = "";
  }
  
  this.destroy = destroy;
  
  // Initialization //
  container = document.querySelector('.puzzle15-container');
  if (!container) {alert('15 Puzzle Game: There\'s no <div class="puzzle15-container"></div> in the document'); return;}
  container.classList.remove('win');
  
  if (!(width && height && columns && rows)) {alert('15 Puzzle Game: Incorrect input data'); return;}

  setInitialStyles();
  createTiles();
  createControlPanel();
  document.head.appendChild(style);

  container.onmousedown = tileClickHandler;
  button.onmousedown = startGame;
  button.onwheel = reset;

}