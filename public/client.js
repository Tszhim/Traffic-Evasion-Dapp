import getWeb3 from '/web3/web3.js';
import {contractABI, contractAddress} from '/web3/contract_info.js';

// Define variables for web3 integration.
let web3, wallet_id, contract;

// Define variables for game.
let time;
let cnv, ctx;
let key_pressed = {};

let score = 0;
let opponent_score = 0;
let timer = 90;
let chickenX = 770;
let chickenY = 750;
let lanes = [[], [], [], [], [], []];
let carHeights = [70, 170, 280, 380, 480, 590]

// Defining images to display on canvas.
var chicken_img = new Image();
chicken_img.src = "images/chicken_texture.png";

var blue_car_img = new Image();
blue_car_img.src = "images/blue_car.png";

var blue_car_img_rev = new Image();
blue_car_img_rev.src = "images/blue_car_rev.png";

var red_car_img = new Image();
red_car_img.src = "images/red_car.png";

var red_car_img_rev = new Image();
red_car_img_rev.src = "images/red_car_rev.png";

var yellow_car_img = new Image();
yellow_car_img.src = "images/yellow_car.png";

var yellow_car_img_rev = new Image();
yellow_car_img_rev.src = "images/yellow_car_rev.png";

var white_van_img = new Image();
white_van_img.src = "images/white_van.png";

var white_van_rev_img = new Image();
white_van_rev_img.src = "images/white_van_rev.png";

let car_imgs = [blue_car_img, blue_car_img_rev, red_car_img, red_car_img_rev, yellow_car_img, yellow_car_img_rev, white_van_img, white_van_rev_img];

// Defining client socket and relevant events.
const socket = io();

// Initialize canvas variables and display title screen.
socket.on("init", () => {
    initCanvas();
});

// Attempt to connect to Metamask Wallet through web3 amd create smart contract instance.
socket.on("connect_web3", async() => {   
    displayMessage("Establishing web3 connection...", 450, 450, 50);
    try {
        web3 = await getWeb3();
        let accounts = await web3.eth.getAccounts();
        wallet_id = accounts[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        displayMessage("Connected to wallet! Attempting to find match.", 300, 450, 50);
        socket.emit("connected_web3");
    }
    catch(err) {
        console.log(err);
        displayMessage("Unable to connect to Metamask Wallet!", 390, 450, 50);
    }
});

// Upon both players being matched, a match will be created within the smart contract by p2.
socket.on("create_match", async(opponent_id) => {
    displayMessage("Creating match...", 640, 450, 50);
    let res = await contract.methods.createMatch(socket.id)
                    .send({
                        from: wallet_id,
                        value: 10000000000000000,
                        gasPrice: 50000000000
                    });
    console.log(res);

    displayMessage("Waiting for opponent to connect...", 450, 450, 50);
    socket.emit("match_created", opponent_id);
});

// Once the match is created, p1 will join p2's match.
socket.on("join_match", async(opponent_id) => {   
    displayMessage("Joining match...", 640, 450, 50);
    let res = await contract.methods.joinMatch(opponent_id, socket.id)
                    .send({
                        from: wallet_id,
                        value: 10000000000000000,
                        gasPrice: 50000000000
                    });
    console.log(res);

    displayCenterMessage("Initializing match...", 630, 450, 50);
    socket.emit("match_start", opponent_id);
})

// When p2 joins the match, the game begins.
socket.on("start", () => {
    startGame();
});

// Counter to show each player the opponent's score.
socket.on("opponent_scored", () => {
    opponent_score++;
});

// Victor of the match will receive this event to be awarded winnings.
socket.on('victory', async(message) => {
    timer = 0;
    handleGameEnd(message);

    let res = await contract.methods.victory(socket.id) 
                    .send({
                        from: wallet_id,
                        gasPrice: 50000000000
                    });

    console.log(res);
});

// Loser of the match will not receive any winnings.
socket.on('defeat', async(message) =>  {
    timer = 0;
    handleGameEnd(message);
});

// If the match is a tie, both players will receive their initial bet back.
socket.on('tie', async(message) =>  {
    timer = 0;
    handleGameEnd(message);

    let res = await contract.methods.tie(socket.id) 
                    .send({
                        from: wallet_id,
                        gasPrice: 50000000000
                    });

    console.log(res);
});

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

// Initialize canvas.
function initCanvas() {
    cnv = document.getElementsByClassName('game_screen')[0];
    ctx = cnv.getContext('2d');
    let scale = window.devicePixelRatio;
    cnv.width = cnv.getBoundingClientRect().width * scale;
    cnv.height = cnv.getBoundingClientRect().height * scale;

    ctx.font = "50px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Traffic Evasion", 670, 300); 

    ctx.font = "30px Verdana";
    ctx.fillText("Click anywhere to begin!", 665, 500); 

    cnv.addEventListener('click', function click(e) {
        socket.emit("attempt_web3");
        removeEventListener('click', click);
    });
}

// Display message on canvas.
function displayMessage(msg, x, y, size) {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.font = size + "px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(msg, x, y);
}
// Display message on canvas.
function displayCenterMessage(msg) {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.font = "50px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(msg, 380, 450);
}

// Begin game on loadup.
function startGame() { 
    time = setInterval(() => {
        if(timer > 0) {
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
    if(key_pressed["ArrowDown"] && chickenY < cnv.height - 100) {
        chickenY = chickenY + 2;
    }
    if(key_pressed["ArrowLeft"] && chickenX > 0) {
        chickenX = chickenX - 2;
    }
    if(key_pressed["ArrowRight"] && chickenX < cnv.width - 100) {
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

    // Score display.
    ctx.font = "25px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 50, 50);

    // Opponent score display.
    ctx.fillText("Opponent Score: " + opponent_score, 1450, 50);

    // Timer display.
    ctx.fillText(timer, 807, 50);

    // Chicken.
    ctx.drawImage(chicken_img, chickenX, chickenY);

    // Cars. 
    for(let i = 0; i < lanes.length; i++) {
        for(let j = 0; j < lanes[i].length; j++) {
            ctx.drawImage(car_imgs[lanes[i][j]["car"]], lanes[i][j]["x"], lanes[i][j]["y"])
        }
    }
}

// Draw game end screen.
function handleGameEnd(message) {
    // Clear canvas and set styles.
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.font = "50px Verdana";
    ctx.fillStyle = "white";

    // Center text based on length.
    if(message.length < 20) {
        ctx.fillText(message, 650, 450);
    }
    else {
        ctx.fillText(message, 450, 450);
    }

    // Add click event handler that starts a new game.
    ctx.font = "25px Verdana";
    ctx.fillText("Click anywhere to play again.", 650, 540);

    cnv.addEventListener('click', function(e) {
        window.location.href = 'http://localhost:3000';
    });
}