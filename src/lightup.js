//
// パズル固有スクリプト部 美術館版 lightup.js v3.4.0
//
pzprv3.custom.lightup = {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	mousedown : function(){
		if     (k.playmode){ this.inputcell();}
		else if(k.editmode){ this.inputqnum();}
	},
	mousemove : function(){
		if(k.playmode && this.btn.Right){ this.inputcell();}
	}
},

//---------------------------------------------------------
// キーボード入力系
KeyEvent:{
	enablemake : true,

	enablemake_p : true,
	paneltype    : 2
},

//---------------------------------------------------------
// 盤面管理系
Cell:{
	qlight : 0
},

Board:{
	maxnum : 4,
	minnum : 0,

	numberIsWhite : true,

	initialize : function(pid){
		this.SuperFunc.initialize.call(this,pid);

		this.posthook.cell.qnum = this.setAkariInfo;
		this.posthook.cell.qans = this.setAkariInfo;

		this.akariinfo = []; /* インスタンス化 */
	},

	resetInfo : function(){
		this.initQlight();
	},

	isAkari : function(c){
		return (!!this.cell[c] && this.cell[c].qans===1);
	},

	akariinfo : [], /* 0:なし 1:あかり 2:黒マス */
	initQlight : function(){
		for(var c=0;c<this.cellmax;c++){
			this.cell[c].qlight = 0;
			this.akariinfo[c] = 0;
			if     (this.cell[c].qnum!==-1){ this.akariinfo[c]=2;}
			else if(this.cell[c].qans=== 1){ this.akariinfo[c]=1;}
		}
		for(var c=0;c<this.cellmax;c++){
			if(!this.isAkari(c)){ continue;}

			var clist = this.cellRangeClist(c);
			for(var i=0;i<clist.length;i++){ this.cell[clist[i]].qlight=1;}
		}
	},
	setAkariInfo : function(c,num){
		var val=0, old=this.akariinfo[c];
		if     (this.cell[c].qnum!==-1){ val=2;}
		else if(this.cell[c].qans=== 1){ val=1;}
		if(old===val){ return;}

		this.akariinfo[c] = val;
		this.setQlight(c, old, val);
	},
	setQlight : function(c, old, val){
		var clist = this.cellRangeClist(c);
		if(old===0 && val===1){
			for(var i=0;i<clist.length;i++){ this.cell[clist[i]].qlight=1;}
		}
		else{
			for(var i=0;i<clist.length;i++){
				var cc = clist[i], ql_old=this.cell[cc].qlight;
				if(ql_old===0 && ((old===1 && val===0) || (old===0 && val===2))){ continue;}
				if(ql_old===1 && (old===2 && val===0)){ continue;}

				var clist2 = this.cellRangeClist(cc), isakari = 0;
				for(var j=0;j<clist2.length;j++){ if(this.isAkari(clist2[j])){ isakari=1; break;} }
				this.cell[cc].qlight = isakari;
			}
			if(val===2){ this.cell[c].qlight = 0;}
		}

		if(!!pc.currentContext){
			var d=this.cellRange(c), bx=this.cell[c].bx, by=this.cell[c].by;
			pc.paintRange(d.x1, by, d.x2, by);
			pc.paintRange(bx, d.y1, bx, d.y2);
		}
	},

	cellRangeClist : function(c){
		var bx=this.cell[c].bx, by=this.cell[c].by, cc, clist=[c];

		for(var tx=bx-2,ty=by;tx>this.minbx;tx-=2){ cc=this.cnum(tx,ty); if(this.cell[cc].qnum!==-1){ break;} clist.push(cc);}
		for(var tx=bx+2,ty=by;tx<this.maxbx;tx+=2){ cc=this.cnum(tx,ty); if(this.cell[cc].qnum!==-1){ break;} clist.push(cc);}
		for(var tx=bx,ty=by-2;ty>this.minby;ty-=2){ cc=this.cnum(tx,ty); if(this.cell[cc].qnum!==-1){ break;} clist.push(cc);}
		for(var tx=bx,ty=by+2;ty<this.maxby;ty+=2){ cc=this.cnum(tx,ty); if(this.cell[cc].qnum!==-1){ break;} clist.push(cc);}
		return clist;
	},
	cellRange : function(c){
		var bx=this.cell[c].bx, by=this.cell[c].by, cc, d={};

		for(var tx=bx-2,ty=by;tx>this.minbx;tx-=2){ if(this.cell[this.cnum(tx,ty)].qnum!==-1){ break;}} d.x1=tx+2;
		for(var tx=bx+2,ty=by;tx<this.maxbx;tx+=2){ if(this.cell[this.cnum(tx,ty)].qnum!==-1){ break;}} d.x2=tx-2;
		for(var tx=bx,ty=by-2;ty>this.minby;ty-=2){ if(this.cell[this.cnum(tx,ty)].qnum!==-1){ break;}} d.y1=ty+2;
		for(var tx=bx,ty=by+2;ty<this.maxby;ty+=2){ if(this.cell[this.cnum(tx,ty)].qnum!==-1){ break;}} d.y2=ty-2;
		return d;
	}
},

