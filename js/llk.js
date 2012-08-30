/*
 *	author:fatter;
 *	E-mail:lwn888@gmail.com
 *	Date:2011.12.23
 *	Update:2012.8.29
 *
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
				this.map_width = 10;
				this.map_height = 8;
				this.imgsType = 10;
				this.records = 0;
				this.loading();
			},
			
			t;

		LLK.prototype = {
			loading:function(){
				var	imgQueue = ['pvz.png','background.jpg','background1.jpg','toolsBackground.png','zombieNote.png','zombiesWon.png','recordsBackground.png','trophy.png'];
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
				this.hintTimes = 3;
				this.disorderTimes = 3;
				this.lastX=null;
				this.lastY=null;
				this.leftPairs = (this.map_height * this.map_width) /2;
				this.ctx = ctx;
				this.isGod = false;
				!this.eventBound && this.eventBind();
				
				player = this.getCookie("name");
				records = this.getCookie("records");
				player &&  (player$.innerHTML = player);
				records && (records$.innerHTML = records);
				loading$.style.display = "none";
				llk_wrap$.style.display = "block";	

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
						percentage = (8 - queue.length) / 8 * 100;
						percentage$.innerHTML = percentage + "%";
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
						this.mapArray[i].push(k);
						++j;
						this.mapArray[i].push(k);
						++k;
						++j;
						if(k > this.imgsType)
							k=1;
					}
				}
				return this;
			},
			drawMap:function(){
				var x = 0, y = 0;
			
				this.ctx.save();
				this.ctx.clearRect(0,0,600,480);
				for(var i=0; i<this.map_height; ++i){
					for(var j=0; j<this.map_width; ++j){
						this.drawImg(this.mapArray[i][j],x,y);
						x = x<540 ? x+60 : 0;
					}
					y = y<420 ? y+60 : 0;
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
				for(var i=0; i<this.map_height; ++i){
					for(var j=0; j<this.map_width; ++j){
						var y1 = parseInt(Math.random() * 100 % this.map_height),
							x1 = parseInt(Math.random() * 100 % this.map_width),
							y2 = parseInt(Math.random() * 100 % this.map_height),
							x2 = parseInt(Math.random() * 100 % this.map_width),
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
					progressFull$ = $("progress_full");

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
						musicBtn$.src = "images/sound-off.png";
						audio$.pause();
						self.paused = true;
					} else {
						musicBtn$.src = "images/sound-on.png";
						audio$.play();
						self.paused = false;
					}
				},false);

				addEventListener(startBtn$,"click",function(){
					var leftTime = self.timeLimit,
						won$ = $("won");
					
					if(self.isGameBegin){
						return;
					}
					audio$.play();
					won$.style.display = "none";
					self.creatMap().disorder();
					self.drawMap();
					t = setInterval(function(){
							var posX = --leftTime;

							progressFull$.style.clip = "rect(0,270px,35px,"+posX+"px)";
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

						if(e.ctrlKey && e.shiftKey && e.keyCode === 68){
							self.gameover();
						}

				},false);
				
				this.eventBound = true;
				return self;
			},
			autoDisorder:function(){
				var disorderTimes = this.disorderTimes;

				alert("你已经无路可走了！");
				if(disorderTimes >0){
					this.disorder();
					this.disorderTimes--;
					this.drawMap();
				} else {
					this.gameover();
				}
			},
			success:function(){
				var startBtn$ = $("start_button"),
					won$ = $("won"),
					records$ = $("player_records");

				startBtn$.style.display = "block";
				won$.src = "images/zombieNote.png";
				won$.style.display = "block";
				this.isGameBegin = false;
				this.ctx.clearRect(0,0,600,480);
				this.ctx.save();
				this.toggleInterface();
				clearInterval(t);
	
				if(this.imgsType < 18){
					this.imgsType++;
				}
		//		if(++(this.records)%4 === 0){
					won.src = "images/trophy.png";
					records$.innerHTML = ++this.records;
					this.setCookie("records",this.records);
		//			alert("恭喜你赢得一个奖杯！");
		//		}
				this.init();
			},
			gameover:function(){
				var startBtn$ = $("start_button"),
					won$ = $("won"),
					player$ = $("player_name"),
					records$ = $("player_records"),
					name;

				startBtn$.style.display = "block";
				won$.src = "images/zombiesWon.png";
				won$.style.display = "block";
				this.isGameBegin = false;
				this.ctx.clearRect(0,0,600,480);
				this.ctx.save();
				this.toggleInterface();
				clearInterval(t);
				
				if(this.getCookie("name") === null){
					name = prompt("请输入您的昵称","playerA");
					if(name.length > 6){
						name = name.substr(0,6);
					}
					this.setCookie("name",name);
					player$.innerHTML = name;
				} 
				this.setCookie("records",this.records);
				records$.innerHTML = this.records;
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
			}
		}
