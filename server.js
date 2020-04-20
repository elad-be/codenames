// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const fs = require('fs');
var mysql = require('mysql');
var path    = require("path");
app.engine('html', require('ejs').renderFile);
var mongodb = require('mongodb');
var collection;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://eladben:143526@cluster0-kdsz6.mongodb.net/test?retryWrites=true&w=majority";
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static("public"));


// change color of the board
app.post('/changeColor', function(request, response){
    console.log(request.body.user);
MongoClient.connect(url, function(err, db) {
  var dbo = db.db("codename");
  
  dbo.collection("boards").find({"gamecode": parseInt(request.body.user)}).toArray(function(err, result) {
    if (err) throw err;
    var newbegginer = result[0]["begginer"];
    if(newbegginer == "red") {newbegginer = "blue";}
    else {newbegginer = "red";}


  var myquery = { gamecode: parseInt(request.body.user)};
  var newvalues = { $set: {begginer:newbegginer} };
  dbo.collection("boards").updateOne(myquery, newvalues, function(err, res) {
    if (err) throw err;
    console.log("1 document updated");
    db.close();
  });
});

});
  response.status(204).send();
});

// this is refrence to how get data from mongo
function getBoard(code){
  return new Promise(function (resolve, reject) {
MongoClient.connect(url, function(err, db) {
  var dbo = db.db("codename");
  dbo.collection("boards").find({gamecode:code}).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result);
    resolve(result);
    db.close();
  });
});
    });
}

function getGame(gamecode, callBack){
MongoClient.connect(url, function(err, db){
    if(err) throw err;
    var dbo = db.db("codename");
    dbo.collection("boards").find({gamecode:gamecode}).toArray(function(err, result){
        if(err) throw err;
        db.close();
        //console.log(result) // shows the employees. cool!
        // you can return result using callback parameter
        return callBack(result);
    })
})
}

var a = "mm2";
var employees = getGame("11", function(result) {
   if(result!=null){
     console.log("game doesnt exist");
     a = "lala2";
     console.log(a);
   }
});
// end of refrence


// thos is the function that insert each game
function insertBoard(code, colorBoard){
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("codename");
  var myobj = { gamecode: code, board: colorBoard, begginer:"red"};
  dbo.collection("boards").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
});
}

//generates board
function Regen(){
    var red = [], blue= [];
    var board = [];
    var bomb = -1;
    while(red.length < 9){
      var r = Math.floor(Math.random() * 25) + 1;
      if(red.indexOf(r) === -1) red.push(r);
    }

    while(blue.length < 8){
      var r = Math.floor(Math.random() * 25) + 1;
      if(red.indexOf(r) === -1 && blue.indexOf(r) === -1) blue.push(r);
    }

    while (bomb == -1){
      var r = Math.floor(Math.random() * 25) + 1;
      if(red.indexOf(r) === -1 && blue.indexOf(r) === -1) bomb = r;
    }   
 
  
    for (var i=1;i<26;i++){
    	if (red.indexOf(i) > -1)
    	{
    		board.push("#F14448");
    	}
    	else if (blue.indexOf(i) >-1){
    		board.push("#0E82A7");
    	}
    	else if(i == bomb){
    		board.push("#3F3E39");
    	}
    	else{
    		board.push("#D8CC98");
    	}
    }
      return board;
     }



async function isCodeExist (code) { // check if code exist in db or not
  return new Promise(function(resolve, reject) {
    const MongoClient2 = require("mongodb").MongoClient;
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("codename");
      var query = {gamecode : code};
      var results = dbo.collection("boards").find(query)
        .toArray(function(err, result) {
          if (err) throw reject(err);
          if (result.length == 0){
             resolve(false);
          }
          else{
           resolve(true);
          }
      });
      db.close();
    });
  });
};


async function getValidGameCode(code, res) { // generates valid game code and returns it the web page
  let num = null
  let isExist = await isCodeExist(code);
  while(isExist){
    code = Math.floor(Math.random() * 100000) + 1;
    isExist = await isCodeExist(code);
  }
  insertBoard(code, boardColors);
  res.render(path.join(__dirname+'/views/index.html'), {board:boardColors, name:fileName, begginer: "red"});
};

var boardColors = Regen(); // those are the color of the spesific game
var fileName; // this is the game code


// the function that happens when user gets into the website
app.get('/',function(req,res){
	if(req.query.board == null){
    boardColors = Regen(); // create color array
    fileName = Math.floor(Math.random() * 100000) + 1; // randomize game code

    /* to delete after review
    //insertBoard(fileName, boardColors); // insert the data into db
		//res.render(path.join(__dirname+'/views/index.html'), {board:boardColors, name:fileName, begginer: "red"});
    */
    getValidGameCode(fileName, res);
	}
	else{ // if the user have the game code
  var this_number = req.query.board;
  var a = parseInt(req.query.board);
  MongoClient.connect(url, function(err, db) { // connect to db, get the data of the game
  var dbo = db.db("codename");
  dbo.collection("boards").find({"gamecode": a}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result[0]["board"]);
    // send the data to user
    res.render(path.join(__dirname+'/views/index.html'), {board:result[0]["board"], name:this_number, begginer:result[0]["begginer"]});
    db.close();
  });
});

}
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});





