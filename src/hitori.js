//
// パズル固有スクリプト部 ひとりにしてくれ hitori.js v3.3.2
//
Puzzles.hitori = function(){ };
Puzzles.hitori.prototype = {
	setting : function(){
		// グローバル変数の初期設定
		if(!k.qcols){ k.qcols = 8;}
		if(!k.qrows){ k.qrows = 8;}

		k.BlackCell       = true;
		k.RBBlackCell     = true;
		k.checkWhiteCell  = true;

		k.ispzprv3ONLY    = true;
		k.isKanpenExist   = true;

		base.setFloatbgcolor("rgb(0, 224, 0)");

		enc.pidKanpen = 'hitori';
	},
	menufix : function(){
		menu.addUseToFlags();
		menu.addRedBlockRBToFlags();

		pp.addCheck('plred','setting',false, '重複した数字を表示', 'Show overlapped number');
		pp.setLabel('plred', '重複している数字を赤くする', 'Show overlapped number as red.');
		pp.funcs['plred'] = function(){ pc.paintAll();};
	},

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(){
			if(kc.isZ ^ pp.getVal('dispred')){ this.dispRed();}
			else if(k.editmode) this.inputqnum();
			else if(k.playmode) this.inputcell();
		};
		mv.mouseup = function(){ };
		mv.mousemove = function(){
			if(k.playmode) this.inputcell();
		};

		// キーボード入力系
		kc.keyinput = function(ca){
			if(ca=='z' && !this.keyPressed){ this.isZ=true; return;}
			if(k.playmode){ return;}
			if(this.key_inputdirec(ca)){ return;}
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca);
		};
		kc.keyup = function(ca){ if(ca=='z'){ this.isZ=false;}};
		kc.isZ = false;

		bd.nummaxfunc = function(cc){ return Math.max(k.qcols,k.qrows);};
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.gridcolor = pc.gridcolor_LIGHT;
		pc.bcolor = pc.bcolor_GREEN;
		pc.fontErrcolor = "red";
		pc.fontBCellcolor = "rgb(96,96,96)";
		pc.setBGCellColorFunc('qsub1');

		pc.paint = function(){
			this.drawBGCells();
			this.drawGrid();
			this.drawBlackCells();

			this.drawNumbers_hitori();

			this.drawChassis();

			this.drawTarget();
		};

		pc.drawNumbers_hitori = function(){

			this.drawNumbers();

			if(pp.getVal('plred') && !ans.errDisp){
				ans.inCheck = true;
				ans.checkRowsCols(ans.isDifferentNumberInClist_hitori, bd.QnC);
				ans.inCheck = false;

				var clist = bd.cellinside(bd.minbx, bd.minby, bd.maxbx, bd.maxby);
				for(var i=0;i<clist.length;i++){ this.drawNumber1(clist[i]);}

				ans.errDisp = true;
				bd.errclear(false);
			}
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	encode_init : function(){
		enc.pzlimport = function(type){
			this.decodeHitori();
		};
		enc.pzlexport = function(type){
			this.encodeHitori();
		};

		enc.decodeHitori = function(){
			var c=0, i=0, bstr = this.outbstr;
			for(i=0;i<bstr.length;i++){
				var ca = bstr.charAt(i);

				if(this.include(ca,"0","9")||this.include(ca,"a","z"))
								 { bd.cell[c].qnum = parseInt(ca,36);}
				else if(ca==='-'){ bd.cell[c].qnum = parseInt(bstr.substr(i+1,2),36); i+=2;}
				else if(ca==='%'){ bd.cell[c].qnum = -2;}

				c++;
				if(c > bd.cellmax){ break;}
			}
			this.outbstr = bstr.substr(i);
		};
		enc.encodeHitori = function(){
			var count=0, cm="";
			for(var c=0;c<bd.cellmax;c++){
				var pstr = "", qn= bd.cell[c].qnum;

				if     (qn===-2)       { pstr = "%";}
				else if(qn>= 0&&qn< 16){ pstr =       qn.toString(36);}
				else if(qn>=16&&qn<256){ pstr = "-" + qn.toString(36);}
				else{ count++;}

				if(count==0){ cm += pstr;}
				else{ cm+="."; count=0;}
			}
			if(count>0){ cm+=".";}

			this.outbstr += cm;
		};

		enc.decodeKanpen = function(){
			fio.decodeCellQnum_kanpen_hitori();
		};
		enc.encodeKanpen = function(){
			fio.encodeCellQnum_kanpen_hitori();
		};

		//---------------------------------------------------------
		fio.decodeData = function(){
			this.decodeCellQnum();
			this.decodeCellAns();
		};
		fio.encodeData = function(){
			this.encodeCellQnum();
			this.encodeCellAns();
		};

		fio.kanpenOpen = function(){
			this.decodeCellQnum_kanpen_hitori();
			this.decodeCellAns();
		};
		fio.kanpenSave = function(){
			this.encodeCellQnum_kanpen_hitori();
			this.encodeCellAns();
		};

		fio.decodeCellQnum_kanpen_hitori = function(){
			this.decodeCell( function(obj,ca){
				if(ca!=="0" && ca!=="."){ obj.qnum = parseInt(ca);}
			});
		};
		fio.encodeCellQnum_kanpen_hitori = function(){
			this.encodeCell( function(obj){
				return ((obj.qnum>0)?(obj.qnum.toString() + " "):"0 ");
			});
		};
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	answer_init : function(){
		ans.checkAns = function(){

			if( !this.checkSideCell(function(c1,c2){ return (bd.isBlack(c1) && bd.isBlack(c2));}) ){
				this.setAlert('黒マスがタテヨコに連続しています。','Black cells are adjacent.'); return false;
			}

			if( !this.checkOneArea( area.getWCellInfo() ) ){
				this.setAlert('白マスが分断されています。','White cells are devided.'); return false;
			}

			if( !this.checkRowsCols(this.isDifferentNumberInClist_hitori, bd.QnC) ){
				this.setAlert('同じ列に同じ数字が入っています。','There are same numbers in a row.'); return false;
			}

			return true;
		};
		ans.check1st = function(){ return true;};

		ans.isDifferentNumberInClist_hitori = function(clist_all, numfunc){
			var clist = [];
			for(var i=0;i<clist_all.length;i++){
				var c = clist_all[i];
				if(bd.isWhite(c) && numfunc.call(bd,c)!==-1){ clist.push(c);}
			}
			return this.isDifferentNumberInClist(clist, numfunc);
		};
	}
};
