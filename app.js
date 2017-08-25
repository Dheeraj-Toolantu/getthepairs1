var path = require("path");  
var mysql = require('mysql');

/*
var con = mysql.createConnection({
    host: "getthepair.cr1a92pwyyql.us-east-2.rds.amazonaws.com",
    user: "toolantu",
    password: "789system",
    database:"getthepair"
});
*/

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database:"getthepairs"
});
	

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
var onlineplayers = [];
var players = [];
var senders=[];
var roomno=1;
var playerlimit=4;
var imgvalue=0;
var k=0;
var playerCount=0;
var quickplaycount=0;
var quickplayroomid=0;
var quickplayroom={};
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

app.get('/loginForm', function(req, res){
	var tempuser ={
		"displayName" : req.query.displayName,
		"photos" : '/profile.png'
	}
	
	var ipaddr = ip.address();
	 con.query("SELECT * from pairmania_user_info where user_info_ip_addr='"+ipaddr+"' and user_info_fb_id='na'",function(err,rows,fields){
        if(err) throw err;
        if(rows.length===0)
			{
				console.log("There is no such user, adding now");
				con.query("INSERT into pairmania_user_info(user_info_name,user_info_email,user_info_img,user_info_ip_addr,user_info_gender) VALUES('"+req.query.displayName+"','na','/profile.png','"+ipaddr+"','na')",function(err,results){
					if(err) throw err;
					con.query("SELECT * from pairmania_user_info where user_info_ip_addr='"+ipaddr+"' and user_info_fb_id='na' limit 1",function(err,rows,fields){
						if(err) throw err;
						tempuser["pairmania_id"]=rows[0].pairmania_id;
						tempuser["score"]=rows[0].user_info_score;
						tempuser["pairs"]=rows[0].user_info_pair_cnt;
						res.render('index', { user: tempuser });
						console.log('profile pic is '+req.query.photos);
				   });
				});   
			}
          else
            {
              console.log("User already exists in database");
			  con.query("SELECT * from pairmania_user_info where user_info_ip_addr='"+ipaddr+"' and user_info_fb_id='na' limit 1",function(err,rows,fields){
				if(err) throw err;
				tempuser["pairmania_id"]=rows[0].pairmania_id;
				tempuser["score"]=rows[0].user_info_score;
				tempuser["pairs"]=rows[0].user_info_pair_cnt;
				res.render('index', { user: tempuser });
				console.log('profile pic is '+req.query.photos);
			   });
			   
			}
          });
});

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

