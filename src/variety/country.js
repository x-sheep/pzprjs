//
// パズル固有スクリプト部 カントリーロード版 country.js
//
(function(pidlist, classbase){
	if(typeof module==='object' && module.exports){module.exports = [pidlist, classbase];}
	else{ pzpr.classmgr.makeCustom(pidlist, classbase);}
}(
['country'], {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	redline : true,
	
	mouseinput : function(){
		if(this.puzzle.playmode){
			if(this.mousestart || this.mousemove){
				if(this.btn==='left'){ this.inputLine();}
			}
			else if(this.mouseend && this.notInputted()){
				this.inputMB();
			}
		}
		else if(this.puzzle.editmode){
			if(this.mousestart || this.mousemove){
				this.inputborder();
			}
			else if(this.mouseend && this.notInputted()){
				this.inputqnum();
			}
		}
	}
},

//---------------------------------------------------------
// キーボード入力系
KeyEvent:{
	enablemake : true
},

//---------------------------------------------------------
// 盤面管理系
Cell:{
	maxnum : function(){
		return Math.min(255, this.room.clist.length);
	}
},
Board:{
	hasborder : 1
},

LineGraph:{
	enabled : true
},

AreaRoomGraph:{
	enabled : true,
	hastop : true
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	irowake : true,

	gridcolor_type : "SLIGHT",

	paint : function(){
		this.drawBGCells();
		this.drawNumbers();

		this.drawGrid();
		this.drawBorders();

		this.drawMBs();
		this.drawLines();

		this.drawChassis();

		this.drawTarget();
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	decodePzpr : function(type){
		this.decodeBorder();
		this.decodeRoomNumber16();
	},
	encodePzpr : function(type){
		this.encodeBorder();
		this.encodeRoomNumber16();
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeAreaRoom();
		this.decodeCellQnum();
		this.decodeBorderLine();
		this.decodeCellQsub();
	},
	encodeData : function(){
		this.encodeAreaRoom();
		this.encodeCellQnum();
		this.encodeBorderLine();
		this.encodeCellQsub();
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checklist : [
		"checkBranchLine",
		"checkCrossLine",

		"checkRoomPassOnce",

		"checkRoadCount",
		"checkNoRoadCountry",

		"checkSideAreaGrass",

		"checkDeadendLine+",
		"checkOneLoop"
	],

	checkRoadCount : function(){
		this.checkLinesInArea(this.board.roommgr, function(w,h,a,n){ return (n<=0||n===a);}, "bkLineNe");
	},
	checkNoRoadCountry : function(){
		this.checkLinesInArea(this.board.roommgr, function(w,h,a,n){ return (a!==0);}, "bkNoLine");
	},
	checkSideAreaGrass : function(){
		this.checkSideAreaCell(function(cell1,cell2){ return (cell1.lcnt===0 && cell2.lcnt===0);}, false, "cbNoLine");
	},

	checkRoomPassOnce : function(){
		var rooms = this.board.roommgr.components;
		for(var r=0;r<rooms.length;r++){
			var cnt=0, clist=rooms[r].clist;
			for(var i=0;i<clist.length;i++){
				var cell=clist[i], adb=cell.adjborder, border;
				border=adb.top;    if(border.ques===1 && border.line===1){ cnt++;}
				border=adb.bottom; if(border.ques===1 && border.line===1){ cnt++;}
				border=adb.left;   if(border.ques===1 && border.line===1){ cnt++;}
				border=adb.right;  if(border.ques===1 && border.line===1){ cnt++;}
			}
			if(cnt<=2){ continue;}
			
			this.failcode.add("bkPassTwice");
			if(this.checkOnly){ break;}
			clist.seterr(1);
		}
	}
},

FailCode:{
	bkPassTwice : ["線が１つの国を２回以上通っています。","A line passes a country twice or more."],
	bkNoLine : ["線の通っていない国があります。","There is a country that is not passed any line."],
	bkLineNe : ["数字のある国と線が通過するマスの数が違います。","The number of the cells that is passed any line in the country and the number written in the country is diffrerent."],
	cbNoLine : ["線が通らないマスが、太線をはさんでタテヨコにとなりあっています。","The cells that is not passed any line are adjacent over border line."]
}
}));