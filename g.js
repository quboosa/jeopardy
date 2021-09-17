let cid = null;                        // works i guess // js is fun.
let isCorrect = null;

class TriviaGameShow {
   constructor(element) {
     //Database for clues and categories
     this.categories = [];  //*
     this.clues = {};   //* a key,value store for every clue that we get back so each clue has a unique identifier to mark the done thing at each clue
     //State
     this.currentClue = null; 
     //this.score = 0;



     //Elements, reference to all elements we interact with
     this.boardElement = element.querySelector(".board"); // whole container where clue goes
     //this.scoreCountElement = element.querySelector(".score-count"+myNo);
     this.formElement = element.querySelector("form");
     this.inputElement = element.querySelector("input[name=user-answer]");
     this.modalElement = element.querySelector(".card-modal"); // modal that we show/hide
     this.clueTextElement = element.querySelector(".clue-text");
     this.resultElement = element.querySelector(".result");
     this.resultTextElement = element.querySelector(".result_correct-answer-text");
     this.successTextElement = element.querySelector(".result_success");
     this.failTextElement = element.querySelector(".result_fail");
   }
 
   initGame() {
     if(clients.length < 3){
         setTimeout(this.initGame(), 5000);
     }



     //Bind event handlers
     this.boardElement.addEventListener("click", event => {
         if (event.target.dataset.clueId) {
             this.handleClueClick(event);
          }
     });
     this.formElement.addEventListener("submit", event => {
          this.handleFormSubmit(event);
     });
     //Render initial state of score
       this.updateScore(0);  
     //Kick off the category fetch
       this.fetchCategories();
   }
    
   fetchCategories(){
      var trivobj,i;
      // db  is from the JSON file 
      // trivobj = db;

      trivobj = {
         "categories" : [
            {"title" : "Sports"},
            {"title" : "Technology"},
            {"title" : "Movies"},
            {"title" : "Editorial"},
         ]
      }

      for(i in trivobj.categories){
      //Start with a blank category
      var category = {
         title: trivobj.categories[i].title,   //*category id
         clues: []              //clue is differen dataset
      }
      //Add every clue within a category to our database of clues  //splice chooses 5 clues
      // var clues = shuffle(trivobj.categories[i].clues).splice(0,5).forEach((clue, index) => {
         // console.log(clue)
         for(let j = 0; j < 5; j++) {
         //Create unique ID for this clue
         var clueId = i + "-" + j;  
         category.clues.push(clueId);
         //Add clue to DB
         this.clues[clueId] = {
         //   question: clue.question,
         //   answer: clue.answer,
           value: (j + 1) * 100
         };
      }
      //Add this category to our DB of categories
         this.categories.push(category);
      };
      //Render each category to the DOM
         this.categories.forEach((c) => {
            this.renderCategory(c);
      });
   }
 
   renderCategory(category) {      
       let column = document.createElement("div");
       column.classList.add("column");
       column.innerHTML = (
          `<header>${category.title}</header>
          <ul>
          </ul>`
       ).trim();
       
       var ul = column.querySelector("ul");
       category.clues.forEach(clueId => {
          var clue = this.clues[clueId];
          ul.innerHTML += `<li><button data-clue-id=${clueId}> $${clue.value}</button></li>`
       })
       
       //Add to DOM
       this.boardElement.appendChild(column);
   }
 
   updateScore(change) {
      score += change;   // add previous score to the score change when answered correctly
       //###tweak here to add the deduction score parameter###
       //this.scoreCountElement.textContent = this.score;
         console.log(score);
    }
 
   handleClueClick(event) {
      var clue = this.clues[event.target.dataset.clueId];
      cid = event.target.dataset.clueId;

      const payLoad = {
         "method" : "getQuestion",
         "clientId" : clientId,
         "clueId" : cid
      }

      console.log("payload clueId", cid);

      ws.send(JSON.stringify(payLoad));
 
      //Mark this button as used
      event.target.classList.add("used");
       
      //Clear out the input field
      this.inputElement.value = "";
       
      //Update current clue
      this.currentClue = clue;
 
      //Update the text
      this.clueTextElement.textContent = this.currentClue.question;

      // this.resultTextElement.textContent = this.currentClue.answer;

      console.log("Inside", this.currentClue.answer);                                
 
      //Hide the result
      this.modalElement.classList.remove("showing-result");
       
      //Show the modal
      this.modalElement.classList.add("visible");
      this.inputElement.focus();
   }
 
   //Handle an answer from user
   handleFormSubmit(event) {
      event.preventDefault();


      // Send the clinets answer to server
      const payLoad = {
         "method" : "getAnswer",
         "clientId" : clientId,
         "clueId" : cid,
         "ans" : this.inputElement.value
      }

      ws.send(JSON.stringify(payLoad));
      console.log("My ans", payLoad);

      // var isCorrect = this.cleanseAnswer(this.inputElement.value) === this.cleanseAnswer(this.currentClue.answer);
      // if (isCorrect) {
      // if (isCorrect) {
      //    // if(true){
      //     this.updateScore(this.currentClue.value);
      //     const payLoad = {
      //       "method" : "updateScore",
      //       "gameId" : gameId,
      //       "clientId" : clientId,
      //       "scoreId" : myNo,
      //        "newScore" : score
      //   }
      //  ws.send(JSON.stringify(payLoad));
      // }
       
      // //Show answer
      // this.revealAnswer(isCorrect);
   }
    
