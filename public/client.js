// Import web3 setup function and contract information.
import getWeb3 from '/web3/web3.js';
import {contractABI, contractAddress} from '/web3/contract_info.js';

// Import canvas function to display messages, and game functions to react to player state.
import {initCanvas, replaceMsg} from '/game/canvas.js';
import {startGame, addOpponentScore, handleGameEnd} from '/game/game.js';

// Define variables for web3 integration.
let web3, wallet_id, contract;

// Defining client socket and relevant events.
const socket = io();

// Initialize canvas variables and display title screen.
socket.on("init", () => {
    initCanvas();
});

// Attempt to connect to Metamask Wallet through web3 amd create smart contract instance.
socket.on("connect_web3", async() => {   
    replaceMsg("Establishing web3 connection...", 450, 450, 50);
    try {
        web3 = await getWeb3();
        let accounts = await web3.eth.getAccounts();
        wallet_id = accounts[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        replaceMsg("Connected to wallet! Attempting to join match.", 300, 450, 50);
        socket.emit("connected_web3");
    }
    catch(err) {
        console.log(err);
        replaceMsg("Unable to connect to Metamask Wallet!", 390, 450, 50);
    }
});

// Upon both players being matched, a match will be created within the smart contract by p2.
socket.on("create_match", async(opponent_id) => {
    console.log(socket.id);
    console.log(opponent_id);
    replaceMsg("Creating match...", 640, 450, 50);
    try {
        await contract.methods.createMatch(socket.id)
                .send({
                    from: wallet_id,
                    value: 10000000000000000,
                    gasPrice: 50000000000
                });
        replaceMsg("Waiting for opponent to connect...", 450, 450, 50);
        socket.emit("match_created", opponent_id);
    }
    catch(err) {
        console.log(err);
        handleGameEnd("Create match transaction failed.", 450, 450);
        socket.emit("match_create_fail", opponent_id);
    }
});

// Once the match is created, p1 will join p2's match.
socket.on("join_match", async(opponent_id) => {   
    replaceMsg("Joining match...", 640, 450, 50);
    try {
        await contract.methods.joinMatch(opponent_id, socket.id)
                .send({
                    from: wallet_id,
                    value: 10000000000000000,
                    gasPrice: 50000000000
                });
        replaceMsg("Initializing match...", 630, 450, 50);
        socket.emit("match_start", opponent_id);
    }
    catch(err) {
        console.log(err);
        handleGameEnd("Join match transaction failed.", 470, 450);
        socket.emit("match_join_fail", opponent_id);
    }
});

// p1 failed to join match because p2's transaction was not successful.
socket.on("create_fail", () => {
    handleGameEnd("Opponent failed to create match.", 462, 450);
});

socket.on("join_fail", async () => {
    replaceMsg("Opponent failed to join match.", 455, 450, 50);
    try {
        await contract.methods.abort(socket.id)
                .send({
                    from: wallet_id,
                    gasPrice: 50000000000
                });
    }
    catch(err) {
        console.log(err);
        replaceMsg("Abort transaction failed.", 640, 450, 50);
    }
    handleGameEnd("Opponent failed to join match.", 450, 450);
});

// When p2 joins the match, the game begins.
socket.on("start", () => {
    startGame();
});

// Counter to show each player the opponent's score.
socket.on("opponent_scored", () => {
    addOpponentScore();
});

// Victor of the match will receive this event to be awarded winnings.
socket.on('victory', async(message) => {
    if(message.length < 20) {
        handleGameEnd(message, 650, 450);
    }
    else {
        handleGameEnd(message, 450, 450);
    }
    try {
        await contract.methods.victory(socket.id) 
                .send({
                    from: wallet_id,
                    gasPrice: 50000000000
                });
    }
    catch(err) {
        replaceMsg("Unable to award funds due to decline or failure.", 340, 450, 50);
    }
});

// Loser of the match will not receive any winnings.
socket.on('defeat', async(message) =>  {
    if(message.length < 20) {
        handleGameEnd(message, 650, 450);
    }
    else {
        handleGameEnd(message, 450, 450);
    }
});

// If the match is a tie, both players will receive their initial bet back.
socket.on('tie', async(message) =>  {
    handleGameEnd(message, 650, 450);
    try {
        await contract.methods.tie(socket.id) 
                .send({
                    from: wallet_id,
                    gasPrice: 50000000000
                });
    }
    catch(err) {
        replaceMsg("Unable to refund due to decline or failure.", 350, 450, 50);
    }
    
});

export {socket};