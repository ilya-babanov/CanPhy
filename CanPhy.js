
var canvas = document.getElementById('testCanvas'),
    ctx = canvas.getContext('2d');


var timeStep = 0.0166,// ~ 60 fps
    powTimeStep = timeStep*timeStep,
    canvasWidth = 1800,
    canvasHeight = 900,
    mouseImpactDistance = 15,
    physicsAccuracy = 3;

var clothWidth = 100,
    clothHeight = 40,
    spacing = 15,
    initX = 150,
    initY = 50;

canvas.width = canvasWidth;
canvas.height = canvasHeight;
ctx.strokeStyle = 'rgba(222,222,222,0.6)';

window.requestAnimFrame =
    window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };

var mouse = {
    down: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0
};

document.addEventListener('mousedown',onMouseDown);
document.addEventListener('mousemove',onMouseMove);
document.addEventListener('mouseup',onMouseUp);

function onMouseDown(event) {
    mouse.down = true;
    mouse.x = mouse.prevX = event.clientX;
    mouse.y = mouse.prevY = event.clientY;
}
function onMouseMove() {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
}
function onMouseUp() {
    mouse.down = false;
}

function Particle(x,y){
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.ax = 0;
    this.ay = 400;
    this.free = true;
    this.constraints = [];
}
Particle.prototype = {
    constructor: Particle,
    satisfyBounds: function(){
        this.x = Math.min(Math.max(this.x,0),canvasWidth);
        this.y = Math.min(Math.max(this.y,0),canvasHeight);
    }
};

function Constraint(particle1, particle2, restLength){
    this.particle1 = particle1;
    this.particle2 = particle2;
    this.restLength = restLength;
    //this.powRestLength = restLength*restLength;
    this.particle1.constraints.push(this);
    this.particle2.constraints.push(this);
}
Constraint.prototype = {
    constructor: Constraint,
    draw: function(){
        ctx.moveTo(this.particle1.x,this.particle1.y);
        ctx.lineTo(this.particle2.x,this.particle2.y);
    }
};

function ParticleSystem(particles,constraints){
    this.particles = particles;
    this.constraints = constraints;
}
ParticleSystem.prototype = {
    verletIntegration: function(){
        var numParticles = this.particles.length;
        while (numParticles--) {
            var particle = this.particles[numParticles];
            if (particle.free) {
                var tempX = particle.x,
                    tempY = particle.y;
                if (mouse.down) {
                    var deltaX = particle.x - mouse.x,
                        deltaY = particle.y - mouse.y,
                        deltaLength = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
                    if (deltaLength < mouseImpactDistance) {
                        particle.x += mouse.x - mouse.prevX;
                        particle.y += mouse.y - mouse.prevY;
                    }
                }
                particle.x += (particle.x - particle.prevX)*0.99+ particle.ax*powTimeStep;
                particle.y += (particle.y - particle.prevY)*0.99 + particle.ay*powTimeStep;
                particle.prevX = tempX;
                particle.prevY = tempY;

                //bounds
                particle.satisfyBounds();
            }
        }
    },
    satisfyConstraints: function(){
        var length = this.constraints.length;
        while (length--) {
            var constraint = this.constraints[length],
                particle1 = constraint.particle1,
                particle2 = constraint.particle2;

            if (!(particle1.free || particle2.free)) continue;

            var deltaX = particle2.x - particle1.x,
                deltaY = particle2.y - particle1.y,
                deltaLength = Math.sqrt(deltaX*deltaX + deltaY*deltaY),
                diff = (constraint.restLength - deltaLength)/deltaLength * .5,
                offsetX = deltaX*diff,
                offsetY = deltaY*diff;

            if (particle1.free) {
                particle1.x -= offsetX;
                particle1.y -= offsetY;
            }
            if (particle2.free) {
                particle2.x += offsetX;
                particle2.y += offsetY;
            }
        }
    },
    accumulateForces: function(){},
    draw: function(){
        var length = this.constraints.length;
        ctx.beginPath();
        while (length--) {
            var constraint = this.constraints[length];
            constraint.draw();
        }
        ctx.stroke();
    },
    update:function(){
        //this.accumulateForces();
        this.verletIntegration();
        this.satisfyConstraints();
    }
};


var particles = [],
    constraints = [],
    particlesArray = [];
for (var y = 0; y < clothHeight; y++) {
    particles[y] = [];
    for (var x = 0; x < clothWidth; x++) {
        particles[y][x] = new Particle(initX + x*spacing, initY + y*spacing);
        if (y==0 && x%7==0) particles[y][x].free = false;
        particlesArray.push(particles[y][x]);
    }
}
for (y = 0; y < clothHeight; y++) {
    for (x = 0; x < clothWidth; x++) {
        (x != clothWidth - 1) && constraints.push(new Constraint(particles[y][x],particles[y][x+1], spacing));
        (y != 0) && constraints.push(new Constraint(particles[y][x],particles[y-1][x], spacing));
    }
}


var testCloth = new ParticleSystem(particlesArray,constraints);

update();

function update(){
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    var steps = physicsAccuracy;
    while (steps--) {
        testCloth.update();
    }
    testCloth.draw();
    requestAnimFrame(update);
}