const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {cors: {origin: "*"}});

// Establishing socketIO server instance. 
rooms = []

io.on("connection", socket => { 
    // Prompt client to display title screen.
    io.to(socket.id).emit("init");

    // Prompt client to connect to web3.
    socket.on("attempt_web3", () => {
        io.to(socket.id).emit("connect_web3")
    });

    // Connected to web3. Attempt to join room.
    socket.on("connected_web3", () => {
        matched = false;
        for(let i = 0; i < rooms.length; i++) {
            // Room available, create a new match.
            if(rooms[i].length < 2) {   
                rooms[i].push({"socket_id" : socket.id, "score": -1});
                io.to(socket.id).emit("create_match", rooms[i][0]["socket_id"]);
                matched = true
                break;
            }
        }
        // No room available, create new room and wait for opponent.
        if(!matched) {
            rooms.push([{"socket_id" : socket.id, "score": -1}]);
        }
    });

    // Created match, prompt opponent to join.
    socket.on("match_created", (opponent_id) => {
        io.to(opponent_id).emit("join_match", socket.id);
    });

    // Both players joined and placed bet. Begin match.
    socket.on("match_start", (opponent_id) => { 
        io.to(socket.id).emit("start");
        io.to(opponent_id).emit("start");
    });

    // To update opponent score for both players.
    socket.on('scored', () => {
        for(let i = 0; i < rooms.length; i++) {
            if(rooms[i].length == 2) {
                p1 = rooms[i][0];
                p2 = rooms[i][1];

                // If id matches p1.
                if (p1["socket_id"] == socket.id) {
                    io.to(p2["socket_id"]).emit("opponent_scored");
                }
                // If id matches p2.
                else if (p2["socket_id"] == socket.id) {
                    io.to(p1["socket_id"]).emit("opponent_scored");   
                }

            }
        }
    })

    // Handle gameover emitted from client.
    socket.on('gameover', (score) => {
        for(let i = 0; i < rooms.length; i++) {
            if (rooms[i].length == 2) {
                p1 = rooms[i][0];
                p2 = rooms[i][1];

                // If id matches p1.
                if (p1["socket_id"] == socket.id) {
                    p1["score"] = score;
                }
                // If id matches p2.
                else if (p2["socket_id"] == socket.id) {
                    p2["score"] = score;   
                }

                // If both scores received, check who won.
                if (p1["score"] != -1 && p2["score"] != -1) {
                    // p1 won.
                    if(p1["score"] > p2["score"]) {
                        io.to(p1["socket_id"]).emit("victory", "You won " + p1["score"] + " to " + p2["score"] + '!');
                        io.to(p2["socket_id"]).emit("defeat", "You lost " + p2["score"] + " to " + p1["score"] + '!');
                    }
                    // p2 won.
                    else if(p2["score"] > p1["score"]){
                        io.to(p1["socket_id"]).emit("defeat", "You lost " + p1["score"] + " to " + p2["score"] + '!');
                        io.to(p2["socket_id"]).emit("victory", "You won " + p2["score"] + " to " + p1["score"] + '!');
                    }
                    // tie.
                    else {
                        io.to(p1["socket_id"]).emit("tie", "You tied " + p1["score"] + " to " + p2["score"] + "!");
                        io.to(p2["socket_id"]).emit("tie", "You tied " + p1["score"] + " to " + p2["score"] + "!");
                    }
                    // Remove room from list.
                    rooms.splice(i, 1);
                    break;
                }
            }
        }
    });

    // Handle client disconnect.
    socket.on('disconnect', function () {
        for(let i = 0; i < rooms.length; i++) {
            // If the game hasn't started, just delete room.
            if(rooms[i].length == 1) {
                p1 = rooms[i][0];
                if(p1["socket_id"] == socket.id) {
                    rooms.splice(i, 1);
                }
            }
            // If the game started, disconnected player loses and opponent wins.
            else if(rooms[i].length == 2) {
                p1 = rooms[i][0];
                p2 = rooms[i][1];
                if(p1["socket_id"] == socket.id) {
                    io.to(p2["socket_id"]).emit("victory", "Opponent disconnected. You won!");
                    rooms.splice(i, 1);
                }
                if(p2["socket_id"] == socket.id) {  
                    io.to(p1["socket_id"]).emit("victory", "Opponent disconnected. You won!");
                    rooms.splice(i, 1);
                }
            }
        }
    });
});


// Web server config. 
app.use(express.static("public"));

httpServer.listen(3000, () => {
    console.log("Server running on port 3000.")
});