// Import socket instance to let server know when canvas is finished initializing.
import {socket} from '../client.js';

// Import images to draw.
import {chicken_img, car_imgs} from './images.js';

// Define canvas variables.
let cnv, ctx;

// Initialize objects to write on canvas, then display title screen.
function initCanvas() {
    cnv = document.getElementsByClassName('game_screen')[0];
    ctx = cnv.getContext('2d');
    let scale = window.devicePixelRatio;
    cnv.width = cnv.getBoundingClientRect().width * scale;
    cnv.height = cnv.getBoundingClientRect().height * scale;

    writeMsg("Traffic Evasion", 670, 300, 50);
    writeMsg("Click anywhere to begin!", 665, 500, 30);

    cnv.addEventListener('click', function click(e) {
        removeEventListener('click', click);
        socket.emit("attempt_web3");
    });
}

// Return canvas width.
function getCnvWidth() {
    return cnv.width;
}

// Return canvas height.
function getCnvHeight() {
    return cnv.height;
}

// Write message on canvas.
function writeMsg(msg, x, y, size) {
    ctx.font = size + "px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(msg, x, y);
}

// Replace message on canvas.
function replaceMsg(msg, x, y, size) {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.font = size + "px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(msg, x, y);
}

// Draw start/finish lines + roads on canvas.
function drawRoads() {
    // Clear canvas and prepare to draw.
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.beginPath();
    ctx.strokeStyle = 'white';

    // Start and finish line.
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.moveTo(0, cnv.height / 8);
    ctx.lineTo(cnv.width, cnv.height / 8);
    ctx.stroke();

    ctx.moveTo(0, 7 * cnv.height / 8)
    ctx.lineTo(cnv.width,  7 * cnv.height / 8);
    ctx.stroke();

    // Roads.
    ctx.lineWidth = 2;
    ctx.setLineDash([25, 3]);
    for(let i = 2; i < 7; i++) {
        ctx.moveTo(0, i * cnv.height / 8);
        ctx.lineTo(cnv.width, i * cnv.height / 8);
        ctx.stroke();
    }
}

// Draw player score counter.
function drawPlayerScore(score) {
    writeMsg("Score: " + score, 50, 50, 25);
}

// Draw opponent score counter.
function drawOpponentScore(opponent_score) {
    writeMsg("Opponent Score: " + opponent_score, 1450, 50, 25);
}

// Draw timer.
function drawTimer(timer) {
    writeMsg(timer, 807, 50, 25);
}

// Draw chicken.
function drawChicken(chickenX, chickenY) {
    ctx.drawImage(chicken_img, chickenX, chickenY);
}

// Draw car.
function drawCar(carType, carX, carY) {
    ctx.drawImage(car_imgs[carType], carX, carY);
}

// Installs event handler that will refresh page so player can play again.
function addPlayAgainHandler() {
    cnv.addEventListener('click', function(e) {
        window.location.href = 'http://localhost:3000';
    });
}

export {initCanvas, getCnvWidth, getCnvHeight, writeMsg, replaceMsg, drawRoads, drawPlayerScore, drawOpponentScore, drawTimer, drawChicken, drawCar, addPlayAgainHandler};