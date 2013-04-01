
var canvas = document.getElementById('testCanvas'),
    ctx = canvas.getContext('2d');


var timeStep = 0.0166,// ~ 60 fps
    powTimeStep = timeStep*timeStep,
    canvasWidth = 2000,
    canvasHeight = 1000,
    mouseImpactDistance = 15;

var clothWidth = 120,
    clothHeight = 40,
    spacing = 15,
    initX = 50,
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
    this.ay = 800;
    this.free = true;
    this.constraints = [];
}


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
        for (var i=0; i<numParticles; i++) {
            var particle = this.particles[i];
            if (particle.free) {
                var tempX = particle.x,
                    tempY = particle.y;
                if (mouse.down) {
                    var deltaX = particle.x - mouse.x,
                        deltaY = particle.y - mouse.y,
                        deltaLength = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
                    if (deltaLength < mouseImpactDistance) {
                        particle.x += (mouse.x - mouse.prevX)*1.4;
                        particle.y += (mouse.y - mouse.prevY)*1.4;
                    }
                }
                particle.x += (particle.x - particle.prevX)*0.99+ particle.ax*powTimeStep;
                particle.y += (particle.y - particle.prevY)*0.99 + particle.ay*powTimeStep;
                particle.prevX = tempX;
                particle.prevY = tempY;

                //bounds
                particle.x = Math.min(Math.max(particle.x,0),canvasWidth);
                particle.y = Math.min(Math.max(particle.y,0),canvasHeight);
            }
        }
    },
    satisfyConstraints: function(){
        /*var length = this.particles.length;
        for (var i=0; i<length; i++) {
            var particle = this.particles[i];
            particle.x = Math.min(Math.max(particle.x,0),canvasWidth);
            particle.y = Math.min(Math.max(particle.y,0),canvasHeight);
        }*/
        var length = this.constraints.length;
        for (var i=0; i<length; i++) {
            var constraint = this.constraints[i],
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
    update:function(){
        //this.accumulateForces();
        this.verletIntegration();
        this.satisfyConstraints();
    },
    draw: function(){
        var length = this.constraints.length;
        ctx.beginPath();
        for (var i = 0; i<length; i++) {
            var constraint = this.constraints[i];
            ctx.moveTo(constraint.particle1.x,constraint.particle1.y);
            ctx.lineTo(constraint.particle2.x,constraint.particle2.y);
        }
        ctx.stroke();
    }
};
/*
 var testParticle1 = new Particle(300,300);
 var testParticle2 = new Particle(330,330);
 var testParticle3 = new Particle(300,360);
 var testParticle4 = new Particle(270,330);
 var testConstraint1 = new Constraint(testParticle1,testParticle2,42);
 var testConstraint2 = new Constraint(testParticle2,testParticle3,42);
 var testConstraint3 = new Constraint(testParticle3,testParticle4,42);
 var testConstraint4 = new Constraint(testParticle4,testParticle1,42);
 //var testConstraint5 = new Constraint(testParticle1,testParticle3,70);

 var testBody = new ParticleSystem([testParticle1,testParticle2,testParticle3,testParticle4],
 [testConstraint1,testConstraint2,testConstraint3, testConstraint4]);*/



var particles = [],
    constraints = [];
for (var y = 0; y < clothHeight; y++) {
    particles[y] = [];
    for (var x = 0; x < clothWidth; x++) {
        particles[y][x] = new Particle(initX + x*spacing, initY + y*spacing);
        if (y==0) particles[y][x].free = false;
    }
}
for (y = 0; y < clothHeight; y++) {
    for (x = 0; x < clothWidth; x++) {
        (x != clothWidth - 1) && constraints.push(new Constraint(particles[y][x],particles[y][x+1], spacing));
        (y != 0) && constraints.push(new Constraint(particles[y][x],particles[y-1][x], spacing));
        //(x != 0) && constraints.push(new Constraint(particles[y][x],particles[y][x-1], spacing));
        //(y != clothHeight - 1) && constraints.push(new Constraint(particles[y][x],particles[y+1][x], spacing));
    }
}
var particlesArray = [];
for (y = 0; y < clothHeight; y++) {
    for (x = 0; x < clothWidth; x++) {
        particlesArray.push(particles[y][x]);
    }
}

var testCloth = new ParticleSystem(particlesArray,constraints);

update();

function update(){
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    testCloth.update();
    testCloth.draw();
    requestAnimFrame(update);
}