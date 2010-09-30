//
// パズル固有スクリプト部 数独版 sudoku.js v3.3.2
//
Puzzles.sudoku = function(){ };
Puzzles.sudoku.prototype = {
	setting : function(){
		// グローバル変数の初期設定
		if(!k.qcols){ k.qcols = 9;}
		if(!k.qrows){ k.qrows = 9;}

		k.isDispHatena    = true;
		k.isInputHatena   = true;
		k.isAnsNumber     = true;

		k.ispzprv3ONLY    = true;
		k.isKanpenExist   = true;

		base.setFloatbgcolor("rgb(64, 64, 64)");
	},
	menufix : function(){ },

	protoChange : function(){
		this.newboard_html_original = _doc.newboard.innerHTML;

		_doc.newboard.innerHTML =
			["<span id=\"pop1_1_cap0\">盤面を新規作成します。</span><br>\n",
			 "<input type=\"radio\" name=\"size\" value=\"9\" checked>9×9<br>\n",
			 "<input type=\"radio\" name=\"size\" value=\"16\">16×16<br>\n",
			 "<input type=\"radio\" name=\"size\" value=\"25\">25×25<br>\n",
			 "<input type=\"radio\" name=\"size\" value=\"4\">4×4<br>\n",
			 "<input type=\"button\" name=\"newboard\" value=\"新規作成\" /><input type=\"button\" name=\"cancel\" value=\"キャンセル\" />\n"
			].join('');
	},
	protoOriginal : function(){
		_doc.newboard.innerHTML = this.newboard_html_original;
	},

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(){ this.inputqnum();};
		mv.mouseup = function(){ };
		mv.mousemove = function(){ };

		// キーボード入力系
		kc.keyinput = function(ca){
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca);
		};

		kp.kpgenerate = function(mode){
			this.inputcol('num','knum1','1','1');
			this.inputcol('num','knum2','2','2');
			this.inputcol('num','knum3','3','3');
			this.inputcol('num','knum4','4','4');
			this.insertrow();
			this.inputcol('num','knum5','5','5');
			this.inputcol('num','knum6','6','6');
			this.inputcol('num','knum7','7','7');
			this.inputcol('num','knum8','8','8');
			this.insertrow();
			this.inputcol('num','knum9','9','9');
			((mode==1)?this.inputcol('num','knum.','-','?'):this.inputcol('empty','','',''));
			this.inputcol('num','knum_',' ',' ');
			this.inputcol('num','knum0','0','0');
			this.insertrow();
		};
		kp.generate(kp.ORIGINAL, true, true);
		kp.kpinput = function(ca){
			kc.key_inputqnum(ca);
		};

		bd.nummaxfunc = function(cc){ return Math.max(k.qcols,k.qrows);};
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){

		pc.paint = function(){
			this.drawBGCells();
			this.drawGrid();
			this.drawBlockBorders();

			this.drawNumbers();

			this.drawChassis();

			this.drawCursor();
		};
		pc.drawBlockBorders = function(){
			this.vinc('border_block', 'crispEdges');

			var lw = this.lw, lm = this.lm;

			var max=k.qcols;
			var block=((Math.sqrt(max)+0.1)|0);
			var headers = ["bbx_", "bby_"];

			var x1=this.range.x1, y1=this.range.y1, x2=this.range.x2, y2=this.range.y2;
			if(x1<bd.minbx){ x1=bd.minbx;} if(x2>bd.maxbx){ x2=bd.maxbx;}
			if(y1<bd.minby){ y1=bd.minby;} if(y2>bd.maxby){ y2=bd.maxby;}

			g.fillStyle = "black";
			for(var i=1;i<block;i++){
				if(x1-1<=i*block&&i*block<=x2+1){ if(this.vnop(headers[0]+i,this.NONE)){
					g.fillRect(i*block*this.cw-lw+1, y1*this.bh-lw+1, lw, (y2-y1)*this.bh+2*lw-1);
				}}
			}
			for(var i=1;i<block;i++){
				if(y1-1<=i*block&&i*block<=y2+1){ if(this.vnop(headers[1]+i,this.NONE)){
					g.fillRect(x1*this.bw-lw+1, i*block*this.ch-lw+1, (x2-x1)*this.bw+2*lw-1, lw);
				}}
			}
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	encode_init : function(){
		enc.pzlimport = function(type){
			this.decodeNumber16();
		};
		enc.pzlexport = function(type){
			this.encodeNumber16();
		};

		enc.decodeKanpen = function(){
			fio.decodeCellQnum_kanpen();
		};
		enc.encodeKanpen = function(){
			this.outsize = [k.qcols].join('/');

			fio.encodeCellQnum_kanpen();
		};

		//---------------------------------------------------------
		fio.decodeData = function(){
			this.decodeCellQnum();
			this.decodeCellAnumsub();
		};
		fio.encodeData = function(){
			this.sizestr = [k.qcols].join("/");

			this.encodeCellQnum();
			this.encodeCellAnumsub();
		};

		fio.kanpenOpen = function(){
			this.decodeCellQnum_kanpen();
			this.decodeCellAnum_kanpen();
		};
		fio.kanpenSave = function(){
			this.sizestr = [k.qcols].join("/");

			this.encodeCellQnum_kanpen();
			this.encodeCellAnum_kanpen();
		};
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	answer_init : function(){
		ans.checkAns = function(){

			if( !this.checkRoomNumber() ){
				this.setAlert('同じブロックに同じ数字が入っています。','There are same numbers in a block.'); return false;
			}

			if( !this.checkRowsCols(this.isDifferentNumberInClist, bd.getNum) ){
				this.setAlert('同じ列に同じ数字が入っています。','There are same numbers in a row.'); return false;
			}

			if( !this.checkNoNumCell() ){
				this.setAlert('数字の入っていないマスがあります。','There is a empty cell.'); return false;
			}

			return true;
		};
		ans.check1st = function(){ return this.checkNoNumCell();};

		ans.checkRoomNumber = function(){
			var result = true;
			var max=k.qcols;
			var blk=((Math.sqrt(max)+0.1)|0);
			for(var i=0;i<max;i++){
				var clist = bd.cellinside(((i%blk)*blk)*2+1, (((i/blk)|0)*blk)*2+1, ((i%blk+1)*blk-1)*2+1, (((i/blk+1)|0)*blk-1)*2+1);
				if(!this.isDifferentNumberInClist(clist, bd.getNum)){
					if(this.inAutoCheck){ return false;}
					result = false;
				}
			}
			return result;
		};
	}
};