app.get('/', function(req, res){	
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook',{scope:'email'}),
  function(req, res) {
	  //console.log(req._passport.session.user.name.givenName);
	   con.query("SELECT * from pairmania_user_info where user_info_fb_id="+req._passport.session.user.id,function(err,rows,fields){
        if(err) throw err;
		req._passport.session.user['pairmania_id'] = rows[0].pairmania_id;
		req._passport.session.user['photos'] = rows[0].user_info_img;
		req._passport.session.user["score"]=rows[0].user_info_score;
		req._passport.session.user["pairs"]=rows[0].user_info_pair_cnt;
		res.render('index', { user: req._passport.session.user });
	   });
	//res.redirect('/user='+req._passport.session.user);
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

//server.listen(process.env.PORT);
server.listen(4000);

process.env.PWD = process.cwd()
	
// Then
app.use(express.static(process.env.PWD + '/img'));
app.use(express.static(path.join(__dirname, 'public')));

io.sockets.on('connection', function (socket) {
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		
		if(rooms.length > playerlimit)
		  {	  
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
			onlineplayers.push(player);
     		usernames[username] = username.PlayerSocketId;
			socket.broadcast.emit('onlineplayers', onlineplayers);
			console.log('added user: '+player.player);
			socket.emit('updaterooms', rooms);
			socket.emit('showplayercount', onlineplayers);
			socket.broadcast.emit('showplayercount', onlineplayers);
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('quickplay', function(data) {
		
		console.log( "Quick Play Area...");
		if(!quickplaycount){
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
			//console.log( "creating quickplay room..."+quickplayroom);
			
			var playerlimit =3;
			var imgscore='';
			
			con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
				if (err) throw err;
						imgvalue=row[0].ptype_set;
						con.query("SELECT GROUP_CONCAT(img_score SEPARATOR ',') as imgscore FROM imgpair WHERE imgval in ("+imgvalue+") ", function (err, row1, fields) {
							if (err) throw err;
								imgscore=row1[0].imgscore;
				//				console.log("imgscore of room-->"+imgscore);
								quickplayroom['imgvalue'] = imgvalue;
								quickplayroom['imgscore'] = imgscore;
								rooms.push(quickplayroom);
								//socket.emit('updaterooms', quickplayroom);
								//socket.broadcast.emit('updaterooms', quickplayroom);
								//console.log('rooms created :'+ quickplayroom.roomid +' '+quickplayroom.roomname);
								//console.log('rooms created with img:'+ quickplayroom.imgvalue);
								//console.log('rooms created with imgscore:'+ quickplayroom .imgscore);
								joinQuickplay(quickplayroom,data.PlayerSocketId);
						});
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
			
			con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
				if (err) throw err;
						imgvalue=row[0].ptype_set;
						con.query("SELECT GROUP_CONCAT(img_score SEPARATOR ',') as imgscore FROM imgpair WHERE imgval in ("+imgvalue+") ", function (err, row1, fields) {
							if (err) throw err;
								imgscore=row1[0].imgscore;
				//				console.log("imgscore of room-->"+imgscore);
								quickplayroom['imgvalue'] = imgvalue;
								quickplayroom['imgscore'] = imgscore;
								rooms.push(quickplayroom);
								//socket.emit('updaterooms', quickplayroom);
								//socket.broadcast.emit('updaterooms', quickplayroom);
								//console.log('rooms created :'+ quickplayroom.roomid +' '+quickplayroom.roomname);
								//console.log('rooms created with img:'+ quickplayroom.imgvalue);
								//console.log('rooms created with imgscore:'+ quickplayroom .imgscore);
								joinQuickplay(quickplayroom,data.PlayerSocketId);
						});
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
		
		player[0]['roomid']=newroom.roomid;					
		player[0]['roomname']=newroom.roomname;
		players.push(player[0]);
		
		// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
		//Send this event to everyone in the room.
		
		io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+" ("+newroom.roomid+")");
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', player[0].player + ' has connected to this room');
		socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
		socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
		socket.emit('onlineplayers', onlineplayers);
		socket.emit('updateplayers', players, newroom);
		socket.emit('showgamearea');
	}
	
	socket.on('create', function(room) {
		var playerlimit = room.roomlimit;
		var imgscore='';
		console.log("creating room...");
		
		con.query("SELECT * FROM pairtype WHERE ptype_player_count="+playerlimit+" order by rand() limit 1", function (err, row, fields) {
			if (err) throw err;
					imgvalue=row[0].ptype_set;
					con.query("SELECT GROUP_CONCAT(img_score SEPARATOR ',') as imgscore FROM imgpair WHERE imgval in ("+imgvalue+") ", function (err, row1, fields) {
						if (err) throw err;
							imgscore=row1[0].imgscore;
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
			console.log(invitedroom.Playerusername+' -> '+newroom.roomname+'('+newroom.roomid+')-->'+newroom.imgvalue);
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
	
	socket.on('winner', function (data) {
		var currentroomid='';
		var currentroomname='';
		var pairmania_id=0;
		var winningPlayer={};
		var userscore=0;
		var winningPlayerarr={};
		var playerPlaying = data.playerPlaying;
		var currentroomlimit=data.roomlimit;
		
			for(var i=0;i<playerPlaying.length;i++){ 
				if(playerPlaying[i].PlayerSocketId==socket.id){
					currentroomid = playerPlaying[i].roomid;
					currentroomname = playerPlaying[i].room;
					pairmania_id = playerPlaying[i].pairmania_id;
					data['roomid'] = currentroomid;
					data['roomname'] = currentroomname;
					data['pairmania_id'] = pairmania_id;
					console.log('room & pairmania_id: '+currentroomid+" & "+pairmania_id);
					playerPlaying = playerPlaying.filter(function(item){ 
						//console.log('winner player with filter-->>'+item);
						 return (item.PlayerSocketId !== socket.id); 
					});
				}
			}
		
		
		playerScorecard = playerScorecard.filter(function(item){ 
					//console.log('winner player with filter-->>'+item);
					 return (item.srcsocketId !== socket.id); 
				});	 
		 
		console.log('updated pending player-->'+playerPlaying.length);
				
		con.query("SELECT * FROM imgpair WHERE imgval="+data.imgval+" limit 1", function (err, row, fields) {
			if (err) throw err;
					imgvalue=row[0].img_score;
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
				con.query("INSERT INTO userpaircollection SET  usercollec_pairmania_id="+pairmania_id+",usercollec_imgval="+data.imgval+",usercollec_img_count="+data.imgcnt+",usercollec_userrank="+data.rank+",usercollec_user_score="+userscore+",usercollec_username='"+data.playername+"',usercollec_usersocketid='"+data.srcsocketId+"',usercollec_room='"+currentroomid+"',usercollec_user_ipaddr='"+ip.address()+"' ", function (err, result) {
					if (err) throw err;
					console.log("1 record inserted in userpaircollection");
				});
				
				con.query("UPDATE pairmania_user_info SET  user_info_score=user_info_score+"+userscore+",user_info_pair_cnt=user_info_pair_cnt+"+data.imgcnt+" WHERE pairmania_id="+pairmania_id+"", function (err, result) {
					if (err) throw err;
					console.log("1 record updated in pairmania_user_info");
				});
				
				playerScorecard.push(data);
				socket.broadcast.to(currentroomid).emit('alertWinner',data,playerScorecard,playerPlaying,currentroomname,currentroomid,currentroomlimit);
				socket.emit('disableplayer',playerPlaying);
				console.log('After updated length'+playerPlaying.length);
						
			});
	});
	
	socket.on('gameover', function (playersocketid,pendingPlayers,currentroomname,currentroomid,playerlimit) {
		var room = {};
		var imgvalue ='';
		var cntr=0;
		var playercnt = ''+playerlimit+'';
		console.log('after creting room-->' + playercnt);
		if(!cntr){
		
		con.query("SELECT * FROM pairtype  WHERE ptype_player_count ="+playercnt+" order by rand() limit 1", function (err, row, fields) {
			if (err) throw err;
					imgvalue=row[0].ptype_set;
					con.query("SELECT GROUP_CONCAT(img_score SEPARATOR ',') as imgscore FROM imgpair WHERE imgval in ("+imgvalue+") ", function (err, row1, fields) {
						if (err) throw err;
						
						imgscore=row1[0].imgscore;
							
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
		con.query("Select GROUP_CONCAT(tbl1.usercollec_imgval SEPARATOR ',') as usercollec_imgval,GROUP_CONCAT(tbl1.usercollec_img_count SEPARATOR ',') as usercollec_img_count,GROUP_CONCAT(tbl1.userscore SEPARATOR ',') as userscore,tbl1.usercollec_username,tbl2.usertotalscore from (SELECT usercollec_room,usercollec_usersocketid,usercollec_username,usercollec_imgval,sum(usercollec_img_count) as usercollec_img_count,sum(usercollec_user_score) as userscore FROM userpaircollection WHERE usercollec_room ='"+currentroomid+"'  group by usercollec_usersocketid,usercollec_username,usercollec_imgval,usercollec_room order by usercollec_username) tbl1 inner join (select usercollec_usersocketid,sum(usercollec_user_score) as usertotalscore from userpaircollection where usercollec_room='"+currentroomid+"' group by usercollec_usersocketid) tbl2 on tbl1.usercollec_usersocketid=tbl2.usercollec_usersocketid group by tbl1.usercollec_usersocketid order by tbl2.usertotalscore desc", function (err, row, fields) {
			if (err) throw err;
					console.log("Display Final Result : "+row.length);
					
					io.sockets.in(currentroomid).emit('writeFinalResult', row);
					rooms = rooms.filter(function(item){ 
							return (item.roomid !== currentroomid); 
						});	
			});
	});
	socket.on('restartGame', function(newroom) {
        //var oldroom;
        //oldroom = socket.room;
        //socket.leave(socket.room);
        //socket.join(newroom.roomname);
		console.log('joined room : ' + newroom.roomname);
		console.log('joined room limit : ' + newroom.roomlimit);
        socket.room = newroom.roomid;
        
		socket.username = newroom.Playerusername;
		
		// add the client's username to the global list
		//usernames[username] = newroom.PlayerSocketId;
	
		  //Send this event to everyone in the room.
		io.sockets.in(socket.room).emit('connectToRoom', "You are in room no. "+newroom.roomname+'('+newroom.roomid+')');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has connected to this room');
		socket.broadcast.to(socket.room).emit('updateplayers', players, newroom);
		socket.broadcast.to(socket.room).emit('onlineplayers', onlineplayers);
		socket.emit('onlineplayers', onlineplayers);
		socket.emit('updateplayers', players, newroom);
		socket.emit('showgamearea');
	});
	
	
	socket.on('disconnect', function(){
		
		app.get('/', function (req, res) {
			res.sendfile(__dirname + '/index.html');
		});
		// remove the username from global usernames list
		 players = players.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id); 
		});
		
		onlineplayers = onlineplayers.filter(function(item){ 
			 return (item.PlayerSocketId !== socket.id); 
		});
		
		var room = rooms.filter(function(item){ 
					return (item.roomid == socket.room); 
				});		
		
		console.log(room);
		console.log(players[0]);
		console.log('updated-players--'+ players.length+'('+socket.room+')');
		// update list of users in chat, client-side
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER ', socket.username+' has left the game');
		socket.broadcast.to(socket.room).emit('updateplayers', players ,room[0]);
		socket.emit('updateplayers', players ,room[0]);
		socket.emit('showplayercount', onlineplayers);
		socket.broadcast.emit('showplayercount', onlineplayers);
		
		// echo globally that this client has left
		//socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
			
		
	});
});
