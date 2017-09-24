var path = require("path");  
var mysql = require('mysql');
var con = mysql.createConnection({
    host: "getthepair.cr1a92pwyyql.us-east-2.rds.amazonaws.com",
    user: "toolantu",
    password: "789system",
    database:"getthepair"
});

/*
var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database:"getthepairs"
});
*/
	con.connect(function(err) {
	  if (err) throw err;
	  console.log("Connected to db!");
	});

var express           =     require('express')
  , passport          =     require('passport')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , cookieParser      =     require('cookie-parser')
  , bodyParser        =     require('body-parser')
  , config            =     require('./configuration/config')
  , mysql             =     require('mysql')
  , app               =     express()
  , ip                =     require("ip")
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

  // usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var quizrooms = [];
var playerScorecard = [];
var rooms = [];
var restartrooms = [];
var onlineplayers = [];
var onlinebattleplayers = [];
var players = [];
var battleplayers = [];
var battlerooms = [];
var senders=[];
var roomno=1;
var playerlimit=4;
var imgvalue=0;
var k=0;
var playerCount=0;
var quickplaycount=0;
var quickplayroomid=0;
var quickplayroom={};
var battleplaycount=0;
var battleplayroomid=0;
// Passport session setup.

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the FacebookStrategy within Passport.
var request = require('request');

passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url,
	profileFields: [ 'email' , 'name', 'displayName', 'photos','gender']
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {

      //Check whether the User exists or not using profile.id
      con.query("SELECT * from pairmania_user_info where user_info_fb_id="+profile.id,function(err,rows,fields){
        if(err) throw err;
        if(rows.length===0)
          { 
			var photo = '/profile.png';
			var email = 'na';
			if(!profile.photos[0].value) 
			{
				throw profile.photos[0].value;
			}else{
				photo=profile.photos[0].value;
			}
			
            console.log("There is no such user, adding now");
            con.query("INSERT into pairmania_user_info(user_info_fb_id,user_info_name,user_info_email,user_info_img,user_info_ip_addr,user_info_gender) VALUES('"+profile.id+"','"+profile.displayName+"','"+email+"','"+photo+"','"+ip.address()+"','"+profile.gender+"')");
			return done(null, profile);
			}
          else
            { 
              console.log("User already exists in database");
			   return done(null, profile);
			}
          });
    });
  }
));


