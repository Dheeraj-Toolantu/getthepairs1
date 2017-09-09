	var socket = io.connect();
	var k=0;
	var rank=1;
	var countdownarr=[];
	var imgvalue = '';
	var playerslimit='';
	var currentroomname='';
	var currentroom='';
	var imgCollection=['1','2','3'];
	var playerPlaying=[];
	var playerScorecard=[];
	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('updatechat', function (username, data) {
		$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
	});
	
	socket.on('showplayercount',function(playerCount){
		$('#allcount').html(playerCount.length);
	});
	
	socket.on('onlineplayers', function(onlineplayers) {
		$('#onlineplayers').html('');
		var i=0;
		$.each(onlineplayers, function(key, value) {
				if(value.PlayerSocketId!=socket.id){
					$('#onlineplayers').append('<div class="media" style="padding:5px"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="'+value.Playerimg+'" alt="profile picture" height="60px" ></a></div><div class="media-body"><h4><strong>'+value.player+'</strong></h4><b>&nbsp;<button class="btn btn-xs btn-primary" onclick="invitePlayer(\''+value.PlayerSocketId+'\')">Invite</button></b></div></div>');
				}
			});	
		})	
	
	// listener, whenever the server emits 'updaterooms', this updates the room the client is in
	socket.on('updateplayers', function(usernames,roomdetails) {
	    currentroomname=roomdetails.roomname;
		currentroom=roomdetails.roomid;
		$('#players').html('');
		$('#restartGame').html('');
		$('#targetOutcome').html('');
		var i=0;
		rank=1;
		console.log(roomdetails);
		$.each(usernames, function(key, value) {
			if(value.roomid==currentroom){
				playerPlaying.push(value);
				if(value.PlayerSocketId!=socket.id){
				    
					$('#players').append('<ul class="col-md-4 col-sm-4 col-xs-6 list-group" style="z-index:0"><li class="list-group-item"><div class="media"><div class="media-left"><img src="'+value.Playerimg+'" class="media-object" ></div><div class="media-body"><h4 class="media-heading">' + value.player + '</h4></div></div></li><li class="list-group-item" id="'+value.PlayerSocketId+'" data-opponant="'+value.player+'" data-opponant-socketId="'+value.PlayerSocketId+'"><div class="'+value.PlayerSocketId+' div1"></div></li></ul>');
					
					$( "#"+value.PlayerSocketId ).droppable({
						  drop: function( event, ui ) {
						  
						   var target = $(event.target);
						   var source = $(ui.draggable);
						   var opponant = target.attr('data-opponant');
						   var opponantsocketId = target.attr('data-opponant-socketId');
						   var imgval=source.attr("data-val");
						   var imgscore=source.attr("data-score");
						   
						   target.find("."+value.PlayerSocketId).removeClass('borderGreen');				
						   target.find("."+value.PlayerSocketId).addClass('borderRed');				
						   $("."+value.PlayerSocketId).html('Please Wait...');
						   source.draggable("disable", 1);
						   target.droppable("disable", 1);
						   requestTo(opponant,opponantsocketId,imgval,imgscore,roomdetails.roomlimit);
						   source.draggable('destroy');
						   source.hide(800,function(){
								$(this).remove();
								setTimeout(
								  function() 
								  {
									getpairs(roomdetails.roomlimit);	
								  }, 200);
							}); 
						  
						  }
						});
					  
				}
				$('#count').text(i);
				i++;
			}
		});
		
			if(i>=roomdetails.roomlimit){
			console.log(roomdetails.status);
				if(roomdetails.status=='pending' || roomdetails.status=='ready'){
					
					$("#currentuser").html("");
					$("#playerneeded").html("");
					$('#targetOutcome').html('<ul class="alert alert-danger"><li class = "list-group-item" style="height:70px;"><span id="strtin" class = "badge"></span>Game is going to start in</li></ul>');
					k=0;
					
				var countdown = $("#strtin").countdown360({
				radius: 20,
				seconds:5,
				label: ['sec', 'secs'],
				fontColor: '#FFFFFF',
				autostart: false,
				onComplete: function () {
					
					socket.emit('gameStarted',{
							roomid:roomdetails.roomid,
							roomname:roomdetails.roomname,
							imgvalue:roomdetails.imgvalue,
							imgscore:roomdetails.imgscore,
							roomlimit:roomdetails.roomlimit,
							roompassword:roomdetails.roompassword,
							status:'started',
							playersocketid:socket.id
					});
					console.log('Game is starting in 10 sec...');
					$('#targetOutcome').html('<div class="alert alert-success" style="font-size:16px">Collect <span class="badge" style="font-size:18px">'+roomdetails.roomlimit+' same pairs</span>&nbsp;<button class="btn btn-xs btn-warning" type="button" data-toggle="modal" data-target=".hint-model">Give me hint</div></div>');
					
				}
				});
				
				countdown.start();	
						
								setTimeout(
									  function() 
									  {
										//$("#CountDownTimer").TimeCircles({ time: { Days: { show: false }, Hours: { show: false } }});
										$("#CountDownTimer").TimeCircles({
											time: { Days: { show: false }, Hours: { show: false } }
											}).addListener(function(unit,value,total) {
												if(total == 0){
													$("#CountDownTimer").TimeCircles().stop();
													socket.emit('displayFinalResult',{
													 roomid:roomdetails.roomid,
													 roomname:roomdetails.roomname,
													 status:'over',
													 playersocketid:socket.id
													});
												}
										});
									  }, 500);
									  
								/*var countdown =  1  * 60 * 1000;
								var timerId = setInterval(function(){
								  countdown -= 1000;
								  var min = Math.floor(countdown / (60 * 1000));
								  //var sec = Math.floor(countdown - (min * 60 * 1000));  // wrong
								  var sec = Math.floor((countdown - (min * 60 * 1000)) / 1000);  //correct

								  if (countdown <= 0) {
									 $("#CountDownTimer").TimeCircles().stop();
									 socket.emit('displayFinalResult',{
										 roomname:roomdetails.roomname,
										 playersocketid:socket.id
										});
									 clearInterval(timerId);
									 //doSomething();
								  } else {
									 $("#countTime").html(min + " : " + sec);
								  }

								}, 1000); //1000ms. = 1sec.	 */ 
					}		  
				}else{
					$("#menuToggler").show(500);
					$("#currentuser").html("");
					if((roomdetails.roomlimit - i)>1){
						//$('#playerneeded').html(+' more players needed to start the game');
						$('#targetOutcome').html('<div class="alert alert-danger" style="font-size:16px"><span class="badge" style="font-size:18px">'+(roomdetails.roomlimit - i)+'</span> more players needed to start the game</div>');
					}else if((roomdetails.roomlimit - i)==1){
						//$('#playerneeded').html('Only '+(roomdetails.roomlimit - i)+' player needed to start the game');
						$('#targetOutcome').html('<div class="alert alert-warning" style="font-size:16px">Only <span class="badge" style="font-size:18px">'+(roomdetails.roomlimit - i)+'</span> more player needed to start the game</div>');
					}else if(($("#count").text())<3){
						$('#targetOutcome').html('<div class="alert alert-danger" style="font-size:16px">It seems that only 2 players are in the Game</div>');
					}
				}
			} );
			
	socket.on('receiveimg', function (username,data) {
	var dragid = new Date().valueOf();
	$('#currentuser').append('<div id="recievedrag-'+dragid+'" data-val="'+data.srcImg+'" data-score="'+data.imgscore+'" class="col-xs-3 col-sm-3 col-md-2 col-lg-2 draggable"  style="z-index:1"><a href="javascript:void(0)" id="'+data.srcImg+'"class="thumbnail text-center"><img  src="/'+data.srcImg+'.jpg"  img-val="'+data.srcImg+'" img-score="'+data.imgscore+'"><span class="badge">'+data.imgscore+'</span></a></div>');
					$('#recievedrag-'+dragid).draggable({
					  revert: 'invalid',
					  cursor:'move'
					})
	
		getpairs(data.roomlimit);
		$("#"+data.srcsocketId).droppable( "option", "disabled", false );		
		
		$("."+data.srcsocketId).addClass('borderGreen');				
		$("."+data.srcsocketId).removeClass('borderRed');
		$("."+data.srcsocketId).html('');
		 
		socket.emit('settimer',{
			srcPlayer : data.srcPlayer,
			trgPlayer : data.trgPlayer,
			opponantsocketId:data.trgsocketId,
			roomlimit:data.roomlimit,
			imgvalue:data.srcImg,
			imgscore:data.imgscore,
			srcsocketid:data.srcsocketId
		});
							  
		//$('#'+data.srcPlayer).html('<img src="swap.jpg" data-val="03" draggable="true" ondragstart="drag(event)" width="69" height="69">');
		/*$.each(data, function(key, value) {
			
			if(value.trgsocketId==socket.id){
				$('#currentuser').after('<img src="/'+value.imgval+'.jpg" data-val="'+value.imgval+'" draggable="true" ondragstart="drag(event)" width="69" height="69">');
				$('#'+value.srcsocketId).html('<img src="swap.jpg" data-val="03" draggable="true" ondragstart="drag(event)" width="69" height="69">');
			//	ischeck 
			}else if(value.srcsocketId==socket.id){
				//$('#currentuser').after('<img src="/'+value.imgval+'.jpg" data-val="'+value.imgval+'" draggable="true" ondragstart="drag(event)" width="69" height="69">');
			}
		});*/ 
	});
	
	socket.on('alertWinner', function (data,playerScorecard,pendingPlayers,currentroomname,currentroomid,currentroomlimit) {
	rank=rank+1;
	var srctag='';
	var playercount = $("#count").text();
	var playerimgcount = data.imgcnt;
	    if(data.rank==1){
		    for(i=1;i<=playerimgcount;i++){
				srctag=srctag+"<img src='/"+data.imgval+".jpg' height=40>";
			}
			$("."+data.srcsocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.playername+" is the <span class='badge'>"+data.rank+"st</span> winner who made following pairs<br>"+srctag+"<br><br><span class='badge'>Earn : "+data.score+" Coins</span></div>");
		}else if(data.rank==2){
			for(i=1;i<=playerimgcount;i++){
			   srctag=srctag+"<img src='/"+data.imgval+".jpg' height=40>";
			}
			$("."+data.srcsocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.playername+" is the <span class='badge'>"+data.rank+"nd</span> winner who made following pairs<br>"+srctag+"<br><br><span class='badge'>Earn : "+data.score+" Coins</span></div>");
		}else if(data.rank==3){
			for(i=1;i<=playerimgcount;i++){
			   srctag=srctag+"<img src='/"+data.imgval+".jpg' height=40>";
			}
			$("."+data.srcsocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.playername+" is the <span class='badge'>"+data.rank+"rd</span> winner who made follwoing pairs<br>"+srctag+"<br><br><span class='badge'>Earn : "+data.score+" Coins</span></div>");
		}else{
			for(i=1;i<=playerimgcount;i++){
			   srctag=srctag+"<img src='/"+data.imgval+".jpg' height=40>";
			}
			$("."+data.srcsocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.playername+" is the <span class='badge'>"+data.rank+"th</span> winner who made follwoing pairs<br>"+srctag+"<br><br><span class='badge'>Earn : "+data.score+" Coins</span></div>");
		}
	   //playerPlaying = pendingPlayers;
			$.each(countdownarr, function(countkey, countval) {
				if(countval.playersocketid==data.srcsocketId){
					if(countval.countdownval){
						countval.countdownval.stop();
						$("."+data.srcsocketId).find("#countdown").remove();
						countdownarr = countdownarr.filter(function(item){ 
							 return (item.playersocketid !== data.srcsocketId); 
						});		
					}									
				}
			});	
				
		if(currentroomlimit==playerimgcount){
			playercount = parseInt(playercount) + 1;
			socket.emit('gameover',data.srcsocketId,pendingPlayers,currentroomname,currentroomid,playercount);
		}
	
		$("#"+data.srcsocketId).droppable("disable", 1);
		$("."+data.srcsocketId).removeClass('borderGreen');
		$("."+data.srcsocketId).addClass('borderRed');
		
	});
	
	
	socket.on('disableplayer', function (pendingPlayers){
		
		$.each(pendingPlayers, function(key, value) {
			
			if(value.PlayerSocketId!=socket.id){
				$("#"+value.PlayerSocketId).droppable("disable", 1);
				$("."+value.PlayerSocketId).removeClass('borderGreen');
				$("."+value.PlayerSocketId).addClass('borderRed');
				
				$.each(countdownarr, function(countkey, countval) {
					if(countval.playersocketid==value.PlayerSocketId){
						if(countval.countdownval){
							countval.countdownval.stop();
							$("."+value.PlayerSocketId).find("#countdown").remove();
							countdownarr = countdownarr.filter(function(item){ 
								 return (item.playersocketid !== value.PlayerSocketId); 
							});		
						}									
					}
				});	
			}
		});
		
	});
	
	socket.on('displayResult', function (data) {
	    $("#displayResult").html('');
		$("#menuToggler").show(500);
		for(var l=0;l < data.length;l++){
			$("#displayResult").append('<div class="media"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="/'+data[l].usercollec_imgval+'.jpg" alt="profile picture" height="80px" ></a></div><div class="media-body"><h4 class="media-heading"><strong>'+data[l].usercollec_username+'</strong></h4><b>&nbsp;<span class="badge">Pairs : '+data[l].usercollec_img_count+'</span>&nbsp;<span class="badge">Score : '+data[l].userscore+'</span></b></div></div>'); 
		}
		
		// playerusername, usercollec_imgval, usercollec_img_count
		/*
		$.each(playerScorecard, function(key, value) {
		    if(value.room==currentroom){
				
				$("#displayResult").append('<div class="media"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="/profile.png" alt="profile picture" height="80px" ></a></div><div class="media-body"><h4 class="media-heading"><strong>'+value.playername+'</strong></h4><b>&nbsp;<span class="badge">Rank : '+value.rank+'</span>&nbsp;<span class="badge">Coins : '+value.score+'</span></b></div></div>');
				
				$("#menuToggler").show(500);
			}
		});
		*/
		
	});
	
	socket.on('writeFinalResult', function (data) {
	    $("#writeFinalResult").html('');
		$('#targetOutcome').html('<div class="alert alert-danger" style="font-size:16px">Game  Over !!!<button id="leaveRoom" class="btn btn-primary pull-right">Leave The Room</button></div>');
		$(".swiper-container").hide(500);
		$("#getAllpairs").hide(500);
		$("#menuToggler").hide(500);
		$("#restartGame").hide(500);
		
		var str3='';
		var str4='';
		if(data.length){
		for(var l=0;l < data.length;l++){
		    str3='';
			str4='';
			var str1 = data[l].usercollec_imgval;
			var imgval = new Array();
			imgval = str1.split(",");
			
			var str2 = data[l].usercollec_img_count;
			var imgcnt = new Array();
			imgcnt = str2.split(",");
			
			var str5= data[l].userscore;
			var imgscore = new Array();
			imgscore = str5.split(",");
			
			str3 = '<div class="col-md-4"><div class="panel panel-default"><div class="panel-heading"><h4><img src="'+data[l].userimg+'" width="50px">&nbsp;'+data[l].usercollec_username+'&nbsp;<span class="badge">Total Coins: '+data[l].usertotalscore+'</span></h4></div><div class="panel-body"><ul class="list-group">';
			
			for(var m=0;m<imgval.length;m++){
				str4 = str4 + '<li class="list-group-item"><div class="media"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="/'+imgval[m]+'.jpg" alt="profile picture" height="40px" ></a></div><div class="media-body"><b>&nbsp;<span class="badge">Pairs : '+imgcnt[m]+'</span>&nbsp;<span class="badge">Coins : '+imgscore[m]+'</span></b></div></div></li>';
			}
			str3 = str3+str4+'<ul></div></div></div>';
			
			$("#writeFinalResult").append(str3);
		}
		/*$.each(playerScorecard, function(key, value) {
		    if(value.room==currentroom){
				
				$("#writeFinalResult").append('<div class="media"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="/profile.png" alt="profile picture" height="80px" ></a></div><div class="media-body"><h4 class="media-heading"><strong>'+value.playername+'</strong></h4><b>&nbsp;<span class="badge">Rank : '+value.rank+'</span>&nbsp;<span class="badge">Coins : '+value.score+'</span></b></div></div>');
				
				$("#menuToggler").show(500);
			}
		});*/
		}else{
			$("#writeFinalResult").append('<div class="alert alert-danger">Sorry :( No one is able to make any pairs!!!</div>');
		}
	});
	
	
	socket.on('recreateroom',function(room){
		var str = room.imgvalue;
		var imgvalue = new Array();
		imgvalue = str.split(",");
		console.log('Client Imgvalue '+imgvalue);
		
		var str1 = room.imgscore;
		var imgscore = new Array();
		imgscore = str1.split(",");
		console.log('Client Imgscore '+imgscore);
		
		var roompass='';
		if(room.roompassword){
		 roompass=room.roompassword;
		}else{ 
		 roompass='na';
		}
		 $('#restartGame').html('<span><a href="javascript:void(0)" class="btn btn-sm btn-primary" onclick="restartGame(\''+room.roomid+'\',\''+room.roomname+'\',\''+room.roomlimit+'\',\''+roompass+'\',\''+imgvalue+'\',\''+imgscore+'\',\''+room.status+'\')">Restart The Game</a></span>').delay( 2000 ).fadeIn( 400 );
	
	});
	
	socket.on('updaterooms', function (rooms) {
		$('#rooms').html('');
		$.each(rooms, function(key, room) {
			if(room.roomname!='Quick Play' && room.status!='started'){
				var str = room.imgvalue;
				var imgvalue = new Array();
				imgvalue = str.split(",");
				console.log('Client Imgvalue: '+imgvalue);
				
				var str1 = room.imgscore;
				var imgscore = new Array();
				imgscore = str1.split(",");
				console.log('Client Imgscore: '+imgscore);
				
				var roompass='';
				if(room.roompassword){
				 roompass=room.roompassword;
				}else{
				 roompass='na';
				}
				 $('#rooms').append('<li class="list-group-item"><span class="badge">Player Limit : '+room.roomlimit+'</span><b>'+room.roomname+'</b>&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:void(0)" class="btn btn-sm btn-primary" onclick="switchRoom(\''+room.roomid+'\',\''+room.roomname+'\',\''+room.roomlimit+'\',\''+roompass+'\',\''+imgvalue+'\',\''+imgscore+'\',\''+room.status+'\')">click here to join</a></li>');
			}	
		});
	});

	function switchRoom(id,name,playerslimit,pass,imgvalue,imgscore,status){
		socket.emit('switchRoom', {
		roomid:id,
		roomname:name,
		roomlimit:playerslimit,
		roompassword:pass,
		imgvalue : imgvalue,
		imgscore : imgscore,
		status : status,
		Playerusername : playername, 
		Playerimg : playerimg, 
		pairmania_id : pairmania_userid,
		PlayerSocketId : socket.id
		});
	}
	
	function restartGame(id,name,playerslimit,pass,imgvalue,imgscore,status){
		socket.emit('restartGame', {
		roomid:id,
		roomname:name,
		roomlimit:playerslimit,
		roompassword:pass,
		imgvalue : imgvalue,
		imgscore : imgscore,
		status : status,
		Playerusername : playername,
		Playerimg : playerimg,		
		pairmania_id : pairmania_userid,
		PlayerSocketId : socket.id
		});
		
		$.each(countdownarr, function(countkey, countval) {
			if(countval.playersocketid==value.PlayerSocketId){
				if(countval.countdownval){
					countval.countdownval.stop();
					$("."+value.PlayerSocketId).find("#countdown").remove();
					countdownarr = countdownarr.filter(function(item){ 
						 return (item.playersocketid !== value.PlayerSocketId); 
					});		
				}									
			}
		});	
		
	}
	
	function joinRoom(roomid,roomname){
		socket.emit('joinRoom', {
			roomid:roomid,
			roomname:roomname,
			Playerusername : playername,
			Playerimg : playerimg,
			pairmania_id : pairmania_userid,
			PlayerSocketId : socket.id
		});
	}
	
	function invitePlayer(receiver){
		socket.emit('sendInvitation', {
			receiver:receiver,
			roomid:currentroom,
			roomname:currentroomname,
			sender : socket.id,
			sendername : playername,
			senderimg:playerimg
		});
	}
	
	socket.on('showgamearea', function () {
		$("#gamearea").removeClass('hidepannel');
		$("#homearea").addClass('hidepannel');
	});
	
	socket.on('receiveInvitation', function (data) {
	    var password='na';
		$('#invitations').append('<li class="list-group-item"><strong>'+data.sendername+' has invited to join '+ data.roomname+'</strong>&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:void(0)" class="btn btn-sm btn-primary" onclick="joinRoom(\''+data.roomid+'\',\''+data.roomname+'\')">click here to join</a></li>');
	});
    
	socket.on('receivebattleInvitation', function (data) {
		$('#invitations').append('<li class="list-group-item">'+data.sendername+' wants to battle with you. Click on the <strong>Play Battle</strong> button to start the battle</li>');
	});
	
	socket.on('sendImg', function (data) {
		$('#currentuser').html('');
		$('#pairmania-hint').html('');
		$("#menuToggler").hide(500);
		closeNav();
		
		var str = data.imgvalue;
		var str1 = data.imgscore;
		console.log('Client Imgvalue ->'+str);
		console.log('Client Imgscore ->'+str1);
		var imgvalue = new Array();
		var imgscore = new Array();
		imgvalue = str.split(",");
		imgscore = str1.split(",");
		console.log('Client Imgvalue'+imgvalue);
		
		//var imgvalue=['1','2','3','4','2','4','4','3','2','1','2','4','1','3','3','2'];
		// on connection to server, ask for user's name with an anonymous callback	
		for(var i=0;i<imgvalue.length;i++){
			$('#currentuser').append('<div id="drag-'+imgvalue[i]+'" data-val="'+imgvalue[i]+'" data-score="'+imgscore[i]+'" class="col-xs-3 col-sm-3 col-md-2 col-lg-2 draggable"  style="z-index:1"><a href="javascript:void(0)" class="thumbnail text-center"><img  src="/'+imgvalue[i]+'.jpg" img-val="'+imgvalue[i]+'" img-score="'+imgscore[i]+'"><span class="badge">'+imgscore[i]+'</span></a></div>');
			$('#drag-'+imgvalue[i]).draggable({
				  revert: 'invalid',
				  cursor:'move'
				})
			var hintpair='';
			var coin = (imgscore[i])*(data.roomlimit);
            for(var j=1;j<=data.roomlimit;j++){
				hintpair=hintpair+'<div class="col-md-2 col-sm-2 col-xs-2" ><img  src="/'+imgvalue[i]+'.jpg" class="thumbnail" style="height:10%;"></div>';
			}
			$('#pairmania-hint').append('<div href="#" class="list-group-item row" style="height:auto !important"><h4 class="list-group-item-heading">If you are making this pairs then you will get&nbsp;<span class="badge">'+coin+' COINS</span></h4><p class="list-group-item-text">'+hintpair+'</p></div>');
					
		}
	});
	
	// on load of page
	$(function(){
		// when the client clicks SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			// tell server to execute 'sendchat' and send along one parameter
			if(message){
				socket.emit('sendchat', message);
			}
		});

		// when the client hits ENTER on their keyboard
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});
		
		// creating rooms
		$('#roombutton').click(function(){
			var roomid = new Date().valueOf();
			roomid= roomid*(Math.round(Math.random()*100) + 1); 
			var name = $('#roomname').val();
			var roomlimit = $('#roomlimit').val();
			var roompassword = '';
			if(name!="" && roomlimit!=""){
			$(this).closest('.input-group').hide(500);
			$('#roomname').val('');
			 
			socket.emit('create',{
				roomid:roomid,
				roomname:name,
				roomlimit:roomlimit,
				roompassword: roompassword
			}
			)
			}else{
			 alert('Please enter the ROOM NAME and select the PLAYER LIMIT !!!');
			}
		});
	});
	
	function requestToanother(opponant,opponantsocketId,imgval,imgscore,roomlimit){
	    
		socket.emit('sendimg', {
			trgPlayer:opponant,
			srcPlayer:playername,
			srcImg:imgval,
			imgscore:imgscore,
			trgsocketId:opponantsocketId,
			roomlimit:roomlimit,
			srcsocketId:socket.id
		});
	}
	
	function requestTo(opponant,opponantsocketId,imgval,imgscore,roomlimit){
	    
		socket.emit('sendimg', {
			trgPlayer:opponant,
			srcPlayer:playername,
			srcImg:imgval,
			imgscore:imgscore,
			trgsocketId:opponantsocketId,
			roomlimit:roomlimit,
			srcsocketId:socket.id
		});
		
		$.each(countdownarr, function(countkey, countval) {
					if(countval.playersocketid==opponantsocketId){
						if(countval.countdownval){
							countval.countdownval.stop();
							$("."+opponantsocketId).find("#countdown").remove();
							countdownarr = countdownarr.filter(function(item){ 
								 return (item.playersocketid !== opponantsocketId); 
							});		
						}									
					}
				});		
	}
		
	socket.on('gettimer',function(data){
	    var match = 0;
		var matchval=0;
		var newval = 0;	
		var oldval = 0;
		var targetattr = data.srcsocketid;
		
		var arraysOfIds = $('#getAllpairs img').map(function(){
                       return $(this).attr('img-val');
                   }).get();

				   
	    //alert(arraysOfIds.length+" - "+data.roomlimit+" - "+targetattr);
		if(arraysOfIds.length > data.roomlimit){
				$("."+targetattr).html('<div id="countdown"></div>');
			    
			countdown = $("."+targetattr).find("#countdown").countdown360({
				radius: 25,
				seconds:8,
				label: ['sec', 'secs'],
				fontColor: '#FFFFFF',
				autostart: false,
				onComplete: function () {
					requestTo(data.srcPlayer,targetattr,data.imgvalue,data.imgscore,data.roomlimit);
				    $("#"+data.imgvalue).parent('.draggable').remove();
					console.log('done');
				}
				});
				countdown.start();
				var countval = {
								playersocketid:targetattr,
								countdownval:countdown
								}
				countdownarr.push(countval);
			/*for(var i=0;i<arraysOfIds.length;i++){					
					 newval=arraysOfIds[i];
					
					if(i==0){
						oldval = newval;
					}else{
						if(oldval == newval){
							match=1;
							imgcnt=imgcnt+1;
							matchval=oldval;
					}
				}				
			} 	*/

				/*
				if(data.tm != 0){
				   countdown.start();	
				 }else{
					
					$("#"+targetattr).find('#countdown').remove();
					countdown.stop();
				 }*/
		}
	});

	$(document).on("click","#view_my_pairs",function(e){
		var pairmania_userid = $('#pairmania_userid').attr('value');
		socket.emit('getmypairs', {
			pairmania_id:pairmania_userid
		});
	});
	
	socket.on('showmypairs',function (data){
		for(var i=0;i<data.length;i++){
			$("#showmypairs").append('<div class="col-xs-6 col-sm-3 col-md-3"><div class="thumbnail"><img src="/'+data[i].usercollec_imgval+'.jpg" alt="pairs"><div class="caption"><h4>&nbsp;<span class="badge">PAIRS : '+data[i].usercollec_img_count+'</span></h4><h4>&nbsp;<span class="badge">COINS : '+data[i].usercollec_user_score+'</span></h4></div></div></div>');
		}
	});
	
	socket.on('startquickreplay', function(data) {
			socket.emit('quickreplay',{
				quickplaycount:data.quickplaycount,
				PlayerSocketId : socket.id
			})
	});
	
	socket.on('playagain', function(data) {
		$('.'+data.PlayerSocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.Playerusername+" is ready to play</div>");	
	});

	$(document).on("click","#quickplay",function(e){			
		socket.emit('quickplay',
		{
			PlayerSocketId : socket.id
		});				
	});
		
	$(document).on("click","#restartGame",function(e){	
		$('#paircomplete-alert').html('');	
		$('#restartGame').hide(200);	
	});
	
	$(document).on("click","#leaveRoom",function(e){
		var mydetails = playerPlaying.filter(function(item){ 
			return (item.PlayerSocketId == socket.id); 
		});
		playerPlaying = playerPlaying.filter(function(item){ 
			return (item.PlayerSocketId == socket.id); 
		});
		$('#gamearea').addClass('hidepannel');	
		$('#homearea').removeClass('hidepannel');	
		socket.emit('leaveRoom',mydetails[0]);	
		$("#writeFinalResult").html('');
		$(".swiper-container").show(500);
		$("#getAllpairs").show(500);
		$("#menuToggler").show(500);
		$("#restartGame").show(500);
		$("#CountDownTimer").TimeCircles().destroy();
		$("#CountDownTimer").html('');
		$("#conversation").html('');
	});	
