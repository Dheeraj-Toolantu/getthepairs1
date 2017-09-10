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
	var mydetails = {};
	var battleplayers = [];
	var mybattleimgs =[];
	var opponantbattleimgs =[];
	var opponantbattleimg={};
	var mybattleimg={};
	
	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('updatechat', function (username, data) {
		$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
	});
	
	socket.on('showplayercount',function(playerCount){
		$('#allcount').html(playerCount.length);
	});
	socket.on('onlinebattleplayers', function(onlinebattleplayers) {
		$('#onlinebattleplayers').html('');
		var i=0;
		$.each(onlinebattleplayers, function(key, value) {
			
				if(value.pairmania_id!=pairmania_userid){
					$('#onlinebattleplayers').append('<div class="media" style="padding:5px"><div class="media-left"><a href="javascript:void(0)"><img class="media-object" src="'+value.Playerimg+'" alt="profile picture" height="60px" ></a></div><div class="media-body"><h4><strong>'+value.player+'</strong></h4><b>&nbsp;<button class="btn btn-xs btn-primary" onclick="invitePlayer(\''+value.PlayerSocketId+'\')">Invite</button></b></div></div>');
				}
			});	
		})	
	
	// listener, whenever the server emits 'updaterooms', this updates the room the client is in
	socket.on('updateplayers', function(usernames,roomdetails) {
		opponantsocketId=0;
	    currentroomname=roomdetails.roomname;
		currentroom=roomdetails.roomid;
		$('#players').html('');
		$('#battleplayers').html('');
		$('#restartGame').html('');
		$('#targetOutcome').html('');
		var i=0;
		rank=1;
		console.log(roomdetails+'....'+ currentroom);
		$.each(usernames, function(key, value) {
			var opponantdetails={};
			if(value.roomid==currentroom){
				playerPlaying.push(value);
				if(value.PlayerSocketId!=socket.id){
				    opponantsocketId=value.PlayerSocketId;
					opponantdetails = {
							Playerusername : value.Playerusername, 
							Playerimg : value.Playerimg, 
							pairmania_id : value.pairmania_id,
							PlayerSocketId : value.PlayerSocketId,
							imgvalue : value.imgvalue,
							imgscore : value.imgscore,
							imgpaircnt : value.imgpaircnt,
							status:'started',
							roomid : value.roomid,
							roomname : value.roomname,
							roomlimit:roomdetails.roomlimit,
							roompassword:roomdetails.roompassword
						};
						
					battleplayers.push(opponantdetails);
					$('#players').append('<div class="col-md-6 col-sm-8 col-xs-8"><div class="media"><div class="media-left"><img src="'+value.Playerimg+'" class="media-object"></div><div class="media-body"><h4 class="media-heading">' + value.Playerusername + ' </h4><div  id="'+value.PlayerSocketId+'" data-opponant="'+value.Playerusername+'" data-opponant-socketId="'+value.PlayerSocketId+'"><div class="'+value.PlayerSocketId+' div1"></div></div></div></div></div>');
					$('#battleplayers').append('<div class="col-md-12" style="margin:10px;"><div class="media"><div class="media-left"><img src="'+value.Playerimg+'" class="media-object thumbnail"></div><div class="media-body"><h4 class="media-heading">' + value.Playerusername + ' </h4><div id="oppbattle"></div></div></div></div>');
					$( "#"+value.PlayerSocketId ).droppable({
						  drop: function( event, ui ) {
						   var target = $(event.target);
						   var source = $(ui.draggable);
						   var opponant = target.attr('data-opponant');
						   opponantsocketId = target.attr('data-opponant-socketId');
						   var imgval=source.attr("data-val");
						   var imgscore=source.attr("data-score");
						   var imgpaircnt = source.attr("data-pair");
						   target.find("."+value.PlayerSocketId).removeClass('borderGreen');				
						   target.find("."+value.PlayerSocketId).addClass('borderRed');				
						   $("."+value.PlayerSocketId).html('Please Wait...');
						   source.draggable("disable", 1);
						   target.droppable("disable", 1);
						   requestTo(opponant,opponantsocketId,imgval,imgscore,imgpaircnt,roomdetails);
						   source.draggable('destroy');
						    
						    source.hide(800,function(){
								$(this).remove();
								$('#oppbattle').find('.blurimage').removeClass('blurimage');
						    }); 
						
						$('#mybattle').append('<div class="col-xs-1 col-sm-1 col-md-1 col-lg-1"><a href="javascript:void(0)" class="thumbnail text-center" style="width:80px;height:100px"><img  src="/'+imgval+'.jpg"  img-val="'+imgval+'" width="80" height="100"><span class="badge" style="background-color:#3079AB;margin:1px;">'+imgscore+'</span></a></div>');
		
						mybattleimg={
							PlayerSocketId : socket.id,
							roomid:currentroom,
							imgvalue:imgval,
							imgscore:imgscore,
							imgpaircnt:imgpaircnt
						}
						
						mybattleimgs.push(mybattleimg);
						
						}
					});
					  
				}else if(value.PlayerSocketId==socket.id){
					
					mydetails = {
						Playerusername : value.Playerusername, 
						Playerimg : value.Playerimg, 
						pairmania_id : value.pairmania_id,
						PlayerSocketId : value.PlayerSocketId,
						imgvalue : value.imgvalue,
						imgscore : value.imgscore,
						imgpaircnt : value.imgpaircnt,
						status:'started',
						roomid : value.roomid,
						roomname : value.roomname,
						roomlimit:roomdetails.roomlimit,
						roompassword:roomdetails.roompassword
					};
					
					battleplayers.push(mydetails);
					$('#battleplayers').append('<div class="col-md-12" style="margin:10px;"><div class="media"><div class="media-left"><img src="'+value.Playerimg+'" class="media-object thumbnail" style="width:60px"></div><div class="media-body"><h4 class="media-heading">' + value.Playerusername + ' </h4><div id="mybattle"></div></div></div></div>');
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
					$('.'+opponantsocketId).html('<ul class="text-center alert alert-danger">Game is going to start in  <br/><div id="strtin" class = "badge"></div></ul>');
					k=0;
					
				var countdown = $("#strtin").countdown360({
					radius: 20,
					seconds:5,
					label: ['sec', 'secs'],
					fontColor: '#FFFFFF',
					autostart: false,
					onComplete: function () {
					
						$.each(battleplayers, function(key, battleplayer) {
							if(battleplayer.roomid==roomdetails.roomid){
								
								socket.emit('battleStarted',battleplayer);
								//battleplayers.splice(key, 1);
								
							}
						});
							
						console.log('Battle is starting in 10 sec...');
						$('#targetOutcome').html('<div class="alert alert-success" style="font-size:16px">Battle has been started. Please drag your collected image and put into BATTLE AREA.</div>').delay( 10000 ).hide( 500 );;
					    $('.'+opponantsocketId).html('<div class="text-center" style="font-size:20px;width:100%;height:100%;padding-top:20px;color:#3c763d">BATTLE AREA</div>');
					} 
				});
				
				countdown.start();	
					setTimeout(
					  function() 
					  {
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
					}		  
				}else{
					$("#menuToggler").show(500);
					$("#currentuser").html("");
					if((roomdetails.roomlimit - i)>1){
						
						$('#targetOutcome').html('<div class="alert alert-danger" style="font-size:16px"><span class="badge" style="font-size:18px">'+(roomdetails.roomlimit - i)+'</span> more players needed to start the battle</div>');
					}else if((roomdetails.roomlimit - i)==1){
						
						$('#targetOutcome').html('<div class="alert alert-warning" style="font-size:16px">Only <span class="badge" style="font-size:18px">'+(roomdetails.roomlimit - i)+'</span> more player needed to start the battle</div>');
					}else if(($("#count").text())<3){
						$('#targetOutcome').html('<div class="alert alert-danger" style="font-size:16px">It seems that only 2 players are in the Game</div>');
					}
				}
			} );
			
	socket.on('receiveimg', function (username,data) {
		var dragid = new Date().valueOf();
		
		$('#oppbattle').append('<div class="col-xs-1 col-sm-1 col-md-1 col-lg-1"><a href="javascript:void(0)" id="'+data.srcImg+'"class="blurimage thumbnail text-center" style="width:80px;height:100px"><img  src="/'+data.srcImg+'.jpg"  img-val="'+data.srcImg+'" width="80" height="100"><span class="badge" style="background-color:#4CAF50;margin:1px;">'+data.imgscore+'</span></a></div>');
								
		opponantbattleimg={
			PlayerSocketId : data.srcsocketId,
			roomid:data.roomid,
			imgvalue:data.srcImg,
			imgscore:data.imgscore,
			imgpaircnt:data.imgpaircnt
		}
		
		opponantbattleimgs.push(opponantbattleimg);
		getbattlewinner(mybattleimgs,opponantbattleimgs);
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
			imgpaircnt:data.imgpaircnt,
			srcsocketid:data.srcsocketId
		});
		
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
	
	
	socket.on('disableplayer', function (PlayerSocketId){
		
		if(PlayerSocketId!=socket.id){
			$("#"+PlayerSocketId).droppable("disable", 1);
			$("."+PlayerSocketId).removeClass('borderGreen');
			$("."+PlayerSocketId).addClass('borderRed');
			
			$.each(countdownarr, function(countkey, countval) {
				if(countval.playersocketid==PlayerSocketId){
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
	    $(".swiper-container").hide(500);
		$("#getAllpairs").hide(500);
		$("#menuToggler").hide(500);
		$("#restartGame").hide(500);
		
		var str3='';
		var str4='';
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
			
			str3 = '<div class="col-md-4"><div class="panel panel-default"><div class="panel-heading"><h4><img src="'+playerimg+'" width="50px">&nbsp;'+data[l].usercollec_username+'&nbsp;<span class="badge">Total Coins: '+data[l].usertotalscore+'</span></h4></div><div class="panel-body"><ul class="list-group">';
			
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
	
	function invitePlayer(receiver){
		socket.emit('sendbattleInvitation', {
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
		$('#invitations').append('<li class="list-group-item"><b>'+data.sendername+' has invited to join '+ data.roomname+'</b>&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:void(0)" class="btn btn-sm btn-primary" onclick="joinbattleRoom(\''+data.roomid+'\',\''+data.roomname+'\')">click here to join</a></li>');
	});

	socket.on('sendbattleImg', function (data) {
		$('#currentuser').html('');
		$("#menuToggler").hide(500);
		closeNav();
		var dragid=0;
		var str = data.imgvalue;
		var str1 = data.imgscore;
		var str2 = data.imgpaircnt;
		var imgvalue = new Array();
		var imgscore = new Array();
		var imgpaircnt = new Array();
		imgvalue = str.split(",");
		imgscore = str1.split(",");
		imgpaircnt = str2.split(",");
		//var imgvalue=['1','2','3','4','2','4','4','3','2','1','2','4','1','3','3','2'];
		// on connection to server, ask for user's name with an anonymous callback	
		for(var i=0;i<imgvalue.length;i++){
			dragid = (new Date().valueOf())*imgvalue[i];
			$('#currentuser').append('<div id="drag-'+dragid+'" data-val="'+imgvalue[i]+'" data-score="'+imgscore[i]+'" data-pair="'+imgpaircnt[i]+'" class="col-xs-3 col-sm-3 col-md-2 col-lg-2 draggable"><a href="javascript:void(0)" class="thumbnail text-center" style="width:180px;height:250px"><img  src="/'+imgvalue[i]+'.jpg" img-val="'+imgvalue[i]+'" width="180" height="250"><span class="badge">Score: '+imgscore[i]+'</span></a></div>');
			$('#drag-'+dragid).draggable({
				  revert: 'invalid',
				  cursor:'move'
				})
		}
	});
	
	// on load of page
	$(function(){
		// when the client clicks SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			// tell server to execute 'sendchat' and send along one parameter
			socket.emit('sendchat', message);
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
	
	function requestTo(opponant,opponantsocketId,imgval,imgscore,imgpaircnt,room){
	    
		socket.emit('sendimg', {
			trgPlayer:opponant,
			srcPlayer:playername,
			srcImg:imgval,
			imgscore:imgscore,
			imgpaircnt:imgpaircnt,
			trgsocketId:opponantsocketId,
			roomlimit:room.roomlimit,
			roomid:room.roomid,
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
	    
		if(arraysOfIds.length > data.roomlimit){
			
			$("."+targetattr).html('<div id="countdown"></div>');
			    
			countdown = $("."+targetattr).find("#countdown").countdown360({
				radius: 25,
				seconds:20,
				label: ['sec', 'secs'],
				fontColor: '#FFFFFF',
				autostart: false,
				onComplete: function () {
					//requestTo(data.srcPlayer,targetattr,data.imgvalue,data.imgscore,data.roomlimit);
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
	
	socket.on('startbattlereplay', function(data) {
			socket.emit('battlereplay',{
				battleplaycount:data.battleplaycount,
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
		$('#restartGame').hide(200);	
	});
	
	socket.on('showbattlewinner', function(winnerdata,loserdata) {
		$('#targetOutcome').show(500);
		$.each(countdownarr, function(countkey, countval) {
				if(countval.playersocketid==winnerdata.PlayerSocketId){
					if(countval.countdownval){
						countval.countdownval.stop();
						$("."+data.srcsocketId).find("#countdown").remove();
						countdownarr = countdownarr.filter(function(item){ 
							 return (item.playersocketid !== winnerdata.PlayerSocketId); 
						});		
					}									
				}
			});	
			
		$.each(countdownarr, function(countkey, countval) {
				if(countval.playersocketid==loserdata.PlayerSocketId){
					if(countval.countdownval){
						countval.countdownval.stop();
						$("."+data.srcsocketId).find("#countdown").remove();
						countdownarr = countdownarr.filter(function(item){ 
							 return (item.playersocketid !== loserdata.PlayerSocketId); 
						});		
					}									
				}
			});		
		
		console.log('winner is '+winnerdata.Playerusername)
		if(winnerdata.PlayerSocketId!=socket.id){
			$('#targetOutcome').html('<div class="alert alert-success" style="font-size:16px">'+winnerdata.Playerusername+' has won the battle.&nbsp;<span id="restartbattle" style="padding-top:5px;"></span></div>');
		}else if(winnerdata.PlayerSocketId==socket.id){
			$('#targetOutcome').html('<div class="alert alert-success" style="font-size:16px">You have won the battle.&nbsp;<span id="restartbattle" style="padding-top:5px;"></span></div>');
		}else if(loserdata.PlayerSocketId==socket.id){
			$('#targetOutcome').html('<div class="alert alert-success" style="font-size:16px">You have lost the battle.&nbsp;<span id="restartbattle" style="padding-top:5px;"></span></div>');
		}
		console.log('loser is '+loserdata.Playerusername)
		setTimeout(
				  function() 
				  {
		$("."+winnerdata.PlayerSocketId).html("<div class='alert alert-success' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+winnerdata.Playerusername+" has won the battle</div>");
		$("."+loserdata.PlayerSocketId).html("<div class='alert alert-danger' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+loserdata.Playerusername+" has lost the battle</div>");
		
		},900);
	});
	
	socket.on('recreatebattleroom',function(data){
		console.log('recreatebattleroom----'+data.roomid);
		$('#restartbattle').html('<span><a href="javascript:void(0)" class="btn btn-sm btn-primary" onclick="restartbattle(\''+data.PlayerSocketId+'\',\''+data.pairmania_id+'\',\''+data.roomid+'\')">Restart The Battle</a></span>').delay( 2000 ).fadeIn( 400 );
	});
	
	function restartbattle(socketid,pairmaniaid,roomid){
		
	    $('#conversation').html('');		
		socket.emit('rejoinbattle',
		{
			PlayerSocketId : socketid,
			pairmania_id :pairmaniaid,
			roomid : roomid
		});
	}
	
	socket.on('showbattleloser', function(data) {
		console.log('Loser is '+data.Playerusername)
		$("."+data.PlayerSocketId).html("<div class='alert alert-danger' role='alert'><span class='glyphicon glyphicon-king' aria-hidden='true'></span>&nbsp;"+data.Playerusername+" has lost the battle</div>");
	});
	
	function getbattlewinner(mybattleimgs,opponantbattleimgs){
		   
		var oldval=0;
		var match=0;
		var imgcnt =1;
		var len1 = (mybattleimgs.length)-1;
		var len2 = (opponantbattleimgs.length)-1;
		var len =0;
		if(len1==len2){
			$('#oppbattle').find('.blurimage').removeClass('blurimage');
			len = len1;
			if(mybattleimgs[len].imgvalue == opponantbattleimgs[len].imgvalue){
				
				if(parseInt(mybattleimgs[len].imgscore) > parseInt(opponantbattleimgs[len].imgscore)){
					
					var winner = battleplayers.filter(function(item){ 
				
						 return (item.PlayerSocketId == mybattleimgs[len].PlayerSocketId); 
					});
					
					var loser = battleplayers.filter(function(item){ 
				 
						 return (item.PlayerSocketId == opponantbattleimgs[len].PlayerSocketId); 
					});
					
					console.log('winner image score-->'+mybattleimgs[len].imgscore);
					console.log('loser image score-->'+opponantbattleimgs[len].imgscore);
					console.log('loser image count-->'+opponantbattleimgs[len].imgpaircnt);
					
					socket.emit('battlewinner', {
						winner:winner[0],
						loser:loser[0],
						winnerimgcol:mybattleimgs,
						loserimgcol:opponantbattleimgs,
						status:'win',
						playertype:'me'
					});
					
				}else if(parseInt(mybattleimgs[len].imgscore) < parseInt(opponantbattleimgs[len].imgscore)){
					
					var winner = battleplayers.filter(function(item){ 
						 return (item.PlayerSocketId == opponantbattleimgs[len].PlayerSocketId); 
					});
					
					var loser = battleplayers.filter(function(item){ 
						 return (item.PlayerSocketId == mybattleimgs[len].PlayerSocketId); 
					});
					
					console.log('loser image score-->'+mybattleimgs[len].imgscore);
					console.log('winner image score-->'+opponantbattleimgs[len].imgscore);
					console.log('loser image count-->'+opponantbattleimgs[len].imgpaircnt);
					
					socket.emit('battlewinner', {
						winner:winner[0],
						loser:loser[0],
						winnerimgcol:opponantbattleimgs,
						loserimgcol:mybattleimgs,
						status:'win',
						playertype:'opp'
					});
					
				}else if(mybattleimgs[len].imgscore == opponantbattleimgs[len].imgscore){
					
					socket.emit('battlewinner', {
						status:'tie'
					});
					
					console.log('Tie');
				}						
			}
		}
	}