   //Standardize an answer string so we can compare and accept variations
   cleanseAnswer(input="") {
      var friendlyAnswer = input.toLowerCase();
      friendlyAnswer = friendlyAnswer.replace("<i>", "");
      friendlyAnswer = friendlyAnswer.replace("</i>", "");
      friendlyAnswer = friendlyAnswer.replace(/ /g, "");
      friendlyAnswer = friendlyAnswer.replace(/"/g, "");
      friendlyAnswer = friendlyAnswer.replace(/^a /, "");
      friendlyAnswer = friendlyAnswer.replace(/^an /, "");      
      return friendlyAnswer.trim();
   }
    
   revealAnswer(isCorrect) {
      //Show the individual success/fail case
      this.successTextElement.style.display = isCorrect ? "block" : "none";
      this.failTextElement.style.display = !isCorrect ? "block" : "none";
      
      //Show the whole result container
      this.modalElement.classList.add("showing-result");
       
      //Disappear after a short bit
      setTimeout(() => {
         this.modalElement.classList.remove("visible");
      }, 3000);
   }
}

const trivgame = new TriviaGameShow( document.querySelector(".app"));
let curr_question = null;

//HTML elements
let clientId = null;
let gameId = null;
let myNo = null;
let clients = {}
let score=0;
let scorech = score;  // use it to display updated scores from here              
let ws = new WebSocket("ws://localhost:9000")  //*automatically connect to websocket when we open the website

// Server IP here
// let ws = new WebSocket("ws://117.193.122.173:9000")  //*automatically connect to websocket when we open the website



const btnCreate = document.getElementById("btnCreate"); //** create button html elements
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId"); //*** to store gameid 
const divPlayers = document.getElementById("divPlayers");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const score0 = document.getElementById("score0");
//wiring events
  btnJoin.addEventListener("click", e => {
    if (gameId === null)  //*** condition for other clients who have not created the game but are connecting and then join thru gameid hence the read request
      gameId = txtGameId.value;
        
      const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId
        }
      ws.send(JSON.stringify(payLoad));
   })
  
  btnCreate.addEventListener("click", e => {
      const payLoad = {  
        "method": "create",
        "clientId": clientId
        }
       ws.send(JSON.stringify(payLoad)); 
   })

   ws.onmessage = message => { 
     const response = JSON.parse(message.data);
     //connect
     if (response.method === "connect"){  //* at connect id set right
         clientId = response.clientId;
         console.log("Client id ---> " + clientId + " <--- Set successfully ")
      }
        
     //create
     if (response.method === "create"){
         gameId = response.game.id;  //***to store the game id received at creation
         var ele = document.getElementById("share");
         ele.innerHTML = response.game.id;
      }

     //update
     if (response.method === "update"){  //BROADCAST STATE
      if (!response.game.state) return;  //previous state retained

      for(const b of Object.keys(response.game.state))
      {
      let scorech = response.game.state[b];
      const ballObject = document.getElementById("score" + b);
      ballObject.innerHTML = scorech;
      }
   }   

   // Method : getQuestion -> Recieve the question from the server
   if(response.method === "getQuestion")
   {
      curr_question = response.question;
      trivgame.clueTextElement.textContent = curr_question;
      console.log(response.question);
   }
     
   // Method getAnswer -> Recieve evaluated answer from the server
   if(response.method === "getAnswer") 
   {
      isCorrect = response.result;
      correctAns = response.answer;
      trivgame.resultTextElement.textContent =correctAns;

      if (isCorrect) {
          trivgame.updateScore(trivgame.clues[cid].value);
          const payLoad = {
            "method" : "updateScore",
            "gameId" : gameId,
            "clientId" : clientId,
            "scoreId" : myNo,
             "newScore" : score
        }
       ws.send(JSON.stringify(payLoad));
      }
       
      //Show answer
      trivgame.revealAnswer(isCorrect);
      console.log("isCorrect", isCorrect);
      console.log("Right ans", correctAns);
   }

      //join
     if (response.method === "join"){
         let game = response.game;
         clients = game.clients;
       
         while(divPlayers.firstChild)  //***if there is a child then remove it (children) and then thru loop start adding the players
            divPlayers.removeChild (divPlayers.firstChild)
        
         game.clients.forEach (c => {  //***loop thru all the clients
          const d = document.createElement("div"); //for each client an element is created
          d.style.width = "500px";
          d.textContent = c.clientId;   //use innerhtml to change it to player usernamr here or replace at sc1,sc2
          divPlayers.appendChild(d);
          // Get my playerNo
         if(c.clientId === clientId)     myNo = c.clientNo;  // input the score for each player and set it
         //maybe above not needed as it is done one time and other time play will set state
         
        console.log("clientNo :" + myNo);
        console.log("score :" + score);
         const payLoad = {
            "method" : "updateScore",
            "gameId" : gameId,
            "clientId" : clientId,
            "scoreId" : myNo,
             "newScore" : score
        }
      ws.send(JSON.stringify(payLoad));
      })
                
      

 //-------------------------------------------
 
   trivgame.initGame();
  }//join end         
} //ws.onmessage end





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