Menu:{
	menufix : function(){
		this.addUseToFlags();
	}
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	hideHatena : true,

	setColors : function(){
		this.gridcolor = this.gridcolor_LIGHT;
		this.fontcolor = this.fontErrcolor = "white";
		this.dotcolor = this.dotcolor_PINK;
		this.setCellColorFunc('qnum');

		this.lightcolor = "rgb(224, 255, 127)";
	},
	paint : function(){
		this.drawBGCells();
		this.drawGrid();
		this.drawBlackCells();
		this.drawNumbers();

		this.drawAkari();
		this.drawDotCells(true);

		this.drawChassis();

		this.drawTarget();
	},

	// オーバーライド drawBGCells用
	getBGCellColor : function(cell){
		if(cell.qnum===-1){
			if     (cell.error ===1){ return this.errbcolor1;}
			else if(cell.qlight===1){ return this.lightcolor;}
		}
		return null;
	},

	drawAkari : function(){
		var g = this.vinc('cell_akari', 'auto');

		var rsize = this.cw*0.40;
		var lampcolor = "rgb(0, 127, 96)";
		var header = "c_AK_";

		var clist = this.range.cells;
		for(var i=0;i<clist.length;i++){
			var c = clist[i];
			if(bd.isAkari(c)){
				g.fillStyle = (bd.cell[c].error!==4 ? lampcolor : this.errcolor1);
				if(this.vnop(header+c,this.FILL)){
					g.fillCircle(bd.cell[c].cpx, bd.cell[c].cpy, rsize);
				}
			}
			else{ this.vhide(header+c);}
		}
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	pzlimport : function(type){
		this.decode4Cell();
	},
	pzlexport : function(type){
		this.encode4Cell();
	},

	decodeKanpen : function(){
		fio.decodeCellQnumb();
	},
	encodeKanpen : function(){
		fio.encodeCellQnumb();
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeCellQnumAns();
	},
	encodeData : function(){
		this.encodeCellQnumAns();
	},

	kanpenOpen : function(){
		this.decodeCell( function(obj,ca){
			if     (ca==="+"){ obj.qans = 1;}
			else if(ca==="*"){ obj.qsub = 1;}
			else if(ca==="5"){ obj.qnum = -2;}
			else if(ca!=="."){ obj.qnum = parseInt(ca);}
		});
	},
	kanpenSave : function(){
		this.encodeCell( function(obj){
			if     (obj.qans=== 1){ return "+ ";}
			else if(obj.qsub=== 1){ return "* ";}
			else if(obj.qnum>=  0){ return (obj.qnum.toString() + " ");}
			else if(obj.qnum===-2){ return "5 ";}
			else                  { return ". ";}
		});
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checkAns : function(){

		if( !this.checkRowsColsPartly(this.isPluralAkari, function(c){ return bd.isNum(c);}, true) ){
			this.setAlert('照明に別の照明の光が当たっています。','Akari is shined from another Akari.'); return false;
		}

		if( !this.checkDir4Cell(function(c){ return bd.isAkari(c);},0) ){
			this.setAlert('数字のまわりにある照明の数が間違っています。','The number is not equal to the number of Akari around it.'); return false;
		}

		if( !this.checkAllCell(function(c){ return (bd.noNum(c) && bd.cell[c].qlight!==1);}) ){
			this.setAlert('照明に照らされていないセルがあります。','A cell is not shined.'); return false;
		}

		return true;
	},

	isPluralAkari : function(keycellpos, clist){
		var akaris=[];
		for(var i=0;i<clist.length;i++){
			if(bd.isAkari(clist[i])){ akaris.push(clist[i]);}
		}
		var result = (akaris.length<=1);

		if(!result){ bd.sErC(akaris,4);}
		return result;
	}
}
};