app.set('views', __dirname + '/');
app.set('view engine', 'ejs');
app.use(cookieParser('keyboard cat'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(
{ secret: 'keyboard cat',
 resave: true,
 saveUninitialized: true
 }
 ));
app.use(passport.initialize());
app.use(passport.session({ secret: 'keyboard cat',
 key: 'sid'}));
app.use(express.static(__dirname + '/public'));


app.get('/loginForm', function(req, res){
	
	if(req.query.username!==null && req.query.username!==undefined && req.query.password!==null && req.query.password!==undefined){
		sess = req.session;
		sess.username = req.query.username;
		sess.photos = '/profile.png';
		var tempuser ={
			"username" : req.query.username,
			"photos" : '/profile.png',
		}
		var ipaddr = ip.address();
		con.query("SELECT * from pairmania_user_info where user_info_username='"+req.query.username+"'",function(err,rows,fields){
			if(err) throw err;
			if(rows.length>0)
				{
					console.log("User exists in database");
					con.query("SELECT * from pairmania_user_info where user_info_username='"+req.query.username+"' and user_info_password='"+req.query.password+"' limit 1",function(err,rows,fields){
						if(err) throw err;
						if(rows.length>0){
							tempuser["pairmania_id"]=rows[0].pairmania_id;
							tempuser["displayName"]=rows[0].user_info_name;
							tempuser["score"]=rows[0].user_info_score;
							tempuser["pairs"]=rows[0].user_info_pair_cnt;
							
							sess.pairmania_id=tempuser["pairmania_id"];
							sess.displayName=tempuser["displayName"];
							sess.score=tempuser["score"];
							sess.pairs=tempuser["pairs"];
							res.render('loginsuccess', { user: tempuser });
							if(tempuser["pairs"]>=30){
								onlinebattleplayers.push(tempuser);
							}
							console.log('profile pic is '+req.query.photos);
						}else{
							tempuser["status"]='password_not_matching';
							res.render('signupAlert',{ user: tempuser });
						}
					});
				}
			  else
				{
					tempuser["status"]='username_not_matching';
					res.render('signupAlert',{ user: tempuser });
				}
			});
		}else{
			res.render('index',{ user: 0});
		}
});

app.get('/signupForm', function(req, res){
	
	if(req.query.name!=='' && req.query.username!=='' && req.query.password!==''){
		sess = req.session;
		var tempuser ={
			"displayName" : req.query.name,
			"username" : req.query.username,
			"password" : req.query.password,
			"photos" : '/profile.png',
		}
		sess.username = req.query.username;
		sess.photos = '/profile.png';
		var ipaddr = ip.address();
		con.query("SELECT * from pairmania_user_info where user_info_username='"+req.query.username+"'",function(err,rows,fields){
			if(err) throw err;
			if(rows.length===0)
			{
				console.log("There is no such user, adding now");
				con.query("INSERT into pairmania_user_info(user_info_name,user_info_username,user_info_password,user_info_email,user_info_img,user_info_ip_addr,user_info_gender) VALUES('"+req.query.name+"','"+req.query.username+"','"+req.query.password+"','na','/profile.png','"+ipaddr+"','na')",function(err,results){
					if(err) throw err;
					con.query("SELECT * from pairmania_user_info where user_info_ip_addr='"+ipaddr+"' and user_info_fb_id='na' limit 1",function(err,rows,fields){
						if(err) throw err;
						tempuser["pairmania_id"]=rows[0].pairmania_id;
						tempuser["score"]=rows[0].user_info_score;
						tempuser["pairs"]=rows[0].user_info_pair_cnt;
						sess.pairmania_id=tempuser["pairmania_id"];
						sess.displayName=tempuser["displayName"];
						sess.score=tempuser["score"];
						sess.pairs=tempuser["pairs"];
						res.render('loginsuccess', { user: tempuser });
						console.log('profile pic is '+req.query.photos);
				   });
				});   
			}
			else
            {
              console.log("User already exists in database");
			  
				tempuser["status"]='username_exists';
				res.render('signupAlert', { user: tempuser });
				
			}
        }); 
	}  
});

app.get('/battle', function(req, res){
	var pairmania_id = req.query.pairmania_id;
	var tempuser ={};
	var ipaddr = ip.address();
	con.query("SELECT * from pairmania_user_info where pairmania_id="+pairmania_id+"",function(err,rows,fields){
        if(err) throw err;
			console.log(rows.length);
			if(rows.length)
				{
					if(rows[0].user_info_pair_cnt>=30){
						tempuser["displayName"]=rows[0].user_info_name;
						tempuser["pairmania_id"]=rows[0].pairmania_id;
						tempuser["score"]=rows[0].user_info_score;
						tempuser["pairs"]=rows[0].user_info_pair_cnt;
						tempuser["photos"]=rows[0].user_info_img;
						tempuser["status"]='eligible';
						res.render('battle', { user: tempuser });
						
					}else{
						tempuser["displayName"]=rows[0].user_info_name;
						tempuser["pairmania_id"]=rows[0].pairmania_id;
						tempuser["score"]=rows[0].user_info_score;
						tempuser["pairs"]=rows[0].user_info_pair_cnt;
						tempuser["photos"]=rows[0].user_info_img;
						tempuser["status"]='not eligible';
						res.render('battle', { user: tempuser });
					}
				}
			else
				{
					console.log("User already exists in database");
				}
          });
});

app.get('/singleplay', function(req, res){
	console.log('singleplay'+req.query.pairmania_id);
	var pairmania_id = req.query.pairmania_id;
	var tempuser ={};
	var ipaddr = ip.address();
	con.query("SELECT * from pairmania_user_info where pairmania_id="+pairmania_id+"",function(err,rows,fields){
        if(err) throw err;
			console.log(rows.length);
			
				if(rows.length)
				{
					
						tempuser["displayName"]=rows[0].user_info_name;
						tempuser["pairmania_id"]=rows[0].pairmania_id;
						tempuser["score"]=rows[0].user_info_score;
						tempuser["pairs"]=rows[0].user_info_pair_cnt;
						tempuser["photos"]=rows[0].user_info_img;
						tempuser["status"]='eligible';
						res.render('singleplay', { user: tempuser });
						
				}
					
			});
});

app.get('/', function(req, res){	
  sess = req.session;
  if(sess.username){
	res.render('loginsuccess', { user: sess });
  }else{
	res.render('index', { user: 0 });
  }
  console.log('I m here in index...'+sess.username);
});

app.get('/loginsuccess', ensureAuthenticated, function(req, res){
  res.render('loginsuccess', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook',{scope:'email'}),
  function(req, res) {
	  sess = req.session;
	  //console.log(req._passport.session.user.name.givenName);
	   con.query("SELECT * from pairmania_user_info where user_info_fb_id="+req._passport.session.user.id,function(err,rows,fields){
        if(err) throw err;
		req._passport.session.user['displayName'] = rows[0].user_info_name;
		req._passport.session.user['pairmania_id'] = rows[0].pairmania_id;
		req._passport.session.user['photos'] = rows[0].user_info_img;
		req._passport.session.user["score"]=rows[0].user_info_score;
		req._passport.session.user["pairs"]=rows[0].user_info_pair_cnt;
		sess.pairmania_id=rows[0].pairmania_id;
		sess.username=rows[0].user_info_fb_id;
		sess.displayName=rows[0].user_info_name;
		sess.score=rows[0].user_info_score;
		sess.pairs=rows[0].user_info_pair_cnt;
		sess.photos=rows[0].user_info_img;
		res.render('loginsuccess', { user: req._passport.session.user });
		
		if(rows[0].user_info_pair_cnt>=30){
			onlinebattleplayers.push(req._passport.session.user);
		}
	   });
	//res.redirect('/user='+req._passport.session.user);
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/index')
}

server.listen(process.env.PORT || 80 || 3000 || 4000);
//server.listen(4000);

process.env.PWD = process.cwd()
	
// Then
app.use(express.static(process.env.PWD + '/img'));
app.use(express.static(path.join(__dirname, 'public')));

io.sockets.on('connection', function (socket) {
	// when the client emits 'adduser', this listens and executes
		socket.on('adduser', function(username){
		var onlinebattleplayer={};
		var player={};
		if(rooms.length > playerlimit){	  
			roomno++;
			playerlimit=playerlimit+4;
		}
		 
		socket.username = username.Playerusername;
		player={
			"player" : username.Playerusername,
			"Playerimg" : username.Playerimg,
			"pairmania_id" : username.pairmania_id,
			"PlayerSocketId" : username.PlayerSocketId
		}
		
		onlinebattleplayer = onlinebattleplayers.filter(function(item){ 
			 return (item.pairmania_id == username.pairmania_id); 
		});
		
		if(onlinebattleplayer.length){
	
			for(var i=0;i<onlinebattleplayers.length;i++){
				if(onlinebattleplayers[i].pairmania_id==username.pairmania_id){
					
					onlinebattleplayers.splice(i, 1);
					onlinebattleplayers.push(player);
				}
			}
			
			socket.broadcast.emit('onlinebattleplayers', onlinebattleplayers);
		}			
		
		onlineplayers.push(player);
		usernames[username] = username.PlayerSocketId;
		socket.broadcast.emit('onlineplayers', onlineplayers);
		console.log('added user: '+player.player);
		socket.emit('updaterooms', rooms);
		socket.emit('showplayercount', onlineplayers);
		socket.broadcast.emit('showplayercount', onlineplayers);
		socket.emit('addquickplay');
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('quickplay', function(data) {
		
		console.log( "Quick Play Area..."+data.PlayerSocketId+'....'+quickplaycount);
		if(quickplaycount<=0){
			var roomid = new Date().valueOf();
			quickplayroomid= roomid*(Math.round(Math.random()*100) + 1); 
			quickplayroom={
							"roomid":quickplayroomid,
							"roomname":"Quick Play",
							"roomlimit":3,
							"status" :'ready',
							"roompassword":'na'
						}
			socket.room=quickplayroomid;	
			quickplaycount = 1;
			//console.log( "creating quickplay room..."+quickplayroom);
			
			var playerlimit =3;
			var imgscore='';
			var randnum=0;
			for(var t=1;t<=playerlimit;t++){
				randnum = Math.floor(Math.random() * 500) + 50; 
				imgscore = imgscore.concat(randnum,',');
			}
			console.log('imgscore of the room--->'+imgscore)
			con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
				if (err) throw err;
					imgvalue=row[0].ptype_set;
					quickplayroom['imgvalue'] = imgvalue;
					quickplayroom['imgscore'] = imgscore;
					rooms.push(quickplayroom);
					joinQuickplay(quickplayroom,data.PlayerSocketId);
					
				});
		
		}else if((quickplaycount > 0) && (quickplaycount<=5)) {
			//var roomlen = io.sockets.adapter.rooms[''+quickplayroomid+''].length;
			var check=0;
			for(var i=0;i<rooms.length;i++){
				
				if(rooms[i].roomid==quickplayroomid && rooms[i].status!='started'){
						 joinQuickplay(rooms[i],data.PlayerSocketId);
						quickplaycount = quickplaycount+1;
						check =1;
					}
				
			}
			if(check==0){
				
						quickplaycount=0;
						socket.emit('startquickreplay',{
							quickplaycount:quickplaycount
						})
					
			}				
			if(quickplaycount==5){
				quickplaycount=0;
			}
			//console.log(quickplaycount);
		}		
	});
	
	socket.on('quickreplay', function(data) {
		
		console.log( "Quick RePlay Area..."+data.quickplaycount);
		if(!data.quickplaycount){
			quickplayroom='';
			var roomid = new Date().valueOf();
			quickplayroomid= roomid*(Math.round(Math.random()*100) + 1); 
			quickplayroom={
							"roomid":quickplayroomid,
							"roomname":"Quick Play",
							"roomlimit":3,
							"status" :'ready',
							"roompassword":'na'
						}
			socket.room=quickplayroomid;	
			quickplaycount = quickplaycount+1;
			
			console.log( "creating quick-replay room..."+quickplayroom.roomid);
			
			var playerlimit =3;
			var imgscore='';
			
			var randnum=0;
			for(var t=1;t<=playerlimit;t++){
				randnum = Math.floor(Math.random() * 500) + 50; 
				imgscore = imgscore.concat(randnum,',');
			}
			console.log('imgscore of the room--->'+imgscore)
			
			con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
				if (err) throw err;
						imgvalue=row[0].ptype_set;
						imgscore=imgscore;
						quickplayroom['imgvalue'] = imgvalue;
						quickplayroom['imgscore'] = imgscore;
						rooms.push(quickplayroom);
						joinQuickplay(quickplayroom,data.PlayerSocketId);
					
				});
		}	
	});
	 
	function joinQuickplay(newroom,PlayerSocketId){
		
		var oldroom;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom.roomid);
		console.log('joined room : ' + newroom.roomid);
		console.log('joined room : ' + newroom.roomname);
		console.log('joined room limit : ' + newroom.roomlimit);
		
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newroom.roomid;
       
		var player = onlineplayers.filter(function(item){ 
					return (item.PlayerSocketId == PlayerSocketId); 
				});
				
		onlineplayers = onlineplayers.filter(function(item){ 
			 return (item.PlayerSocketId !== PlayerSocketId); 
		});
		
		if(player.length){
			player[0]['roomid']=newroom.roomid;					
			player[0]['roomname']=newroom.roomname;
			players.push(player[0]);
			
			io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+" ("+newroom.roomid+")");
			// echo to room 1 that a person has connected to their room
			socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', player[0].player + ' has connected to this room');
			socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
			socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
			socket.emit('onlineplayers', onlineplayers);
			socket.emit('updateplayers', players, newroom);
			socket.emit('showgamearea');
		}
		// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
		//Send this event to everyone in the room.
	}
	
	socket.on('create', function(room) {
		var playerlimit = room.roomlimit;
		var imgscore='';
		
		var randnum=0;
			for(var t=1;t<=playerlimit;t++){
				randnum = Math.floor(Math.random() * 500) + 50; 
				imgscore = imgscore.concat(randnum,',');
			}
			console.log('creating room...--->'+imgscore);
			
		con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
			if (err) throw err;

				imgvalue=row[0].ptype_set;
				
				imgscore=imgscore;
				console.log("imgscore of room-->"+imgscore);
				room['imgvalue'] = imgvalue;
				room['imgscore'] = imgscore;
				room['status']='pending';
				rooms.push(room);
				
				socket.emit('updaterooms', rooms);
				socket.broadcast.emit('updaterooms', rooms);
				console.log('rooms created :'+ room.roomid +' '+room.roomname);
				console.log('rooms created with img:'+ room.imgvalue);
				console.log('rooms created with imgscore:'+ room.imgscore);
	
			});
	});
	
	socket.on('switchRoom', function(newroom) {
        var oldroom;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom.roomid);
		console.log('joined room : ' + newroom.roomname);
		console.log('joined room limit : ' + newroom.roomlimit);
		
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newroom.roomid;
        
		    socket.username = newroom.Playerusername;
			
			onlineplayers = onlineplayers.filter(function(item){ 
				return (item.PlayerSocketId !== socket.id); 
			});
			
			player={
				"player" : newroom.Playerusername,
				"Playerimg":newroom.Playerimg,
				"pairmania_id" : newroom.pairmania_id,
				"room" : newroom.roomname,
				"roomid" : newroom.roomid,
				"PlayerSocketId" : newroom.PlayerSocketId
			}
			
			players.push(player);
			console.log(player);
			console.log(newroom.Playerusername+' -> '+socket.room);
		// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
	
		//Send this event to everyone in the room.
		io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+" ("+newroom.roomid+")");
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has connected to this room');
		socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
		socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
		socket.emit('onlineplayers', onlineplayers);
		socket.emit('updateplayers', players, newroom);
		socket.emit('showgamearea');
	});
	
	socket.on('joinRoom', function(invitedroom) {
        var oldroom;
		var newroom ;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(invitedroom.roomid);
		console.log('joined room : ' + invitedroom.roomname);
		
            socket.room = invitedroom.roomid;
        
		    socket.username = invitedroom.Playerusername;
			
			onlineplayers = onlineplayers.filter(function(item){ 
				return (item.PlayerSocketId !== socket.id); 
			});
			
			rooms.filter(function(item){ 
				if(item.roomid == invitedroom.roomid){
					newroom={
						roomid:item.roomid,
					    roomname:item.roomname,
						roomlimit:item.roomlimit,
						imgvalue : item.imgvalue, 
						imgscore : item.imgscore,
						status : item.status,	
						roompassword:item.roompassword
					}
				}
			});
			
			player={
				"player" : invitedroom.Playerusername,
				"Playerimg" : invitedroom.Playerimg,
				"pairmania_id" : invitedroom.pairmania_id,
				"room" : invitedroom.roomname,
				"roomid" : invitedroom.roomid,
				"PlayerSocketId" : invitedroom.PlayerSocketId
			}
			players.push(player);
			console.log(player);
			console.log(invitedroom.Playerusername+' -> '+invitedroom.roomname+'('+invitedroom.roomid+')-->'+invitedroom.imgvalue);
		// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
	
		//Send this event to everyone in the room.
		io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+invitedroom.roomname+'('+newroom.roomid+')');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has connected to this room');
		socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
		socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
		socket.emit('onlineplayers', onlineplayers);
		socket.emit('updateplayers', players, newroom);
		socket.emit('showgamearea');
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendimg', function (data) {
		var trgPlayer	=	data.trgPlayer;
		var srcPlayer	=	data.srcPlayer;
		var srcImg	=	data.srcImg;
		var trgsocketId = data.trgsocketId;
		var srcsocketId = data.srcsocketId;
		socket.broadcast.to(trgsocketId).emit('receiveimg',trgPlayer,data);
	});
	
	socket.on('startGame', function (data) {
		io.sockets.in(data.room).emit('gameStartAlert',data.room,data.msg);
	});
	
	socket.on('settimer', function (data) {
		console.log(data.srcPlayer+'--->'+data.trgPlayer);
		console.log(data.srcsocketid+'--->'+data.opponantsocketId);
		socket.emit('gettimer',data);
	});

	socket.on('gameStarted', function (data) { 
		socket.emit('sendImg',data);
		console.log("playerstarted-->"+data.roomid+'----'+data.playersocketid);
		console.log("game started with img-->"+data.imgvalue);
	
		for(var i=0;i<rooms.length;i++){
			console.log(rooms[i]);
			if(rooms[i].roomid==data.roomid){
				console.log('before len'+rooms.length);
				rooms.splice(i, 1);
				console.log('after len'+rooms.length);
			}
		}			
			var	updatedroom = {
						roomid:data.roomid,
					    roomname:data.roomname,
						roomlimit:data.roomlimit,
						imgvalue : data.imgvalue, 
						imgscore : data.imgscore,
						status : data.status,	
						roompassword:data.roompassword
					}	
		rooms.push(updatedroom);
		socket.emit('updaterooms', rooms);
		socket.broadcast.emit('updaterooms', rooms);
	});
	
	socket.on('sendInvitation',function(data) {
		console.log('sending invitation to->>'+data.receiver);
		socket.broadcast.to(data.receiver).emit('receiveInvitation',data);
	});
	
	socket.on('sendbattleInvitation',function(data) {
		console.log('sending invitation to->>'+data.receiver);
		socket.broadcast.to(data.receiver).emit('receivebattleInvitation',data);
	});
	
	socket.on('winner', function (data) {
			
			var pairmania_id=0;
			var winningPlayer={};
			var userscore=0;
			var winningPlayerarr={};
			var playerPlaying = data.playerPlaying;
			var currentroomlimit=data.roomlimit;
			var currentroomid=data.roomid;
			var currentroomname = data.roomname;
				for(var i=0;i<playerPlaying.length;i++){ 
					if(playerPlaying[i].PlayerSocketId==socket.id){
						pairmania_id = playerPlaying[i].pairmania_id;
						data['pairmania_id'] = pairmania_id;
						playerPlaying = playerPlaying.filter(function(item){ 
							 return (item.PlayerSocketId !== socket.id); 
						});
					}
				}
				
			data['roomid'] = currentroomid;
			data['roomname'] = currentroomname;
			
			playerScorecard = playerScorecard.filter(function(item){ 
					 return (item.srcsocketId !== socket.id); 
				});	 
			 
			console.log('updated pending player-->'+playerPlaying.length);
					
			con.query("SELECT * FROM imgpair WHERE imgval="+data.imgval+" limit 1", function (err, row, fields) {
				
				if (err) throw err;
						imgvalue=data.imgscore;
						if(data.rank==1){
							data['score'] = (1000 + (parseInt(data.imgcnt) * imgvalue));
							userscore= (1000 + (parseInt(data.imgcnt) * imgvalue));
						}else if(data.rank==2){
							data['score'] = (500 + (parseInt(data.imgcnt) * imgvalue));
							userscore= (500 + (parseInt(data.imgcnt) * imgvalue));
						}else if(data.rank==3){
							data['score'] = (200 + (parseInt(data.imgcnt) * imgvalue));
							userscore= (200 + (parseInt(data.imgcnt) * imgvalue));
						}else if(data.rank==4){
							data['score'] = (100 + (parseInt(data.imgcnt) * imgvalue));
							userscore= (100 + (parseInt(data.imgcnt) * imgvalue));
						}else if(data.rank==5){
							data['score'] = (50 + (parseInt(data.imgcnt) * imgvalue));
							userscore= (50 + (parseInt(data.imgcnt) * imgvalue));
						}else{
						   data['score'] = (10 + (parseInt(data.imgcnt) * imgvalue));
						   userscore= (10 + (parseInt(data.imgcnt) * imgvalue));
						}
					
					console.log("score-->"+userscore);
						
					if(data.status=='done'){
						con.query("INSERT INTO userpaircollection SET  usercollec_pairmania_id="+pairmania_id+",usercollec_imgval="+data.imgval+",usercollec_img_count="+data.imgcnt+",usercollec_userrank="+data.rank+",usercollec_user_score="+userscore+",usercollec_username='"+data.playername+"',usercollec_usersocketid='"+data.srcsocketId+"',usercollec_room='"+currentroomid+"',usercollec_user_ipaddr='"+ip.address()+"' ", function (err, result) {
							if (err) throw err;
							console.log("1 record inserted in userpaircollection");
						});
						
						con.query("UPDATE pairmania_user_info SET  user_info_score=user_info_score+"+userscore+",user_info_pair_cnt=user_info_pair_cnt+"+data.imgcnt+" WHERE pairmania_id="+pairmania_id+"", function (err, result) {
							if (err) throw err;
							console.log("1 record updated in pairmania_user_info");
						});
						playerScorecard.push(data);
						socket.emit('disableplayer',playerPlaying);
						socket.broadcast.to(currentroomid).emit('alertWinner',data,playerScorecard,playerPlaying,currentroomname,currentroomid,currentroomlimit);
					}else if(data.status=='ready'){
						socket.broadcast.to(currentroomid).emit('alertWinner',data,playerScorecard,playerPlaying,currentroomname,currentroomid,currentroomlimit);
						console.log('After updated length'+playerPlaying.length);
					}
			});
	   });
	
	socket.on('gameover', function (playersocketid,pendingPlayers,currentroomname,currentroomid,playerlimit) {
		var room = {};
		var imgvalue ='';
		var imgscore='';
		var cntr=0;
		var playercnt = ''+playerlimit+'';
		console.log('after creting room-->' + playercnt);
		
		if(!cntr){
			
		var randnum=0;
			for(var t=1;t<=playerlimit;t++){
				randnum = Math.floor(Math.random() * 500) + 50; 
				imgscore = imgscore.concat(randnum,',');
			}
			console.log('recreating room with score ...--->'+imgscore);
			
		con.query("SELECT * FROM pairtype  WHERE ptype_player_count ="+playercnt+" order by rand() limit 1", function (err, row, fields) {
			if (err) throw err;
					imgvalue=row[0].ptype_set;
					
						room =  {
								 'roomid' : currentroomid,
								 'roomname' : currentroomname,
							     'imgvalue':imgvalue,
						         'imgscore':imgscore,
								 'roomlimit': playercnt,
								 'status' : 'ready',
								 'roompassword' : 'na'
								}
						rooms = rooms.filter(function(item){ 
									return (item.roomid !== currentroomid); 
								});		
						rooms.push(room);
						socket.broadcast.to(currentroomid).emit('recreateroom', room);
						displayResult(playersocketid,currentroomid);
						console.log("game is over:-->"+socket.room);
				
			}); 
		cntr++;
		}			 
	});
	
	socket.on('getmypairs', function (data) {
		console.log("pairmaniaid::"+data.pairmania_id);
		con.query("SELECT sum(usercollec_user_score) as usercollec_user_score,sum(usercollec_img_count) as usercollec_img_count,usercollec_imgval FROM userpaircollection  WHERE usercollec_pairmania_id ="+data.pairmania_id+" group by usercollec_pairmania_id,usercollec_imgval order by usercollec_user_score desc", function (err, rows, fields) {
			if (err) throw err;
			console.log("getmypairs Result : "+rows.length);
			socket.emit('showmypairs', rows);
		});
	});
	
	function displayResult(playersocketid,currentroomid){
	    console.log('displaying result....'+currentroomid );
		con.query("Select * from ( SELECT usercollec_room,usercollec_usersocketid,usercollec_username,usercollec_imgval,sum(usercollec_img_count) as usercollec_img_count,sum(usercollec_user_score) as userscore FROM userpaircollection  WHERE usercollec_room ='"+currentroomid+"'  group by usercollec_usersocketid,usercollec_username,usercollec_imgval,usercollec_room order by usercollec_imgval) tbl order by tbl.userscore desc", function (err, row, fields) {
			if (err) throw err;
				console.log("Display Result : "+row.length);
				socket.broadcast.to(currentroomid).emit('displayResult', row);
			});
	}
	
	socket.on('displayFinalResult', function(data){
		var playersocketid = data.playersocketid;
		var currentroomid = data.roomid;
		var currentroomname = data.roomname;
		console.log('displaying Final Result....'+currentroomname+' ('+currentroomid+')' );
		con.query("Select GROUP_CONCAT(tbl1.usercollec_imgval SEPARATOR ',') as usercollec_imgval,GROUP_CONCAT(tbl1.usercollec_img_count SEPARATOR ',') as usercollec_img_count,GROUP_CONCAT(tbl1.userscore SEPARATOR ',') as userscore,tbl1.usercollec_username,tbl2.usertotalscore, tbl2.userimg from (SELECT usercollec_room,usercollec_usersocketid,usercollec_username,usercollec_imgval,sum(usercollec_img_count) as usercollec_img_count,sum(usercollec_user_score) as userscore FROM userpaircollection  WHERE usercollec_room ='"+currentroomid+"'  group by usercollec_usersocketid,usercollec_username,usercollec_imgval,usercollec_room order by usercollec_username) tbl1 inner join (select usercollec_usersocketid,sum(usercollec_user_score) as usertotalscore,user_info_img as userimg from userpaircollection INNER JOIN pairmania_user_info ON pairmania_id = usercollec_pairmania_id where usercollec_room='"+currentroomid+"' group by usercollec_usersocketid) tbl2 on tbl1.usercollec_usersocketid=tbl2.usercollec_usersocketid group by tbl1.usercollec_usersocketid order by tbl2.usertotalscore desc", function (err, row, fields) {
			if (err) throw err;
					console.log("Display Final Result : "+row.length);
					
					io.sockets.in(currentroomid).emit( 'writeFinalResult', row);
					rooms = rooms.filter(function(item){ 
							return (item.roomid !== currentroomid); 
						});	
			});
	});
	 
	socket.on('restartGame', function(newroom) {
		var isrestart=[];
        var restartPlayer={};
		var percentage=0;
		//var oldroom;
        //oldroom = socket.room;
        //socket.leave(socket.room);
        //socket.join(newroom.roomname);
		console.log('joined room : ' + newroom.roomname);
		console.log('joined room limit : ' + newroom.roomlimit);
       
		if(socket.room==newroom.roomid){
				restartPlayer={
				roomid:newroom.roomid,
				roomname:newroom.roomname,
				pairmania_id : newroom.pairmania_id,
				PlayerSocketId : newroom.PlayerSocketId,
				Playerusername : newroom.Playerusername,
				Playerimg : newroom.Playerimg	
			};
			restartrooms.push(restartPlayer);
			socket.room = newroom.roomid;
			socket.username = newroom.Playerusername;
			
			// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
		isrestart = restartrooms.filter(function(item){ 
					//console.log('winner player with filter-->>'+item);
					 return (item.roomid == socket.room); 
				});	 
				
			percentage = Math.round((isrestart.length)/(newroom.roomlimit)*100);	
			console.log('percentage '+ percentage);
			socket.broadcast.to(socket.room).emit('playagain', restartPlayer);
			
			if(percentage>=65){
				
				//Send this event to everyone in the room.
				io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+'('+newroom.roomid+')');
				// echo to room 1 that a person has connected to their room
				socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has connected to this room');
				socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
				socket.emit('onlineplayers', onlineplayers);
				socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
				socket.emit('updateplayers', players, newroom);
				
				socket.emit('showgamearea');
				restartrooms=restartrooms.filter(function(item){ 
					//console.log('winner player with filter-->>'+item);
					 return (item.roomid !== socket.room); 
				});	 
			}
		}
	});
	
	socket.on('leaveRoom', function(data){
		console.log('leaveRoom'+data.status);
		if(data.status=='ready'){
			quickplaycount=quickplaycount-1;
		}
		var player={
				"player" : data.player,
				"Playerimg" : data.Playerimg,
				"pairmania_id" : data.pairmania_id,
				"PlayerSocketId" : data.PlayerSocketId
			}
		
		players = players.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id); 
		});
		
		var room = rooms.filter(function(item){ 
					return (item.roomid == socket.room); 
				});		
		
			
		onlineplayers.push(player);
		socket.broadcast.to(socket.room).emit('updateplayers', players ,room[0]);
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER ', socket.username+' has left the game');
		socket.broadcast.emit('onlineplayers', onlineplayers);
		socket.leave(socket.room);
	});
	
	socket.on('disconnect', function(){
		
		app.get('/', function (req, res) {
			res.sendfile(__dirname + '/index.html');
		});
		// remove the username from global usernames list
		 players = players.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id); 
		});
		
		battleplayers = battleplayers.filter(function(item){ 
					 return (item.PlayerSocketId !== socket.id); 
				});
		
		onlinebattleplayers = onlinebattleplayers.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id);  
		});
		
		onlineplayers = onlineplayers.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id); 
		});
		
		var room = rooms.filter(function(item){ 
					return (item.roomid == socket.room); 
				});		
		var battleroom = battlerooms.filter(function(item){ 
					return (item.roomid == socket.room); 
				});
		console.log(room);
		console.log(players[0]);
		console.log('updated-players--'+ players.length+'('+socket.room+')');
		console.log('updated-battle-players--'+ battleplayers.length+'('+socket.room+')');
		
		// update list of users in chat, client-side
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER ', socket.username+' has left the game');
		socket.broadcast.to(socket.room).emit('updateplayers', players ,room[0]);
		socket.broadcast.emit('onlineplayers', onlineplayers);
		socket.broadcast.emit('onlinebattleplayers', onlinebattleplayers);
		socket.broadcast.to(socket.room).emit('updatebattleplayers', battleplayers,battleroom[0]);
		
		socket.broadcast.emit('showplayercount', onlineplayers);
		
		// echo globally that this client has left
		//socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
			
	});
	/****************************************Battle********************************************************/
	
	socket.on('battleplay', function(data) {
		
		console.log( "battle Play Area...");		
		var imgscore=0;
		var imgvalue=0;
		var battleplayer='';
		socket.username = data.Playerusername;
		if(!battleplaycount){
			
			var playerlimit = 2;
			
			var roomid = new Date().valueOf();
			battleplayroomid= roomid*(Math.round(Math.random()*100) + 1); 
			battleplayroom={
							"roomid":battleplayroomid,
							"roomname":'Battle Play',
							"roomlimit":playerlimit,
							"status" :'ready',
							"roompassword":'na'
						}
						
			socket.room=battleplayroomid;	
			battleplaycount = battleplaycount+1;
			
			battlerooms.push(battleplayroom);
			joinbattleplay(battleplayroom,data);
		
		}else if((battleplaycount > 0) && (battleplaycount<=2)) {
			//var roomlen = io.sockets.adapter.rooms[''+quickplayroomid+''].length;
			var check=0;
			for(var i=0;i<battlerooms.length;i++){
				
				if(battlerooms[i].roomid==battleplayroomid && battlerooms[i].status!='started'){
					
						joinbattleplay(battlerooms[i],data);
						battleplaycount = battleplaycount+1;
						check =1;
				}
			}
			
			if(check==0){
				
						battleplaycount=0;
						socket.emit('startbattlereplay',{
							battleplaycount:battleplaycount
						})
			}	
			
			if(battleplaycount==2){
				battleplaycount=0;
			}
			//console.log(quickplaycount);
		}	
	});
	
	socket.on('battlereplay', function(data) {
		
		console.log( "Battle RePlay Area..."+data.battleplaycount);
		socket.username = data.Playerusername;
		if(!data.battleplaycount){
			
			battleplayroom='';
			var playerlimit = 2;
			var roomid = new Date().valueOf();
			battleplayroomid= roomid*(Math.round(Math.random()*100) + 1); 
			battleplayroom={
							"roomid":battleplayroomid,
							"roomname":'Quick Play',
							"roomlimit":playerlimit,
							"status" :'ready',
							"roompassword":'na'
						}
			
			socket.room=battleplayroomid;	
			battleplaycount = battleplaycount+1;
	
			battlerooms.push(battleplayroom);
			joinbattleplay(battleplayroom,data);
		}	
	});
	
	function joinbattleplay(newroom,data){	
	
		var battleplayer={};
		var oldroom;
		
		battleplayer = battleplayers.filter(function(item){ 
					 return (item.pairmania_id == data.pairmania_id); 
				});
		
		console.log('battleplayer.length'+battleplayer.length);		
		
		if(battleplayer.length>0){	
			battleplaycount = 1;
			battleplayers=battleplayers.filter(function(item){ 
					 return (item.pairmania_id !== data.pairmania_id); 
				});
		}
		oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom.roomid);
		console.log('joined room : ' + newroom.roomid);
		console.log('joined room : ' + newroom.roomname);
		console.log('joined room limit : ' + newroom.roomlimit);
		
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', data.Playerusername + ' has left this room');
        socket.room = newroom.roomid;
       
	    con.query("SELECT GROUP_CONCAT(usercollec_imgval SEPARATOR ',') as usercollec_imgval,GROUP_CONCAT(usercollec_img_count SEPARATOR ',') as usercollec_img_count,GROUP_CONCAT(usercollec_user_score SEPARATOR ',') as usercollec_user_score FROM (select usercollec_imgval , usercollec_img_count, usercollec_user_score  from userpaircollection WHERE usercollec_pairmania_id ="+data.pairmania_id+" order by rand() limit 10  ) tbl ", function (err, row1, fields) {
			if (err) throw err;
				imgscore=row1[0].usercollec_user_score;
				imgvalue=row1[0].usercollec_imgval;
			    imgpaircnt=row1[0].usercollec_img_count;
			battleplayer = {
				Playerusername : data.Playerusername, 
				Playerimg : data.Playerimg, 
 				pairmania_id : data.pairmania_id,
				PlayerSocketId : data.PlayerSocketId,
				imgvalue : imgvalue,
				imgscore : imgscore,
				imgpaircnt:imgpaircnt,
				roomid : newroom.roomid,
				roomname : newroom.roomname	
			}
				battleplayers.push(battleplayer);
				console.log("You are in room no. "+newroom.roomname+" ("+newroom.roomid+"   "+imgpaircnt+")");
				io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+" ("+newroom.roomid+"   "+imgpaircnt+")");
				// echo to room 1 that a person has connected to their room
				socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', battleplayer.Playerusername + ' has connected to this room');
				socket.emit('onlinebattleplayers', onlinebattleplayers);
				socket.broadcast.to(socket.room).emit('updatebattleplayers', battleplayers, newroom);
				socket.emit('onlineplayers', onlineplayers);
				socket.emit('updatebattleplayers', battleplayers, newroom);
				socket.emit('showgamearea');
			
		    });
	}
	
	socket.on('battleStarted', function (data) { 
		socket.room=data.roomid;
		socket.broadcast.to(data.PlayerSocketId).emit('sendbattleImg',data);
	
		for(var i=0;i<battlerooms.length;i++){
			if(battlerooms[i].roomid==data.roomid){
				
				rooms.splice(i, 1);
				
			}
		}			
			var	updatedbattleroom = {
				roomid:data.roomid,
				roomname:data.roomname,
				roomlimit:data.roomlimit,
				imgvalue : data.imgvalue, 
				imgscore : data.imgscore,
				imgpaircnt : data.imgpaircnt,
				status : data.status,	
				roompassword:data.roompassword
			}	
		battlerooms.push(updatedbattleroom);
	});
	 
	 socket.on('battlewinner', function (data) { 
		if(data.status=='win'){
			if(data.playertype=='opp'){
				
				socket.broadcast.to(data.winner.roomid).emit('disableplayer',data.loser.PlayerSocketId);
				socket.emit('disableplayer',data.winner.PlayerSocketId);
				socket.broadcast.to(data.winner.PlayerSocketId).emit('showbattlewinner',data.winner,data.loser);
				socket.emit('showbattlewinner',data.winner,data.loser);
				
				for (var i=0;i<data.loserimgcol.length;i++){
					con.query("INSERT into userpaircollection(usercollec_pairmania_id,usercollec_imgval, usercollec_img_count,usercollec_user_score,usercollec_username,usercollec_usersocketid,usercollec_room,usercollec_user_ipaddr) VALUES("+data.winner.pairmania_id+","+data.loserimgcol[i].imgvalue+","+data.loserimgcol[i].imgpaircnt+","+data.loserimgcol[i].imgscore+",'"+data.winner.Playerusername+"','"+data.winner.PlayerSocketId+"','"+data.winner.roomid+"','"+ip.address()+"')");
					con.query("DELETE FROM userpaircollection WHERE usercollec_pairmania_id = "+data.loser.pairmania_id+" and usercollec_imgval="+data.loserimgcol[i].imgvalue+" and usercollec_user_score="+data.loserimgcol[i].imgscore+"");
					con.query("UPDATE pairmania_user_info SET user_info_score = user_info_score - "+data.loserimgcol[i].imgscore+", user_info_pair_cnt=user_info_pair_cnt-"+data.loserimgcol[i].imgpaircnt+" WHERE pairmania_id = "+data.loser.pairmania_id+" ");
					con.query("UPDATE pairmania_user_info SET user_info_score = user_info_score + "+data.loserimgcol[i].imgscore+", user_info_pair_cnt=user_info_pair_cnt+"+data.loserimgcol[i].imgpaircnt+" WHERE pairmania_id = "+data.winner.pairmania_id+" ");
				}
				
				console.log(data.playertype+'-----'+data.winner.PlayerSocketId);
				
				socket.emit('recreatebattleroom', data.loser);
				socket.broadcast.to(data.winner.PlayerSocketId).emit('recreatebattleroom', data.winner);
				
			}else if(data.playertype=='me'){
				
				socket.emit('disableplayer',data.loser.PlayerSocketId);
				socket.broadcast.to(data.winner.roomid).emit('disableplayer',data.winner.PlayerSocketId);
				
				socket.broadcast.to(data.loser.PlayerSocketId).emit('showbattlewinner',data.winner,data.loser);
				socket.emit('showbattlewinner',data.winner,data.loser);
				
				
				for (var i=0;i<data.loserimgcol.length;i++){
					con.query("INSERT into userpaircollection(usercollec_pairmania_id,usercollec_imgval, usercollec_img_count,usercollec_user_score,usercollec_username,usercollec_usersocketid,usercollec_room,usercollec_user_ipaddr) VALUES("+data.winner.pairmania_id+","+data.loserimgcol[i].imgvalue+","+data.loserimgcol[i].imgpaircnt+","+data.loserimgcol[i].imgscore+",'"+data.winner.Playerusername+"','"+data.winner.PlayerSocketId+"','"+data.winner.roomid+"','"+ip.address()+"')");
					con.query("DELETE FROM userpaircollection WHERE usercollec_pairmania_id = "+data.loser.pairmania_id+" and usercollec_imgval="+data.loserimgcol[i].imgvalue+" and usercollec_user_score="+data.loserimgcol[i].imgscore+"");
					con.query("UPDATE pairmania_user_info SET user_info_score = user_info_score - "+data.loserimgcol[i].imgscore+", user_info_pair_cnt=user_info_pair_cnt-"+data.loserimgcol[i].imgpaircnt+" WHERE pairmania_id = "+data.loser.pairmania_id+" ");
					con.query("UPDATE pairmania_user_info SET user_info_score = user_info_score + "+data.loserimgcol[i].imgscore+", user_info_pair_cnt=user_info_pair_cnt+"+data.loserimgcol[i].imgpaircnt+" WHERE pairmania_id = "+data.winner.pairmania_id+" ");
					console.log("data.loserimgcol[i].imgpaircnt"+data.loserimgcol[i].imgpaircnt);
				}
				
				console.log(data.playertype+'-----'+data.loser.PlayerSocketId);
				
				socket.broadcast.to(data.loser.PlayerSocketId).emit('recreatebattleroom',  data.loser);
				socket.emit('recreatebattleroom', data.winner);
			}
		}
	});
	
	socket.on('imgoveralert', function (data) { 
	    console.log('imgoveralert---'+data.opponantdetails.PlayerSocketId);
		socket.broadcast.to(data.opponantdetails.PlayerSocketId).emit('imgover');
		socket.broadcast.to(data.opponantdetails.PlayerSocketId).emit('recreatebattleroom', data.opponantdetails);
		socket.emit('recreatebattleroom', data.mydetails);
	});
	
	socket.on('rejoinbattle', function (data) { 
		
		console.log('rejoining battle...'+data.PlayerSocketId+'....'+data.roomid);
		var player = battleplayers.filter(function(item){ 
				 return (item.PlayerSocketId == data.PlayerSocketId); 
			});
		battleplayers = battleplayers.filter(function(item){ 
				 return (item.PlayerSocketId !== data.PlayerSocketId); 
			});
				
		var battleplayer={};
		
	    con.query("SELECT GROUP_CONCAT(usercollec_imgval SEPARATOR ',') as usercollec_imgval,GROUP_CONCAT(usercollec_img_count SEPARATOR ',') as usercollec_img_count,GROUP_CONCAT(usercollec_user_score SEPARATOR ',') as usercollec_user_score FROM (select usercollec_imgval , usercollec_img_count, usercollec_user_score  from userpaircollection WHERE usercollec_pairmania_id ="+data.pairmania_id+" order by rand() limit 10  ) tbl ", function (err, row1, fields) {
			if (err) throw err;
				imgscore=row1[0].usercollec_user_score;
				imgvalue=row1[0].usercollec_imgval;
			    imgpaircnt=row1[0].usercollec_img_count;
			
			battleplayer = {
				Playerusername : player[0].Playerusername, 
				Playerimg : player[0].Playerimg, 
 				pairmania_id : player[0].pairmania_id,
				PlayerSocketId : player[0].PlayerSocketId,
				imgvalue : imgvalue,
				imgscore : imgscore,
				imgpaircnt:imgpaircnt,
				roomid : data.roomid,
				roomname : 'Battle Play'	
			}
			
			var newroom={
				roomid: data.roomid,
				roomname:'Battle Play',
				status : 'ready',
				roomlimit:2
			}
			
			battleplayers.push(battleplayer);
		    console.log('reconnected to'+newroom);
			socket.broadcast.to(data.roomid).emit('updatebattleplayers', battleplayers, newroom);
			socket.emit('updatebattleplayers', battleplayers, newroom);
		});
	});
});