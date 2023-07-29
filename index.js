var express = require('express');

/*
app.get("/", (req,res)=> res.sendFile(__dirname + "/challenge.html"))

app.listen(9091, ()=>console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
*/
const PORT = process.env.PORT || 3000;
const INDEX = '/challenge.html';
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
const websocketServer = require("websocket").server
const wss = new websocketServer({
    "httpServer": server
})

//hashmap clients
const clients = {};
const games = {};
const currentGameId=[];


wss.on("request",request =>{
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);
        // a user wants to join game
        if(result.method=='join'){
            console.log('joining a server game')
            console.log(result)
            if(!result.clientId){
                //generate clientId
                if(clients){
                    console.log('printing clients')
                    console.log(clients)
                    for(const client in clients){
                        console.log('printing a client')
                        console.log(clients[client].userId);
                        if(clients[client].userId==result.userId){
                            console.log('user found')
                        }
                    }

                }
                const clientId = guid();
                clients[clientId]={
                    "connection": connection,
                    "userId": result.userId
                }
                //send response back to client
                const payLoad = {
                    "method": "connect",
                    "clientId": clientId
                }
                //send back the client connect
                connection.send(JSON.stringify(payLoad))
            }else{
                const clientId = result.clientId;
                console.log(games)
                console.log(currentGameId);
                if(currentGameId.length<1){
                    const clientId = result.clientId;
                    const gameId = guid();
                    currentGameId.push(gameId);
                    games[gameId] = {
                        "id": gameId,
                        "clients": [],
                        "users": [],
                        "questions":[]
                    }
        
                    const payLoad = {
                        "method": "create",
                        "game" : games[gameId]
                    }
                    const con = clients[clientId].connection;
                    con.send(JSON.stringify(payLoad));
                }
                else if(games[currentGameId[0]].clients.length<5){
                    var gameIdRef = games[currentGameId[0]].id;
                    console.log(result.userName)
                    const gameId = gameIdRef;
                    const game = games[gameId];
                    if(game.users.includes(result.userName)==false){
                        game.clients.push({
                            "clientId": clientId
                        })
                        game.users.push(result.userName)
                        const payLoad = {
                            "method": "join",
                            "game": game
                        }
                        //loop through all clients and tell them that people has joined
                        game.clients.forEach(c => {
                            clients[c.clientId].connection.send(JSON.stringify(payLoad))
                        })
                    }else{
                        console.log('client already in game');
                        const payLoad = {
                            "method": "join",
                            "game": game
                        }
                        //loop through all clients and tell them that people has joined
                        game.clients.forEach(c => {
                            clients[c.clientId].connection.send(JSON.stringify(payLoad))
                        })
                    }
                }
                else if(games[currentGameId[0]].clients.length==5){
                    const clientId = result.clientId;
                    const gameId = guid();
                    currentGameId.push(gameId);
                    games[gameId] = {
                        "id": gameId,
                        "clients": [],
                        "users": [],
                        "questions":[]
                    }
        
                    const payLoad = {
                        "method": "create",
                        "game" : games[gameId]
                    }
                    currentGameId[0]=gameId;
                    const con = clients[clientId].connection;
                    con.send(JSON.stringify(payLoad));
                }
            }
        }
        if (result.method === "start") {
            updateGameState(1,currentGameId[0]);

        }
    })

    
})

function updateGameState(round, g){
    const game = games[g];
    sqlCon.connect(function(err) {
        if (err) throw err;
        if(round==1){
            var style ='word';
            sqlCon.query("SELECT * FROM pub WHERE style = '"+style+"' ORDER BY RAND () LIMIT 1", function (err, resultSql, fields) {
              if (err) throw err;
                console.log(resultSql[0].answer)
              
                sqlCon.query("SELECT * FROM trivia WHERE answer LIKE '%"+resultSql[0].answer+"%' AND answer !='"+resultSql[0].answer+"' ORDER BY RAND () LIMIT 30", function (err2, resultSql2, fields2) {
                if (err2) throw err2;            
                var questions = resultSql2;
                game.questions.push(questions)
                console.log('final')
                console.log(game)
            
                const payLoad = {
                    "method": "update",
                    "game": game
                }
            
                game.clients.forEach(c=> {
                    clients[c.clientId].connection.send(JSON.stringify(payLoad))
                })
                
                
                })
                sqlCon.end();
            });
        }
        

        
    });
    
}


function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
