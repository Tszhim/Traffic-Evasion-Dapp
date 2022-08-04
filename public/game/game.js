// Import socket instance to continuously update opponent score, and let the server know when the game is finished.
import {socket} from '../client.js';

// Import canvas functions.
import {getCnvWidth, getCnvHeight, writeMsg, replaceMsg, drawRoads, drawPlayerScore, drawOpponentScore, drawTimer, drawChicken, drawCar, addPlayAgainHandler} from './canvas.js';

// Define variables for game.
let time;
let key_pressed = {};

let score = 0;
let opponent_score = 0;
let timer = 90;
let chickenX = 770;
let chickenY = 750;
let lanes = [[], [], [], [], [], []];
let carHeights = [70, 170, 280, 380, 480, 590]

// Listen for start of key presses.
window.addEventListener('keydown', function(e) {
    if(e.key == "ArrowUp"){
        key_pressed["ArrowUp"] = true;
    }
    if(e.key == "ArrowDown"){
        key_pressed["ArrowDown"] = true;
    }
    if(e.key == "ArrowLeft"){
        key_pressed["ArrowLeft"] = true;
    }
    if(e.key == "ArrowRight"){
        key_pressed["ArrowRight"] = true;
    }
});

// Listen for end of key presses.
window.addEventListener('keyup', function(e) {
    if(e.key == "ArrowUp"){
        key_pressed["ArrowUp"] = false;
    }
    if(e.key == "ArrowDown"){
        key_pressed["ArrowDown"] = false;
    }
    if(e.key == "ArrowLeft"){
        key_pressed["ArrowLeft"] = false;
    }
    if(e.key == "ArrowRight"){
        key_pressed["ArrowRight"] = false;
    }
});

// Begin game on loadup.
function startGame() { 
    time = setInterval(() => {
        if(timer >= 0) {
            timer--;
        }
        else {
            socket.emit("gameover", score);
            clearInterval(time);
        }
    }, 1000)
    window.requestAnimationFrame(gameLoop);
}

// Primary loop that continuously updates game state and renders the information onto the screen.
function gameLoop() {
    if(timer > 0) {
        update();
        render();
        window.requestAnimationFrame(gameLoop);
    }
}

// Change game information dynamically.
function update() {
    // Update chicken position.
    if(key_pressed["ArrowUp"] && chickenY > 0) {
        chickenY = chickenY - 2;
    }
    if(key_pressed["ArrowDown"] && chickenY < getCnvHeight() - 100) {
        chickenY = chickenY + 2;
    }
    if(key_pressed["ArrowLeft"] && chickenX > 0) {
        chickenX = chickenX - 2;
    }
    if(key_pressed["ArrowRight"] && chickenX < getCnvWidth() - 100) {
        chickenX = chickenX + 2;
    }

    // Update score.
    if(chickenY < 50) {
        score++;
        socket.emit("scored");
        chickenX = 770;
        chickenY = 750;
    }

    // Check collision. 
    for(let i = 0; i < lanes.length; i++) {
        for(let j = 0; j < lanes[i].length; j++) {
            let lx = lanes[i][j]["x"];
            let ly = lanes[i][j]["y"];
            
            if (lx + 20 < chickenX && chickenX < lx + 250 && ly < chickenY && chickenY < ly + 130) {
                chickenX = 770;
                chickenY = 750;
            }
        }
    }

    // Update car position.
    for(let i = 0; i < lanes.length; i++) {
        for(let j = 0; j < lanes[i].length; j++) {
            let dirRight = (i % 2 == 0);
            lanes[i][j]["x"] = dirRight ? lanes[i][j]["x"] + 5 : lanes[i][j]["x"] - 5;
            // If car is going right and it reaches the right end, delete it from the list.
            if(dirRight && lanes[i][j]["x"] > 1660) {
                lanes[i].pop();
            }
            // If car is going left and it reaches the left end, delete it from the list.
            if(!dirRight && lanes[i][j]["x"] < -250) {
                lanes[i].pop();
            }
        }
    } 

    // Generate more cars.
    for(let i = 0; i < lanes.length; i++) {
        // If the lane has less than 6 cars.
        let dirRight = (i % 2 == 0);
        if(lanes[i].length < 6) {
            // If the most recently added car has enough space between it and the end of the lane to allow for a new car. 
            if(lanes[i].length == 0 || (dirRight && lanes[i][0]["x"] > 320) || (!dirRight && lanes[i][0]["x"] < 1370)) {
                // Generate chance to spawn car. 
                let rand1 = Math.floor(Math.random() * 150);

                if(rand1 == 0) { 
                    if(dirRight) {
                        lanes[i].unshift({"x": -280, "y": carHeights[i], "car": Math.floor(Math.random() * 4) * 2});
                    }
                    else {  
                        lanes[i].unshift({"x": 1690, "y": carHeights[i], "car": Math.floor(Math.random() * 4) * 2 + 1});
                    }
                }
            }   
        }
    }
}

// Draw necessary game components onto canvas.
function render() {
    drawRoads();
    drawPlayerScore(score);
    drawOpponentScore(opponent_score);
    drawTimer(timer);
    drawChicken(chickenX, chickenY);

    for(let i = 0; i < lanes.length; i++) {
        for(let j = 0; j < lanes[i].length; j++) {
            drawCar(lanes[i][j]["car"], lanes[i][j]["x"], lanes[i][j]["y"]);
        }
    }
}

// Increment opponent score counter.
function addOpponentScore() {
    opponent_score++;
}

// Draw game end screen.
function handleGameEnd(message, x, y) {
    timer = -1;
    replaceMsg(message, x, y, 50);
    writeMsg("Click anywhere to play again.", 660, 540, 25);
    addPlayAgainHandler();
}


export {startGame, addOpponentScore, handleGameEnd};
