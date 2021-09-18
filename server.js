const http = require("http");
const express = require("express");
const app = express();

app.use(express.static(__dirname));                                         // to serve css file

app.get("/", (req, res) => res.sendFile(__dirname + "/GConsole copy.html")) //*9001 hosts client on express


app.listen(9001, () => console.log("Listening on http port 9001"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9000, () => console.log("Listening.. on 9000"))


// M: import data.json server side
const db = require("./datacopy.json");
// console.log(db.categories);

let trivobj = db;
var i;
let categories_t = [];
let clues_t = {};

for (i in trivobj.categories) {
    //Start with a blank category
    var category = {
        title: trivobj.categories[i].title,   //*category id
        clues: []              //clue is differen dataset
    }
    //Add every clue within a category to our database of clues  //splice chooses 5 clues
    var clues = shuffle(trivobj.categories[i].clues).splice(0, 5).forEach((clue, index) => {
        //    console.log(clue)
        //Create unique ID for this clue
        let clueId = i + "-" + index;
        category.clues.push(clueId);
        //Add clue to DB
        clues_t[clueId] = {
            question: clue.question,
            answer: clue.answer,
            value: (index + 1) * 100
        };
    })
    //Add this category to our DB of categories
    categories_t.push(category);
};

// console.log("clues_t", clues_t);
console.log("categories_t", categories_t);

//hashmap clients
const clients = {};
let games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data) //server rcv msg from client in JSON form (assumption made) **utf8Data is rcvd by server if cliet sends sth
        //I have received a message from the client

        //create a new game
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "client-count": 3,    //---see if i can remove this 
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //a client want to join
        if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            let game = games[gameId];
            if (game.clients.length >= 3) {//***player limit set here
                //sorry max players reach
                return;
            }
            let clientNo = game.clients.length  //initialise each player score to zero
            game.clients.push({
                "clientId": clientId,
                "clientNo": clientNo, // Starts from 0 ---see if i can remove this 
                "score": 0  // Initial score set to 0
            })
            //start the game
            if (game.clients.length === 3) updateGameState();  //SERVER STARTS SENDING GAME STATE AFTER 500MS WHEN ALL THREE PLAYERS JOIN

            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        // A player send the updated score state
        if (result.method === "updateScore") {
            const gameId = result.gameId;
            const scoreId = result.scoreId;
            const newScore = result.newScore;
            let state = games[gameId].state;
            if (!state)  //*****SETTING STATE INITIALLY AS IT IS NOT SET SOMETIMES */
                state = {}

            state[scoreId] = newScore;
            console.log("backend pe update chala")
            games[gameId].state = state;
        }


        // Client sends clueID to retrieve question
        if (result.method === "getQuestion") {
            const clientId = result.clientId;
            const clueId = result.clueId;

            // Server sends the question to the client
            const payLoad = {
                "method": "getQuestion",
                "question": clues_t[clueId].question
            }

            console.log("question", payLoad.question);
            clients[clientId].connection.send(JSON.stringify(payLoad));
        }

        // Get the clients answer and check
        if (result.method === "getAnswer") {
            const clientId = result.clientId;
            const clients_answer = result.ans;
            const clueId = result.clueId;

            let isCorrect = clues_t[clueId].answer === clients_answer;

            console.log("iScorrect", isCorrect);
            const payload = {
                "method": "getAnswer",
                "result": isCorrect,
                "answer": clues_t[clueId].answer
            }

            clients[clientId].connection.send(JSON.stringify(payload));

            console.log(payload);
            console.log("cliennts ans", clients_answer);
            console.log(clues_t[clueId].answer)

        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {  //*mapping from a connection to the clientId
        "connection": connection  //* I can add some more metadata with the client here maybe a nickname or color of client etc */
    }

    const payLoad = { //*sendback to the user/client from server
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))  //*JSON works on string n not bytes hence stringify required

})


function updateGameState() {   //*****SEND BACK GAME STATE AFTER EVERY 500SEC */
    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        let game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => { //******UPDATED STATE SENT BACK TO EACH CLIENT AFTER TIME 500 */
            clients[c.clientId].connection.send(JSON.stringify(payLoad))  //SERVER SEND STATE TO ALL CLIENTS
        })
    }
    setTimeout(updateGameState, 500);  //EVERY 500MS IT IS SENT
}



function S4() {   //*randomise function to create unique guid for new client connections
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();


//Utils -----------------------------------
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
