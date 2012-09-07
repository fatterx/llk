/*
 *	author:fatter;
 *	E-mail:lwn888@gmail.com
 *	Date:2011.12.23
 *	Update:2012.8.30
 *	
 *	2012.8.30 22:00 增加了动画
 *	2012.8.30 15:00 增加了cookie操作，用来保存用户记录
 *	2012.8.30 10:00 增加了资源加载界面
 *	2012.9.1  10:00 修改了地图连接规则
 */

		var $ = function(id){
				return document.getElementById(id);
			},

			addEventListener = function(elem,type,handler){
				if(elem.nodeType && (elem.nodeType === 1 || elem.nodeType === 9)){
					if(elem.addEventListener){
						elem.addEventListener(type,handler,false);
					} else if(elem.attachEvent){
						elem.attachEvent("on"+type,handler);
					} else {
						elem["on"+type] = handler;
					}
				}
			},

			LLK = function(){
				if(!(this instanceof arguments.callee)){
					return new LLK();
				}
				this.map_width = 12;	//10*8
				this.map_height = 10;
				this.hintTimes = 3;
				this.disorderTimes = 3;
				this.imgsType = 10;
				this.records = 1;
				this.loading();
			},
			
			t;

		LLK.prototype = {
			loading:function(){
				var	imgQueue = ['toolsBackground.png','trophy.png','zombieNote.png','zombiesWon.png','buttons.png','pvz.png','background.jpg','background1.jpg'];
					this.loadImg(imgQueue);
					this.checkLoaded();
			},
			init:function(){
				var llk_wrap$ = $("llk_wrap"),
					loading$ = $("loading"),
					canvas$ = $("canvas"),
					ctx = canvas$.getContext("2d"),
					player$ = $("player_name"),
					records$ = $("player_records"),
					player, records;
				
				this.mapArray=[];
				this.points = [];
				this.isGameBegin=false;
				this.timeLimit = 250;
				this.lastX=null;
				this.lastY=null;
				this.leftPairs = ((this.map_height-2) * (this.map_width-2)) /2;
				this.ctx = ctx;
				this.isGod = false;
				!this.eventBound && this.eventBind();
				
				player = this.getCookie("name");
				records = this.getCookie("records");
				player &&  (player$.innerHTML = player);
				records && (records$.innerHTML = records);
				loading$.style.display = "none";
//				this.fadeOut(loading$);
				this.fadeIn(llk_wrap$);
				//llk_wrap$.style.display = "block";	

			},
			loadImg:function(queue){
				var img = new Image(),
					self = this,
					percentage$ = $("percentage"),
					src, percentage;
		
				if(queue.length > 0){
					src = queue.shift();
					if(src === "pvz.png"){
						this.img = img;
					}
					img.src = "images/"+src;
					img.onload = function(){
						percentage = (8 - queue.length) / 8;
						percentage$.innerHTML = percentage.toFixed(2) * 100 + "%";
						if(queue.length > 0){
							self.loadImg(queue);
						} else {
							self.isLoaded = true;
							return true;
						}
					}
				}
			},
			checkLoaded:function(){
				var self = this;
				
				if(!self.isLoaded){
					setTimeout(function(){
						self.checkLoaded();
					},30);
				} else {
					self.init();
				}
			},
			creatMap:function(){
				var k =1;
				this.mapArray = []; //清空地图
				for(var i=0; i<this.map_height; ++i){
					this.mapArray.push([]);
					for(var j=0; j<this.map_width;){
						if(j === 0 || j === this.map_width-1 || i === 0 || i === this.map_height-1){
							this.mapArray[i].push(0);
							++j;
						} else {
							this.mapArray[i].push(k);
							++j;
							this.mapArray[i].push(k);
							++k;
							++j;
							if(k > this.imgsType)
								k=1;
						}
					}
				}
				return this;
			},
			drawMap:function(){
				var x = 0, y = 0;
			
				this.ctx.save();
				this.ctx.clearRect(0,0,720,600);
				for(var i=0; i<this.map_height; ++i){
					for(var j=0; j<this.map_width; ++j){
						this.drawImg(this.mapArray[i][j],x,y);
						x = x<660 ? x+60 : 0;
					}
					y = y<540 ? y+60 : 0;
				}
				this.ctx.restore();
				return this;
			},
			drawImg:function(idx,x,y){
				var sw = 60, sh = 60, dw = 55, dh = 55,
					ctx = this.ctx;
				var idx = idx-1;
				if(idx >= 0){
					ctx.fillStyle = "#ffece9";	//填充背景
					ctx.fillRect(x,y,60,60);
					ctx.drawImage(this.img,idx*60,0,sw,sh,x,y,dw,dh);
					ctx.lineWidth = 1;	//边框宽	
					ctx.strokeStyle = "pink";	//填充边框矩形
					ctx.strokeRect(x,y,59,59);
				}
			},
			disorder:function(){
				for(var i=1,height = this.map_height-2; i<=height; ++i){
					for(var j=1,width = this.map_width-2; j<=width; ++j){
						var y1 = parseInt(Math.random() * 100 % height + 1),
							x1 = parseInt(Math.random() * 100 % width + 1),
							y2 = parseInt(Math.random() * 100 % height + 1),
							x2 = parseInt(Math.random() * 100 % width + 1),
							tmp=this.mapArray[y1][x1];

						this.mapArray[y1][x1] = this.mapArray[y2][x2];
						this.mapArray[y2][x2] = tmp;
					}
				}
				return this;
			},
			isRowEmpty:function(x1,y1,x2,y2){
				
				if(y1 != y2){
					return false;
				}
				
				x1>x2 && (x1=x1+x2, x2=x1-x2, x1=x1-x2);	//强制x1比x2小
			
				for(var j=x1+1; j<x2; ++j){		//from (x2,y2+1) to (x2,y1-1);
					if(this.mapArray[y1][j] > 0){
						return false;
					} 
				}
				return true;
			},
			isColEmpty:function(x1,y1,x2,y2){
				
				if(x1 != x2){
					return false;
				}
				
				y1>y2 && (y1=y1+y2, y2=y1-y2, y1=y1-y2);	//强制y1比y2小
				
				for(var i=y1+1; i<y2; ++i){		//from (x2+1,y2) to (x1-1,y2);
					if(this.mapArray[i][x1] > 0){
						return false;
					}
				}
				return true;
			},
			canCleanup:function(x1,y1,x2,y2){

				if(x1 === x2 && y1 === y2){
					return false;
				}

				if(this.mapArray[y1][x1] != this.mapArray[y2][x2]){
					return false;
				}

				if(this.mapArray[y1][x1] === 0 || this.mapArray[y2][x2] === 0){	//不处理已消除的图片
					return false;
				}
	
				if(x1 === x2){		//同列
					if(1 === y1-y2 || 1 === y2-y1){	//相邻
						this.addPoints([x1,y1],[x2,y2]);
						return true;
					} else if(this.isColEmpty(x1,y1,x2,y2)){	//直线
						this.addPoints([x1,y1],[x2,y2]);
						return true;
					} else {	//两个拐点	(优化)
						var i = 1;
						while((x1+i < this.map_width) && this.mapArray[y1][x1+i] === 0){
							if(this.mapArray[y2][x2+i] > 0){
								break;
							} else {
								if(this.isColEmpty(x1+i,y1,x1+i,y2)){
									this.addPoints([x1,y1],[x1+i,y1],[x1+i,y2],[x2,y2]);
									return true;
								}
								i++;
							}
						}
						i = 1;
						while((x1-i >= 0) && this.mapArray[y1][x1-i] ===0){
							if(this.mapArray[y2][x2-i] > 0){
								break;
							} else {
								if(this.isColEmpty(x1-i,y1,x1-i,y2)){
									this.addPoints([x1,y1],[x1-i,y1],[x1-i,y2],[x2,y2]);
									return true;
								}
								i++;
							}
						}

					}
				}

				if(y1 === y2){		//同行
					if(1 === x1-x2 || 1 === x2-x1){
						this.addPoints([x1,y1],[x2,y2]);
						return true;
					} else if(this.isRowEmpty(x1,y1,x2,y2)){
						this.addPoints([x1,y1],[x2,y2]);
						return true;
					} else {
						var i = 1;
						while((y1+i < this.map_height) && this.mapArray[y1+i][x1] === 0){
							if(this.mapArray[y2+i][x2] > 0){
								break;
							} else {
								if(this.isRowEmpty(x1,y1+i,x2,y1+i)){
									this.addPoints([x1,y1],[x1,y1+i],[x2,y1+i],[x2,y2]);
									return true;
								}
								i++;
							}
						}
						i = 1;
						while((y1-i >= 0) && this.mapArray[y1-i][x1] === 0){
							if(this.mapArray[y2-i][x2] > 0){
								break;
							} else {
								if(this.isRowEmpty(x1,y1-i,x2,y1-i)){
									this.addPoints([x1,y1],[x1,y1-i],[x2,y1-i],[x2,y2]);
									return true;
								}
								i++;
							}
						}
					}
				}
				
				//一个拐点
				if(this.isRowEmpty(x1,y1,x2,y1) && this.mapArray[y1][x2] === 0){	// (x1,y1) -> (x2,y1)
					if(this.isColEmpty(x2,y1,x2,y2)){	// (x1,y2) -> (x2,y2)
						this.addPoints([x1,y1],[x2,y1],[x2,y2]);
						return true;
					}
				}
				if(this.isColEmpty(x1,y1,x1,y2) && this.mapArray[y2][x1] === 0){
					if(this.isRowEmpty(x1,y2,x2,y2)){
						this.addPoints([x1,y1],[x1,y2],[x2,y2]);
						return true;
					}
				}

				//不在一行的两个拐点
				if( x1 != x2 && y1 != y2) {
					i = x1;
					while(++i < this.map_width ){
						if(this.mapArray[y1][i] > 0){
							break;
						} else {
							if(this.isColEmpty(i,y1,i,y2) && this.isRowEmpty(i,y2,x2,y2) && this.mapArray[y2][i] === 0){
								this.addPoints([x1,y1],[i,y1],[i,y2],[x2,y2]);
								return true;
							}
						}
					}
					
					i = x1;
					while(--i >= 0 ){
						if(this.mapArray[y1][i] > 0){
							break;
						} else {
							if(this.isColEmpty(i,y1,i,y2) && this.isRowEmpty(i,y2,x2,y2) && this.mapArray[y2][i] === 0){
								this.addPoints([x1,y1],[i,y1],[i,y2],[x2,y2]);
								return true;
							}
						}
					}

					i = y1;
					while(++i < this.map_height){
						if(this.mapArray[i][x1] > 0){
							break;
						} else {
							if(this.isRowEmpty(x1,i,x2,i) && this.isColEmpty(x2,i,x2,y2) && this.mapArray[i][x2] === 0){
								this.addPoints([x1,y1],[x1,i],[x2,i],[x2,y2]);
								return true;
							}
						}
					}
					
					i = y1;
					while(--i >= 0){
						if(this.mapArray[i][x1] > 0){
							break;
						} else {
							if(this.isRowEmpty(x1,i,x2,i) && this.isColEmpty(x2,i,x2,y2) && this.mapArray[i][x2] === 0){
								this.addPoints([x1,y1],[x1,i],[x2,i],[x2,y2]);
								return true;
							}
						}
					}
				}

				return false;
			},
			
			isDead:function(){
				for(var i=0; i<this.map_height; i++){
					for(var j=0; j<this.map_width; j++){
						for(var m=0; m<this.map_height; m++){
							for(var n=0; n<this.map_width; n++){
								if(this.canCleanup(j,i,n,m)){
									this.hints = [j,i,n,m];
									return false;
								}
							}
						}
					}
				}
				return true;
			},
			hint:function(){
				this.isDead();
				var hints = this.hints;
				if(hints && hints.length){
					this.selectImg(hints[0],hints[1]);
					this.selectImg(hints[2],hints[3]);
				}
			},
			clearImg:function(x,y){
				var ctx = this.ctx;
		
				ctx.save();
				ctx.clearRect(x*60-1,y*60-1,62,62);
				ctx.restore();
			},
			getImgPos:function(e){
				var e = e || window.event,
					posX = e.offsetX || e.layerX,
					posY = e.offsetY || e.layerY,
					x, y, 
				
				x = Math.floor(posX / 60);
				y = Math.floor(posY / 60);

				return {x:x,y:y}
			},
			getImgCenter:function(x,y){
				return {x:x*60+60/2,y:y*60+60/2}
			},
			addPoints:function(){
				var args = arguments,
					len = args.length,
					i = 0;

				for(;i<len;){
					this.points.push(args[i++]);
				}
			},
			drawLine:function(){
				var ctx = this.ctx,
					p = this.points,
					len = p.length,
					p_center = [];

				if(len === 0){
					return;
				}
				p_center[0] = this.getImgCenter(p[0][0],p[0][1]);
				ctx.save();
				ctx.strokeStyle = "#00f";
				ctx.lineWidth = 4;
				ctx.beginPath();
				ctx.moveTo(p_center[0]['x'],p_center[0]['y']);
				for(var i=1; i<len; i++){
					p_center[i] = this.getImgCenter(p[i][0],p[i][1]);
					ctx.lineTo(p_center[i]['x'],p_center[i]['y']);
				}
				ctx.stroke();
				ctx.closePath();
				ctx.restore();

				this.points = [];	//清空点数组
			},
			selectImg:function(x,y){
				var	ctx = this.ctx;
				
				ctx.lineWidth = 2;
				ctx.strokeStyle = "#f00";
				ctx.strokeRect(x*60,y*60,58,58);

			},
			unselectImg:function(){
				this.drawMap();
			},
			eventBind:function(){
				var self = this,
					canvas$ = $("canvas"),
					getImgPos = this.getImgPos,
					audio$ = $("music"),
					musicBtn$ = $("music_button"),
					startBtn$ = $("start_button"),
					hintBtn$ = $("hint_button"),
					disorderBtn$ = $("disorder_button"),
					progressHead$ = $("progress_head"),
					progressFull$ = $("progress_full"),
					submitBtn$ = $("submit_button");

				addEventListener(canvas$,"click",function(e){
					var e = e || window.event,
						pos = getImgPos.apply(self,arguments),	//得到点击的图片坐标
						x = pos && pos.x || 0,
						y = pos && pos.y || 0,
						lastX = self.lastX,
						lastY = self.lastY,
						mapArray = self.mapArray;

					if(!self.isGameBegin || mapArray[y][x] === 0){
						return;
					}

					self.drawMap();
					self.points = [];
					if(lastX !== null && lastY !==null ){
						if(lastX === x && lastY === y){
							self.drawMap();
							return;
						}
						if(self.isGod || mapArray[y][x] === mapArray[lastY][lastX]){
							if(self.isGod || self.canCleanup(x,y,lastX,lastY)){	//判断是否能够连通
								self.drawLine();	
								setTimeout(function(){
									self.clearImg(x,y);
									self.clearImg(lastX,lastY);
									mapArray[y][x] = mapArray[lastY][lastX] = 0;
									self.drawMap();
									--(self.leftPairs);
									if(!self.leftPairs){
										self.success();
									}
									self.isGod || (self.isDead() && self.autoDisorder()); 

								},100);
							} else {
								self.drawMap();
							}
						} else {
							self.drawMap();
						}

					}
					//选中图片
					self.selectImg(x,y);
					self.lastX = x;	//保存当前图片的坐标
					self.lastY = y;
				},false);

				addEventListener(canvas$,"mousemove",function(e){
					var e = e || window.event,
						pos = getImgPos.apply(self,arguments),	//得到点击的图片坐标
						x = pos && pos.x || 0,
						y = pos && pos.y || 0;

					if(!self.isGameBegin){
						return;
					}
					if(x>self.map_width || x<0 || y>self.map_height || y<0){
						return;
					}

					if(!self.mapArray[y][x]){
						canvas$.style.cursor = "default";
					} else {
						canvas$.style.cursor = "pointer";
					}

				},false);

				//背景音乐开关
				self.paused = false;
				
				addEventListener(musicBtn$,"click",function(){
					if(!self.paused){
						musicBtn$.style.backgroundPosition = "-105px -69px";
						audio$.pause();
						self.paused = true;
					} else {
						musicBtn$.style.backgroundPosition = "-69px -70px";
						audio$.play();
						self.paused = false;
					}
				},false);

				addEventListener(startBtn$,"click",function(){
					var leftTime = self.timeLimit,
						won$ = $("won"),
						hintText$ = $("hint_text"),
						disorderText$ = $("disorder_text");
					
					if(self.isGameBegin){
						return;
					}
					audio$.play();
					won$.style.display = "none";
					hintText$.innerHTML = "*" + self.hintTimes;
					disorderText$.innerHTML = "*" + self.disorderTimes;
					self.creatMap().disorder();
					self.drawMap();
					progressFull$.style.visibility = "hidden";
					t = setInterval(function(){
							var posX = --leftTime;
							progressFull$.style.clip = "rect(0,270px,35px,"+posX+"px)";
							progressFull$.style.visibility = "visible";
							progressHead$.style.left = (posX-5) + "px";
							if(leftTime === 0){
								self.gameover();
							}
						},1000)
					self.isGameBegin = true;
					self.toggleInterface();
				},false);
					
				addEventListener(hintBtn$,"click",function(){
						var hintText$ = $("hint_text");
						
						if(!self.isGameBegin){
								return;
						}

						if(self.hintTimes > 0){
							self.hint();
							if((--self.hintTimes) === 0){
								hintBtn$.style.cursor = "default";
							}
							hintText$.innerHTML = "*"+self.hintTimes;
						}
				},false);
				
				addEventListener(disorderBtn$,"click",function(){
						var disorderText$ = $("disorder_text");
						
						if(!self.isGameBegin){
							return;
						}

						if(self.disorderTimes > 0){
							self.disorder().drawMap();
							if((--self.disorderTimes) === 0){
								disorderBtn$.style.cursor = "default";
							}
							disorderText$.innerHTML = "*"+self.disorderTimes;
						}
				},false);

				addEventListener(submitBtn$,"click",function(){
					var name = $("name_text").value,
						player$ = $("player_name"),
						dialog$ = $("dialog"),
						mask$ = $("mask");

					if(name.length > 6){
						name = name.substr(0,6);
					}
					self.setCookie("name",name);
					player$.innerHTML = name;
					dialog$.style.display = "none";
					mask$.style.display = "none";
				});

				addEventListener(document,"click",function(e){	//上帝模式
						if(!self.isGameBegin){
							return;
						}
						if(e.ctrlKey && e.shiftKey){
							if(self.isGod){
								alert("上帝模式关闭");
								self.isGod = false;
							} else {
								alert("上帝模式开启");
								self.isGod = true;
							}
						}

				},false);

				addEventListener(document,"keyup",function(e){	//调试模式
					var	e = e || window.event;
					if(!self.isGameBegin){
							return;
						}
						console.log(e);
						if(e.ctrlKey && e.shiftKey && e.keyCode === 76){
							self.success();
						}

						if(e.ctrlKey && e.shiftKey && e.keyCode === 75){
							self.gameover();
						}

				},false);
				
				this.eventBound = true;
				return self;
			},
			autoDisorder:function(){
				var disorderTimes = this.disorderTimes,
					disorderText$ = $("disorder_text");

				alert("你已经无路可走了！");
				if(disorderTimes >0){
					this.disorder();
					disorderText$.innerHTML = "*"+ (--this.disorderTimes);
					this.drawMap();
				} else {
					this.gameover();
				}
			},
			success:function(){
				var startBtn$ = $("start_button"),
					won$ = $("won"),
					records$ = $("player_records"),
					records;

				startBtn$.style.display = "block";
				won$.src = "images/zombieNote.png";
				this.animate(won$);	
				this.isGameBegin = false;
				this.ctx.clearRect(0,0,720,600);
				this.ctx.save();
				this.toggleInterface();
				clearInterval(t);
	
				records = this.getCookie("records") || this.records;
				if(this.imgsType < 18){
					this.imgsType++;
				}
				this.hintTimes++;
				if(++records%4 === 0){
					won.src = "images/trophy.png";
					this.disorderTimes++;
					this.animate(won$);
				}
				records$.innerHTML = records;
				this.setCookie("records",records);
				this.init();
			},
			gameover:function(){
				var startBtn$ = $("start_button"),
					won$ = $("won"),
					dialog$ = $("dialog"),
					mask$ = $("mask"),
					records$ = $("player_records"),
					records,name;

				startBtn$.style.display = "block";
				won$.src = "images/zombiesWon.png";
				//won$.style.display = "block";
				this.animate(won$);
				this.isGameBegin = false;
				this.ctx.clearRect(0,0,720,600);
				this.ctx.save();
				this.toggleInterface();
				clearInterval(t);
				
				if(this.getCookie("name") === null){
					this.fadeIn(dialog$);
					mask$.style.display = "block";
				} 
				records = this.getCookie("records") || this.records;
				this.setCookie("records",records);
				records$.innerHTML = records;
			},
			toggleInterface:function(){
				var	wrap$ = $("llk_wrap"),
					progressbar$ = $("llk_progressbar"),
					toolsBox$ = $("llk_tools"),
					startBtn$ = $("start_button"),
					progressFull$ = $("progress_full"),
					progressHead$ = $("progress_head");

				if(this.isGameBegin){
					toolsBox$.style.display = "block";
					progressbar$.style.display = "block";
					startBtn$.style.display = "none";
					wrap$.style.backgroundImage = "url(images/background1.jpg)";
					wrap$.style.backgroundPosition = "40% 0%";
				} else {
					toolsBox$.style.display = "none";
					progressbar$.style.display = "none";
					startBtn$.style.display = "block";
					wrap$.style.backgroundImage = "url(images/background.jpg)";
				}
				
				progressFull$.style.clip = "rect(0,270px,35px,0px)";
				progressHead$.style.left = "245px";

			},
			setCookie:function(name,value){
				var date = new Date();
				
				date.setTime(date.getTime()+1*1000*3600*24*365);

				document.cookie = name + "="+ escape(value) + ";expires=" + date.toGMTString() +";path=/";
			},
			getCookie:function(name){
				var cookie = document.cookie,
					regExp = new RegExp("[sS]*"+name+"=([^;]*)(;|$)"),
					ret = cookie.match(regExp);

				if(ret != null){
					return ret[1];
				}
				return null;
			},
			getStyle:function(elem,name){
				if(elem.style[name]){
					return elem.style[name];
				} else if(elem.currentStyle){
					return elem.currentStyle[name];
				} else if(document.defaultView && document.defaultView.getComputedStyle){
					var s = document.defaultView.getComputedStyle(elem,"");

					name = name.replace(/[A-Z]/g,"-$1");
					name = name.toLowerCase();
					return s && s.getPropertyValue(name);
				} else {
					return null;
				}
			},
			getWidth:function(elem){
				return parseInt(this.getStyle(elem,"width"));
			},
			getHeight:function(elem){
				return parseInt(this.getStyle(elem,"height"));
			},
			getTrueWidth:function(elem){
				if(elem.style.display != "none"){
					return elem.offsetWidth || this.getWidth(elem);
				}
				var old,ret;
			
				old = this.resetCSS(elem,{
					visibility:"hidden",
					position:"absolute",
					display:"block"
				});

				ret = elem.offsetWidth || this.getWidth(elem);
				this.restoreCSS(elem,old);
				return ret;
			},
			getTrueHeight:function(elem){
				if(elem.style.display != "none"){
					return elem.offsetHeight || this.getHeight(elem);
				}
				var old,ret;
			
				old = this.resetCSS(elem,{
					visibility:"hidden",
					position:"absolute",
					display:"block"
				});
				ret = elem.offsetHeight || this.getHeight(elem);
				this.restoreCSS(elem,old);
				return ret;
			},
			resetCSS:function(elem,prop){
				var old = {}, i;
				
				for(i in prop){
					old[i] = elem.style[i];
					elem.style[i] = prop[i];
				}

				return old;
			},
			restoreCSS:function(elem,prop){
				for(var i in prop){
					elem.style[i] = prop[i];
				}
			},
			setOpacity:function(elem,level){
				if(elem.filters){
					elem.style.filters = "alpha(opacity=" + level + ")";
				} else {
					elem.style.opacity = level / 100;
				}
			},
			fadeIn:function(elem,time){
				var time = time || 10,
					i = 0,
					self = this;

				this.setOpacity(elem,0);
				elem.style.display = "block";
				for(; i<=100; i+=5){
					(function(idx){
						setTimeout(function(){
							self.setOpacity(elem,idx);
						},(idx+1)*time);
					})(i);
				}
			},
			fadeOut:function(elem,time){
				var time = time || 10,
					i = 0,
					self = this;

				for(; i<=100; i+=5){
					(function(idx){
						setTimeout(function(){
							self.setOpacity(elem,100-idx);
							if(idx === 100){
								elem.style.display = "none";
							}
						},(idx+1)*time);
					})(i);
				}
			},
			animate:function(elem,time){
				var time = time || 10,
					i = 0,
					self = this,
					left = self.getStyle(elem,"left"),
					top = self.getStyle(elem,"top"),
					width = self.getTrueWidth(elem),
					height = self.getTrueHeight(elem);

				elem.style.display = "block";
				for(; i<=100; i+=5){
					(function(idx){
						setTimeout(function(){
							elem.style.left =  (idx / 100 * left) + "px";
							elem.style.top = idx / 100 * top + "px";
							elem.style.width = idx / 100 * width + "px";
							elem.style.height = idx / 100 * height + "px";
						},(idx+1)*time);
					})(i);
				}
			}
		}
