(function(){
  "use strict";

  function initialize(width, height, columns, rows){
    var container = document.querySelector('.puzzle15-container');
    if (!container) {
      alert('15 Puzzle Game: There\'s no <div class="puzzle15-container"></div> in the document');
      return;
    }

    var width       = +width || 400,
        height      = +height || 400,
        columns     = +columns || 4,
        rows        = +rows || 4,
        tileWidth   = Math.floor(width / columns),
        tileHeight  = Math.floor(height / rows);

        width = tileWidth * columns;
        height = tileHeight * rows;

    var options = {
      varStyleProperies: {
        width:      width,
        height:     height,
        columns:    columns,
        rows:       rows,
        tileWidth:  tileWidth,
        tileHeight: tileHeight,
      },
      parent: container,
      viewBuilder: new ViewBuilder(),
      eventManager: new EventManager()
    }

    setInitialStyles(options);
    container.classList.remove('win');
        
    var tileSet = new TileSet(options);
    var timer = new Timer(options);
    var counter = new Counter(options);
    var button = new Button(options);

    options.eventManager.on('gamestart', function (){container.classList.remove('win');} );
    options.eventManager.on('gamewin', function (){container.classList.add('win');} );

    function destroy(){
      if ('stop' in timer) timer.stop();
      if ('element' in options.viewBuilder) options.viewBuilder.element.remove();
      if ('innerHTML' in container) container.innerHTML = "";
    }
    puzzle15.destroy = destroy;
  };

  function ViewBuilder(){
    this.styleStringBuffer = "";
    this.style = document.createElement('style');
    document.head.appendChild(this.style);
  }

  ViewBuilder.prototype.buildView = function(viewModel){
    var element;
    if (viewModel.type) element = document.createElement(viewModel.type);
    if (viewModel.classes.length) {
      for (var i = 0, l = viewModel.classes.length; i < l; i++){
        element.classList.add(viewModel.classes[i]);
      }
    }
    if (viewModel.properties) {
      for (var key in viewModel.properties){
        element[key] = viewModel.properties[key];
      }
    }
    if (viewModel.parent) viewModel.parent.appendChild(element);
    if (viewModel.style.length) this.addToStyle(viewModel.style);

    return element;
  }

  ViewBuilder.prototype.formatCSSRuleSet = function(data, selectorIndent, declarationsIndent){
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
  
  ViewBuilder.prototype.addToStyle = function(cssRuleSet){
    if (typeof(cssRuleSet) == 'string') {this.style.innerHTML += cssRuleSet}
    else {this.style.innerHTML += this.formatCSSRuleSet(cssRuleSet, 0, 2)}
  }

  ViewBuilder.prototype.addToStyleBuffer = function(cssRuleSet){
    if (typeof(cssRuleSet) == 'string') {this.styleStringBuffer += cssRuleSet}
    else {this.styleStringBuffer += this.formatCSSRuleSet(cssRuleSet, 0, 2)}
  }

  ViewBuilder.prototype.addBufferToStyle = function(){
    this.addToStyle(this.styleStringBuffer);
  }

  function EventManager(){
    this.events = {};
  }

  EventManager.prototype.on = function(eventName, callback){
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push (callback);
  }

  EventManager.prototype.trigger = function(eventName){
    if (this.events[eventName]){
      for (var i = 0, l = this.events[eventName].length; i < l; i++){
        this.events[eventName][i]();
      }
    }
  }

  function TileSet (options) {
    var self            = this,
        initialPosition = 0, 
        vSP             = options.varStyleProperies,
        cssRuleSet;

    this.tiles        = [];
    this.hole         = {};
    this.columns      = vSP.columns || 4;
    this.rows         = vSP.rows || 4;
    this.eventManager = options.eventManager;
    this.isStart      = false;

    for (var i = 0; i < this.rows; i++){
      for (var j = 0; j < this.columns; j++){
        cssRuleSet = [ //Array where first element is CSS selector, the others are CSS properties.
          '[data-current-position="' + ++initialPosition + '"]', 
          'transform: translate(' + (j * vSP.tileWidth + 5) + 'px, ' + (i * vSP.tileHeight + 5) + 'px);' //Properties
        ];
        options.viewBuilder.addToStyle(cssRuleSet);            

        if (i == this.rows - 1 && j == this.columns - 1) {
          this.hole.initialPosition = this.rows * this.columns;
          this.hole.currentPosition = this.hole.initialPosition;
          this.tiles.push(this.hole);
          continue;
        }
        this.tiles.push(new Tile(options, initialPosition));
      }
    }

    options.parent.onmousedown = function(event){ //Tile click handler
      if (!self.isStart) return;
      event.preventDefault();
      event.stopPropagation();
      var target = event.target;
          
      if (!target.classList.contains('puzzle15-tile')) return; 
  
      var tile = self.getTile(target.dataset.currentPosition);
      
      if (self.tryExchange(tile)){
        tile.setCurrent();
        self.eventManager.trigger('gamemove');
        if (self.checkEqualAll()) self.eventManager.trigger('gamewin');
      }
    };
    this.eventManager.on('gamestart', (function(){this.shuffle(); this.isStart = true;}).bind(this));
    this.eventManager.on('gamereset', (function(){this.reset(); this.isStart = false;}).bind(this));
    this.eventManager.on('gamewin',(function(){this.isStart = false;}).bind(this)); 
  }

  TileSet.prototype.setCurrentAll = function(){ // Set all tile's currentPossition properties to their own DOM elements. 
    for (var i = 0, l = this.tiles.length - 1; i < l; i++){ // (this.tiles.length - 1) because last element of tiles array is hole.
      this.tiles[i].setCurrent();
    }
  }
    
  TileSet.prototype.checkEqualAll = function(){ // Check that all tile's current possitions equals their initial positions.
    for (var i = 0, l = this.tiles.length - 1; i < l; i++){
      if(!this.tiles[i].checkEqual()) return false;
    }
    return true;
  }
    
  TileSet.prototype.getTile = function(position){
    for (var i = 0, l = this.tiles.length - 1; i < l; i++){
      if (this.tiles[i].currentPosition == position) return this.tiles[i];
    }
  }

  TileSet.prototype.shuffle = function(){
    var directions = [-this.columns, -1, 1, this.columns],
        randomDirection,
        targetPosition,
        i = 0;

    while (i < 100){
      randomDirection = directions[Math.floor(Math.random() * 4)];
      targetPosition = this.hole.currentPosition + randomDirection;
      if (targetPosition > 0 && targetPosition <= this.hole.initialPosition){ 
        if (this.tryExchange(this.getTile(targetPosition))) i++;
      }
    }
    this.setCurrentAll();
  }

  TileSet.prototype.tryExchange = function(tile){
    var targetPosition = +tile.currentPosition;
    if (targetPosition - this.columns == this.hole.currentPosition || 
        targetPosition + this.columns == this.hole.currentPosition ||
        (targetPosition - 1) % this.columns  && (targetPosition - 1 == this.hole.currentPosition) ||
        targetPosition % this.columns        && (targetPosition + 1 == this.hole.currentPosition) 
      )
    {
      tile.currentPosition = this.hole.currentPosition;
      this.hole.currentPosition = targetPosition;
      return true;
    }
    return false;
  }

  TileSet.prototype.reset = function(){
    for (var i = 0, l = this.tiles.length; i < l; i++){
      this.tiles[i].currentPosition = this.tiles[i].initialPosition;
    }
    this.setCurrentAll();
  }

  function Tile(options, initialPosition){
    this.element = {};    
    this.initialPosition = initialPosition;
    this.currentPosition = initialPosition;

    this.viewModel = {
      parent: options.parent,
      type: 'div',
      classes: [
        'puzzle15-tile'
      ],
      properties: {
        innerHTML:  this.initialPosition
      },
      style:  []
    }

    this.element = options.viewBuilder.buildView(this.viewModel);

    this.setCurrent();
  }
  
  Tile.prototype.setCurrent = function(){
    this.element.dataset.currentPosition = this.currentPosition;
  }

  Tile.prototype.checkEqual = function(){
    if (this.initialPosition == this.currentPosition) return true;
    return false;
  }
  
  function Timer(options){
    var vSP = options.varStyleProperies;
    this.element      = {};
    this.timerId      = 0;
    this.eventManager = options.eventManager;

    this.viewModel = {
      parent: options.parent,
      type: 'span',
      classes: [
        'puzzle15-control-panel',
        'timer'
      ],
      properties: {},
      style:  [
        '.puzzle15-control-panel.timer',
        'font-size: ' + (vSP.width > 150 ? 24 : vSP.width * 0.14)  + 'px;'
      ]
    }
    this.element = options.viewBuilder.buildView(this.viewModel);
    this.redraw();

    this.eventManager.on('gamestart', (function(){
      this.stop();
      this.start();
    }).bind(this));

    this.eventManager.on('gamereset', this.stop.bind(this));
    this.eventManager.on('gamewin', this.stop.bind(this));
    
  }
    
  Timer.prototype.redraw = function(min,sec){
    min = min || 0;
    sec = sec || 0;
    this.element.innerHTML = ~~(min/10) +''+ min % 10 + ':' + ~~(sec/10) +''+ sec % 10;
  }
    
  Timer.prototype.start = function(delay){ 
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
  
  Timer.prototype.stop = function(){
    if (!this.timerId) return;
    clearInterval(this.timerId);
    this.timerId = 0;
  }

  
  function Counter(options){
    var vSP = options.varStyleProperies;
    this.element = {};
    this.eventManager = options.eventManager;

    this.viewModel = {
      parent: options.parent,
      type: 'span',
      classes: [
        'puzzle15-control-panel',
        'counter'
      ],
      properties: {},
      style:  [
        '.puzzle15-control-panel.counter',
        'font-size: ' + (vSP.width > 150 ? 24 : vSP.width * 0.14)  + 'px;'
      ]
    }

    this.element = options.viewBuilder.buildView(this.viewModel);
    this.redraw();

    this.eventManager.on('gamestart', this.redraw.bind(this));
    this.eventManager.on('gamemove', this.increase.bind(this));

  }
    
  Counter.prototype.redraw = function(amount){
    amount = amount || 0;
    this.element.innerHTML = Array(5 - String(amount).length).join('0') + (+amount);
  }
    
  Counter.prototype.increase = function(){
    this.redraw(+this.element.innerHTML + 1);
  }

  function Button(options){
    this.element = {};
    this.eventManager = options.eventManager;

    this.viewModel = {
      parent: options.parent,
      type: 'span',
      classes: [
        'puzzle15-control-panel',
        'button'
      ],
      properties: {
        innerHTML: '&#9655'
      },
      style:  []
    }

    this.element = options.viewBuilder.buildView(this.viewModel);
  
    this.element.onmousedown = this.eventManager.trigger.bind(this.eventManager, 'gamestart');
    this.element.onwheel = this.eventManager.trigger.bind(this.eventManager, 'gamereset');
  }

  function setInitialStyles(options){
    var vSP = options.varStyleProperies, 
        cssRuleSet;

    cssRuleSet = [
      '.puzzle15-container', //Selector
      'height: ' + (vSP.height + 40) + 'px;', //Declarations...
      'width: ' + vSP.width + 'px;'
    ];
    options.viewBuilder.addToStyleBuffer(cssRuleSet);

    cssRuleSet = [
      '.puzzle15-control-panel',
      'top: ' + (vSP.height + 21) + 'px;'
    ];
    options.viewBuilder.addToStyleBuffer(cssRuleSet);

    cssRuleSet = [
      '.puzzle15-tile',
      'width: ' + (vSP.tileWidth - 10) + 'px;',
      'height: ' + (vSP.tileHeight - 10) + 'px;',
      'line-height:' + (vSP.tileHeight - 10) + 'px;',
      'font-size: '+ (vSP.tileWidth <= vSP.tileHeight ?
                   ~~(vSP.tileWidth*0.5) :
                   ~~(vSP.tileHeight*0.5)) +'px;'
    ];
    options.viewBuilder.addToStyleBuffer(cssRuleSet);
    
    cssRuleSet = [
      '.puzzle15-tile:before',
      'width: ' + vSP.tileWidth * 1.5 + 'px;',
      'height: ' + vSP.tileHeight * 0.9  + 'px;',
      'left: ' + (-vSP.tileWidth * 0.25) + 'px;',
      'top: ' + (-vSP.tileHeight * 0.5) + 'px;'
    ];
    options.viewBuilder.addToStyleBuffer(cssRuleSet);
    options.viewBuilder.addBufferToStyle();

  }

  var puzzle15 = {};
  puzzle15.create = initialize;
  window.puzzle15 = puzzle15;

})();