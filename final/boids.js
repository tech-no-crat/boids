(function() {
  var Boid, Boids, Boids2DRenderer, Vector2;

  $(document).ready(function() {
    window.boids = new Boids(new Boids2DRenderer($("canvas")[0]));
    return window.boids.start();
  });

  Vector2 = (function() {
    var dimensions;

    dimensions = 2;

    function Vector2(a, b) {
      if (a === void 0) a = 0;
      if (b === void 0) b = 0;
      this.d = [0, 0];
      this.d[0] = a;
      this.d[1] = b;
    }

    Vector2.prototype.add = function(otherVector) {
      var i;
      for (i = 0; 0 <= dimensions ? i < dimensions : i > dimensions; 0 <= dimensions ? i++ : i--) {
        this.d[i] += otherVector.d[i];
      }
      return this;
    };

    Vector2.prototype.substract = function(otherVector) {
      var i;
      for (i = 0; 0 <= dimensions ? i < dimensions : i > dimensions; 0 <= dimensions ? i++ : i--) {
        this.d[i] -= otherVector.d[i];
      }
      return this;
    };

    Vector2.prototype.scalarDivide = function(scalar) {
      var i;
      for (i = 0; 0 <= dimensions ? i < dimensions : i > dimensions; 0 <= dimensions ? i++ : i--) {
        this.d[i] = this.d[i] / scalar;
      }
      return this;
    };

    Vector2.prototype.scalarMultiply = function(scalar) {
      var i;
      for (i = 0; 0 <= dimensions ? i < dimensions : i > dimensions; 0 <= dimensions ? i++ : i--) {
        this.d[i] = this.d[i] * scalar;
      }
      return this;
    };

    Vector2.prototype.limit = function(l) {
      var i, max;
      max = 0;
      for (i = 0; 0 <= dimensions ? i < dimensions : i > dimensions; 0 <= dimensions ? i++ : i--) {
        max = Math.max(max, Math.abs(this.d[i]));
      }
      if (max > l) this.scalarMultiply(l / max);
      return this;
    };

    Vector2.prototype.addX = function(value) {
      this.d[0] += value;
      return this;
    };

    Vector2.prototype.addY = function(value) {
      this.d[1] += value;
      return this;
    };

    Vector2.prototype.x = function() {
      return this.d[0];
    };

    Vector2.prototype.y = function() {
      return this.d[1];
    };

    Vector2.prototype.toString = function() {
      return "(" + this.d[0] + ", " + this.d[1] + ")";
    };

    Vector2.prototype.clone = function() {
      return new Vector2(this.x(), this.y());
    };

    return Vector2;

  })();

  Boid = (function() {

    function Boid(x, y) {
      if (x == null) x = 0;
      if (y == null) y = 0;
      this.position = new Vector2(x, y);
      this.velocity = new Vector2(0, 0);
    }

    return Boid;

  })();

  window.dist = function(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };

  Boids = (function() {
    var averagePosition, avoidCollisions, boids, center, direction, distance, initialize, intervalHandle, lastRun, loopInterval, perceivedCenter, perceivedFlockVelocity, positionSum, randomUpTo, renderer, run, status, stayInBounds, time, totalPosition, totalVelocity, tree, update, velocitySum;

    status = null;

    loopInterval = 20;

    intervalHandle = null;

    renderer = null;

    boids = [];

    lastRun = null;

    center = null;

    totalPosition = null;

    totalVelocity = null;

    tree = null;

    randomUpTo = function(limit) {
      return Math.floor(Math.random() * limit) + 1;
    };

    time = function() {
      return new Date().getTime();
    };

    velocitySum = function() {
      var b, sum, _i, _len;
      sum = new Vector2;
      for (_i = 0, _len = boids.length; _i < _len; _i++) {
        b = boids[_i];
        sum.add(b.velocity);
      }
      return sum;
    };

    positionSum = function() {
      var b, sum, _i, _len;
      sum = new Vector2;
      for (_i = 0, _len = boids.length; _i < _len; _i++) {
        b = boids[_i];
        sum.add(b.position);
      }
      return sum;
    };

    perceivedFlockVelocity = function(boid) {
      var sum;
      sum = totalVelocity.clone();
      sum.substract(boid.velocity);
      return sum.scalarDivide(boids.length - 1);
    };

    perceivedCenter = function(boid) {
      var sum;
      sum = totalPosition.clone();
      sum.substract(boid.position);
      return sum.scalarDivide(boids.length - 1);
    };

    averagePosition = function() {
      var b, sum, _i, _len;
      sum = new Vector2;
      for (_i = 0, _len = boids.length; _i < _len; _i++) {
        b = boids[_i];
        sum.add(b.position);
      }
      sum.scalarDivide(boids.length);
      return sum;
    };

    distance = function(a, b) {
      return Math.sqrt(Math.pow(a.x() - b.x(), 2) + Math.pow(a.y() - b.y(), 2));
    };

    avoidCollisions = function(boid) {
      var b, dist, p, points, vel, _i, _len;
      vel = new Vector2;
      points = tree.nearest({
        x: boid.position.x(),
        y: boid.position.y()
      }, 10);
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        p = points[_i];
        b = new Vector2(p[0].x, p[0].y);
        if (b.x() !== boid.position.x() && b.y() !== boid.position.y()) {
          dist = distance(b, boid.position);
          if (dist < 50) vel.substract(direction(boid.position, b));
        }
      }
      return vel;
    };

    stayInBounds = function(boid, lx, ly, hx, hy, p) {
      var vel;
      if (p == null) p = 2;
      vel = new Vector2;
      if (boid.position.x() < lx) vel.addX(Math.pow(lx - boid.position.x(), p));
      if (boid.position.y() < ly) vel.addY(Math.pow(ly - boid.position.y(), p));
      if (boid.position.x() > hx) vel.addX(-Math.pow(hx - boid.position.x(), p));
      if (boid.position.y() > hy) vel.addY(-Math.pow(hy - boid.position.y(), p));
      return vel;
    };

    direction = function(from, to) {
      var goal;
      goal = new Vector2(to.x(), to.y());
      return goal.substract(from);
    };

    initialize = function() {
      var _i, _results;
      lastRun = time();
      _results = [];
      for (_i = 1; _i <= 50; _i++) {
        _results.push(boids.push(new Boid(randomUpTo(renderer.width()), randomUpTo(renderer.height()))));
      }
      return _results;
    };

    update = function(delta) {
      var b, vel, _i, _j, _len, _len2, _results;
      center = averagePosition();
      totalPosition = positionSum();
      totalVelocity = velocitySum();
      tree = new kdTree(boids.map(function(b) {
        return {
          x: b.position.x(),
          y: b.position.y()
        };
      }), window.dist, ["x", "y"]);
      for (_i = 0, _len = boids.length; _i < _len; _i++) {
        b = boids[_i];
        vel = new Vector2;
        vel.add(direction(b.position, perceivedCenter(b)).scalarMultiply(1));
        vel.add(avoidCollisions(b).scalarMultiply(1));
        vel.add(perceivedFlockVelocity(b).scalarMultiply(10));
        vel.add(stayInBounds(b, 50, 50, renderer.width() - 50, renderer.height() - 50, 2).scalarMultiply(8));
        vel.limit(1);
        b.velocity.add(vel.scalarMultiply(0.05));
        b.velocity.limit(1);
      }
      _results = [];
      for (_j = 0, _len2 = boids.length; _j < _len2; _j++) {
        b = boids[_j];
        vel = b.velocity.clone();
        vel.scalarMultiply(delta / 5);
        _results.push(b.position.add(vel));
      }
      return _results;
    };

    run = function() {
      var delta;
      delta = time() - lastRun;
      lastRun = time();
      update(delta);
      return renderer.render(boids, center);
    };

    function Boids(render_class) {
      console.log("Initializing");
      renderer = render_class;
      status = "stopped";
    }

    Boids.prototype.start = function() {
      console.log("Starting from status " + status);
      intervalHandle = setInterval(run, loopInterval);
      if (status === "stopped") initialize();
      return status = "running";
    };

    Boids.prototype.pause = function() {
      console.log("Pausing");
      window.clearInterval(intervalHandle);
      return status = "paused";
    };

    Boids.prototype.stop = function() {
      return console.log("Stopping");
    };

    return Boids;

  })();

  Boids2DRenderer = (function() {
    var canvas, ctx;

    canvas = null;

    ctx = null;

    function Boids2DRenderer(el) {
      var radius;
      canvas = el;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx = canvas.getContext('2d');
      radius = 3;
      console.log("Running render at " + canvas.width + "x" + canvas.height);
    }

    Boids2DRenderer.prototype.render = function(boids, center) {
      var b, _i, _len;
      ctx.fillStyle = "black";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (_i = 0, _len = boids.length; _i < _len; _i++) {
        b = boids[_i];
        ctx.beginPath();
        ctx.arc(b.position.x(), b.position.y(), 3, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(b.position.x(), b.position.y());
        ctx.lineTo(b.position.x() - b.velocity.x() * 10, b.position.y() - b.velocity.y() * 10);
        ctx.stroke();
        ctx.closePath();
      }
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(center.x(), center.y(), 3, 0, Math.PI * 2, true);
      ctx.stroke();
      return ctx.fill();
    };

    Boids2DRenderer.prototype.width = function() {
      return canvas.width;
    };

    Boids2DRenderer.prototype.height = function() {
      return canvas.height;
    };

    return Boids2DRenderer;

  })();

}).call(this);
