//
// パズル固有スクリプト部 流れるループ版 nagare.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["nagare", "fakearrow"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		mouseinput_other: function() {
			if (this.inputMode === "diraux") {
				if (this.mousestart || this.mousemove) {
					this.inputdiraux_mousemove();
				} else if (this.mouseend && this.notInputted()) {
					this.clickdiraux();
				}
			}
		},
		// オーバーライド
		inputarrow_cell_main: function(cell, dir) {
			cell.setQdir(cell.qdir !== dir ? dir : 0);
		},
		inputShadeCell: function() {
			var cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) {
				return;
			}

			if (
				cell !== this.cursor.getc() &&
				this.puzzle.getConfig("cursor") &&
				this.inputMode === "auto"
			) {
				this.setcursor(cell);
			} else {
				cell.setQues(cell.ques === 1 ? 0 : 1);
				cell.drawaround();
			}
		}
	},
	"MouseEvent@nagare": {
		inputModes: {
			edit: ["shade", "arrow", "info-line"],
			play: ["line", "peke", "diraux", "info-line"]
		},
		mouseinput: function() {
			// オーバーライド
			if (this.inputMode === "shade") {
				if (this.mousestart) {
					this.inputShadeCell();
				}
			} else {
				this.common.mouseinput.call(this);
			}
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode && this.btn === "right") {
				if (this.mousestart) {
					this.inputdiraux_mousedown();
				} else if (this.inputData === 2 || this.inputData === 3) {
					this.inputpeke();
				} else if (this.mousemove) {
					this.inputdiraux_mousemove();
				}
			} else if (this.puzzle.playmode && this.btn === "left") {
				if (this.mousestart || this.mousemove) {
					this.inputLine();
				} else if (this.mouseend && this.notInputted()) {
					this.clickdiraux();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					this.inputarrow_cell();
				} else if (this.mouseend && this.notInputted()) {
					this.inputShadeCell();
				}
			}
		}
	},
	"MouseEvent@fakearrow": {
		inputModes: {
			edit: ["border", "arrow", "empty", "info-line"],
			play: ["line", "peke", "diraux", "shade", "info-line"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode && this.btn === "right") {
				if (this.mousestart) {
					this.inputdiraux_mousedown();
				} else if (this.inputData === 2 || this.inputData === 3) {
					this.inputpeke();
				} else if (this.mousemove) {
					this.inputdiraux_mousemove();
				}
			} else if (this.puzzle.playmode && this.btn === "left") {
				if (this.mousestart || this.mousemove) {
					this.inputLine();
				} else if (this.mouseend && this.notInputted()) {
					if (this.getcell().qdir > 0) {
						this.inputShade();
					} else {
						this.clickdiraux();
					}
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					if (this.isBorderMode()) {
						this.inputborder();
					} else {
						this.inputarrow_cell();
					}
				} else if (this.mouseend && this.notInputted()) {
					this.inputqnum();
				}
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function(ca) {
			if (ca.match(/shift/)) {
				return false;
			}
			return this.moveTCell(ca);
		},

		keyinput: function(ca) {
			if (this.key_inputarrow(ca)) {
				return;
			}
			this.key_inputques_nagare(ca);
		},
		key_inputques_nagare: function(ca) {
			var wall = this.pid === "nagare" ? 1 : 7;

			if (ca === "q" || ca === "w") {
				var cell = this.cursor.getc();
				cell.setQues(cell.ques !== wall ? wall : 0);
				cell.drawaround();
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	"Cell@fakearrow": {
		allowShade: function() {
			return this.qdir > 0;
		},
		allowUnshade: function() {
			return false;
		},
		noLP: function() {
			return this.isEmpty();
		},
		posthook: {
			ques: function(num) {
				if (num) {
					this.setQdir(this.NDIR);
				}
			},
			qdir: function(num) {
				if (num === this.NDIR) {
					this.setQans(0);
				} else {
					this.setQues(0);
				}
			}
		}
	},
	"Cell@nagare": {
		windbase: 0 /* このセルから風が吹いているか(1,2,4,8) or 風をガードしているか(16) */,
		wind: 0 /* セルに風が吹いているかどうか判定するためのパラメータ (qdir値とは別) */,
		/* 0-15:2進数の4桁がそれぞれ風の吹いてくる向きを表す 4方向から風が吹くと15 */

		// 線を引かせたくないので上書き
		noLP: function(dir) {
			return this.ques === 1;
		},

		posthook: {
			ques: function(num) {
				this.setWindAround();
			},
			qdir: function(num) {
				this.setWindAround();
			}
		},

		initWind: function() {
			this.wind = 0;
			if (this.ques === 1) {
				return;
			}
			var cell2,
				bd = this.board,
				d = new this.klass.ViewRange(this.bx, this.by, function(cell) {
					return cell.ques !== 0;
				});
			cell2 = bd.getc(d.x0, d.y2 + 2);
			if (cell2.ques === 1 && cell2.qdir === cell2.UP) {
				this.wind |= 1;
			}
			cell2 = bd.getc(d.x0, d.y1 - 2);
			if (cell2.ques === 1 && cell2.qdir === cell2.DN) {
				this.wind |= 2;
			}
			cell2 = bd.getc(d.x2 + 2, d.y0);
			if (cell2.ques === 1 && cell2.qdir === cell2.LT) {
				this.wind |= 4;
			}
			cell2 = bd.getc(d.x1 - 2, d.y0);
			if (cell2.ques === 1 && cell2.qdir === cell2.RT) {
				this.wind |= 8;
			}
		},

		calcWindBase: function() {
			var old = this.windbase;
			this.windbase = 0;
			if (this.ques === 1) {
				this.windbase |= 16 | [0, 1, 2, 4, 8][this.qdir];
			}
			return old ^ this.windbase;
		},
		setWindAround: function() {
			if (this.calcWindBase() === 0) {
				return;
			}
			this.initWind();

			var d = new this.klass.ViewRange(this.bx, this.by, function(cell) {
				return cell.ques !== 0;
			});
			for (var n = 0; n < 4; n++) {
				var dir = n + 1;
				var clist = d.getdirclist(dir);
				var blist = d.getdirblist(dir);
				var wind = 1 << n,
					wind1 = (this.windbase & (16 | wind)) === (16 | wind) ? wind : 0;
				for (var i = 0; i < clist.length; i++) {
					clist[i].wind = (clist[i].wind & ~wind) | wind1;
				}
				for (var i = 0; i < blist.length; i++) {
					blist[i].wind = (blist[i].wind & ~wind) | wind1;
				}
			}
		}
	},
	Range: {
		x1: -1,
		y1: -1,
		x2: -1,
		y2: -1
	},
	"RectRange:Range": {
		cellinside: function() {
			return this.board.cellinside(this.x1, this.y1, this.x2, this.y2);
		},
		borderinside: function() {
			return this.board.borderinside(this.x1, this.y1, this.x2, this.y2);
		}
	},
	"ViewRange:Range": {
		initialize: function(bx, by, func) {
			this.x0 = bx;
			this.y0 = by;
			if (!!func) {
				this.search(func);
			}
		},
		search: function(func) {
			var cell0 = this.board.getc(this.x0, this.y0),
				cell,
				cell2,
				adc = cell0.adjacent;
			cell = cell0;
			cell2 = adc.left;
			while (!cell2.isnull && !func(cell2)) {
				cell = cell2;
				cell2 = cell.adjacent.left;
			}
			this.x1 = cell.bx;
			cell = cell0;
			cell2 = adc.right;
			while (!cell2.isnull && !func(cell2)) {
				cell = cell2;
				cell2 = cell.adjacent.right;
			}
			this.x2 = cell.bx;
			cell = cell0;
			cell2 = adc.top;
			while (!cell2.isnull && !func(cell2)) {
				cell = cell2;
				cell2 = cell.adjacent.top;
			}
			this.y1 = cell.by;
			cell = cell0;
			cell2 = adc.bottom;
			while (!cell2.isnull && !func(cell2)) {
				cell = cell2;
				cell2 = cell.adjacent.bottom;
			}
			this.y2 = cell.by;
		},

		getdirclist: function(dir) {
			return this.getdirrange(dir).cellinside();
		},
		getdirblist: function(dir) {
			return this.getdirrange(dir).borderinside();
		},
		getdirrange: function(dir) {
			var range = new this.klass.RectRange();
			if (dir === 1) {
				range.x1 = range.x2 = this.x0;
				range.y1 = this.y1;
				range.y2 = this.y0 - 2;
			} else if (dir === 2) {
				range.x1 = range.x2 = this.x0;
				range.y1 = this.y0 + 2;
				range.y2 = this.y2;
			} else if (dir === 3) {
				range.x1 = this.x1;
				range.x2 = this.x0 - 2;
				range.y1 = range.y2 = this.y0;
			} else if (dir === 4) {
				range.x1 = this.x0 + 2;
				range.x2 = this.x2;
				range.y1 = range.y2 = this.y0;
			}
			return range;
		}
	},
	Border: {
		wind: 0 /* 逆に進んでいないか判定するためのパラメータ (qdir値とは別) */,
		/* 0:風なし 1:下から上へ 2:上から下へ 3:上下両方 4:右から左へ 8:左から右へ 12:左右両方 */

		enableLineNG: true
	},
	Board: {
		hasborder: 1
	},
	"Board@nagare": {
		rebuildInfo: function() {
			this.initWind();
			this.common.rebuildInfo.call(this);
		},

		initWind: function() {
			for (var i = 0; i < this.border.length; i++) {
				this.border[i].wind = 0;
			}
			for (var c = 0; c < this.cell.length; c++) {
				var cell = this.cell[c];
				cell.wind = 0;
				cell.windbase = 0;
			}
			for (var c = 0; c < this.cell.length; c++) {
				var cell = this.cell[c];
				if (cell.ques === 1 && cell.qdir !== 0) {
					cell.setWindAround();
				}
			}
		}
	},

	LineGraph: {
		enabled: true
	},
	"AreaRoomGraph@fakearrow": {
		enabled: true
	},

	BoardExec: {
		adjustBoardData: function(key, d) {
			this.adjustCellArrow(key, d);

			if (key & this.TURNFLIP) {
				var trans = this.getTranslateDir(key);
				var blist = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);
				for (var i = 0; i < blist.length; i++) {
					var border = blist[i],
						val;
					val = trans[border.qsub - 10];
					if (!!val) {
						border.qsub = val + 10;
					}
				}
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "LIGHT",

		paint: function() {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawQuesCells();

			if (this.pid === "fakearrow") {
				this.drawBorders();
			}

			this.drawCellArrows(this.pid === "fakearrow" ? 0.5 : true);

			this.drawLines();
			this.drawPekes();
			this.drawBorderAuxDir();

			this.drawChassis();

			this.drawTarget();
		},
		getCellArrowColor: function(cell) {
			return cell.ques === 0 ? this.quescolor : "white";
		}
	},
	"Graphic@fakearrow": {
		gridcolor_type: "SLIGHT",

		getBorderColor: function(border) {
			var cell1 = border.sidecell[0],
				cell2 = border.sidecell[1];

			if (cell1.isEmpty() && cell2.isEmpty()) {
				return null;
			}

			if (
				border.inside &&
				!cell1.isnull &&
				!cell2.isnull &&
				(cell1.isEmpty() || cell2.isEmpty())
			) {
				return "black";
			}
			return this.getBorderColor_ques(border);
		},
		getQuesCellColor: function(cell) {
			return cell.ques === 7 ? "darkgray" : null;
		},
		getCellArrowOutline: function(cell) {
			return this.quescolor;
		},
		getCellArrowColor: function(cell) {
			return cell.isShade() ? this.quescolor : null;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	"Encode@nagare": {
		decodePzpr: function(type) {
			this.decodeNagare();
		},
		encodePzpr: function(type) {
			this.encodeNagare();
		},

		decodeNagare: function() {
			var c = 0,
				i = 0,
				bstr = this.outbstr,
				bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				var cell = bd.cell[c],
					ca = bstr.charAt(i);

				if (this.include(ca, "1", "9")) {
					var val = parseInt(ca, 10);
					cell.ques = (val / 5) | 0;
					cell.qdir = val % 5;
				} else if (this.include(ca, "a", "z")) {
					c += parseInt(ca, 36) - 10;
				}

				c++;
				if (!bd.cell[c]) {
					break;
				}
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeNagare: function() {
			var cm = "",
				count = 0,
				bd = this.board;
			for (var c = 0; c < bd.cell.length; c++) {
				var pstr = "",
					cell = bd.cell[c],
					qu = cell.ques,
					dir = cell.qdir;

				if (qu === 1 || (dir >= 1 && dir <= 4)) {
					pstr = (qu * 5 + dir).toString(10);
				} else {
					count++;
				}

				if (count === 0) {
					cm += pstr;
				} else if (pstr || count === 26) {
					cm += (9 + count).toString(36) + pstr;
					count = 0;
				}
			}
			if (count > 0) {
				cm += (9 + count).toString(36);
			}

			this.outbstr += cm;
		}
	},
	"Encode@fakearrow": {
		decodePzpr: function() {
			this.decodeBorder();

			var bd = this.board;
			this.genericDecodeNumber16(bd.cell.length, function(c, val) {
				var cell = bd.cell[c];
				if (val === 5) {
					cell.setValid(7);
				} else if (val >= 0) {
					cell.qdir = val;
				}
			});
		},
		encodePzpr: function() {
			this.encodeBorder();

			var bd = this.board;
			this.genericEncodeNumber16(bd.cell.length, function(c) {
				var cell = bd.cell[c];
				return cell.isEmpty() ? 5 : cell.qdir || -1;
			});
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeCell(function(cell, ca) {
				if (ca !== ".") {
					var val = { u: 1, d: 2, l: 3, r: 4, N: 5, U: 6, D: 7, L: 8, R: 9 }[
						ca
					];
					cell.ques = (val / 5) | 0;
					cell.qdir = val % 5;
				}
			});
			this.decodeBorderArrowAns();
		},
		encodeData: function() {
			this.encodeCell(function(cell) {
				if (cell.ques === 1 || (cell.qdir >= 1 && cell.qdir <= 4)) {
					var val = cell.ques * 5 + cell.qdir;
					return ["u ", "d ", "l ", "r ", "N ", "U ", "D ", "L ", "R "][
						val - 1
					];
				} else {
					return ". ";
				}
			});
			this.encodeBorderArrowAns();
		}
	},
	"FileIO@fakearrow": {
		decodeData: function() {
			this.decodeBorderQues();
			this.decodeCell(function(cell, ca) {
				if (ca === "#") {
					cell.ques = 7;
				} else if (+ca > 0) {
					cell.qdir = +ca;
				}
			});
			this.decodeBorderArrowAns();
			this.decodeCellQanssub();
		},
		encodeData: function() {
			this.encodeBorderQues();
			this.encodeCell(function(cell) {
				return cell.isEmpty() ? "# " : cell.qdir ? cell.qdir + " " : ". ";
			});
			this.encodeBorderArrowAns();
			this.encodeCellQanssub();
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkArrowAgainst", // 問題確認用
			"checkLineOnShadeCell",
			"checkCrossLine+",
			"checkBranchLine+",
			"checkAcrossArrow",
			"checkLineArrowDirection",
			"checkLineWindDirection",
			"checkAcrossWind",
			"checkAllArrow",
			"checkDeadendLine++",
			"checkOneLoop"
		],

		checkArrowAgainst: function() {
			var boardcell = this.board.cell;
			for (var i = 0; i < boardcell.length; i++) {
				var cell = boardcell[i],
					arwind = cell.wind & (15 ^ [0, 1, 2, 4, 8][cell.qdir]);
				if (cell.qdir === 0 || cell.ques === 1 || cell.isShade() || !arwind) {
					continue;
				}

				this.failcode.add("arAgainstWind");
				if (this.checkOnly) {
					break;
				}
				this.setCellErrorToWindBase(cell, arwind);
			}
		},
		checkAcrossWind: function() {
			var boardcell = this.board.cell;
			for (var i = 0; i < boardcell.length; i++) {
				var cell = boardcell[i];
				var errv = (cell.wind & 3) !== 0 && cell.isLineStraight() === 2;
				var errh = (cell.wind & 12) !== 0 && cell.isLineStraight() === 1;
				if (!errv && !errh) {
					continue;
				}

				this.failcode.add("lrAcrossWind");
				if (this.checkOnly) {
					break;
				}
				this.setCellErrorToWindBase(
					cell,
					cell.wind & ((errv ? 3 : 0) | (errh ? 12 : 0))
				);
			}
		},
		checkAcrossArrow: function() {
			this.checkAllCell(function(cell) {
				var adb = cell.adjborder;
				if (cell.isShade()) {
					return false;
				}
				return (
					((cell.qdir === 1 || cell.qdir === 2) &&
						(adb.left.isLine() || adb.right.isLine())) ||
					((cell.qdir === 3 || cell.qdir === 4) &&
						(adb.top.isLine() || adb.bottom.isLine()))
				);
			}, "lrAcrossArrow");
		},
		checkAllArrow: function() {
			this.checkAllCell(function(cell) {
				return (
					!cell.isShade() && cell.ques === 0 && cell.qdir > 0 && cell.lcnt === 0
				);
			}, "arNoLine");
		},

		checkLineWindDirection: function() {
			var traces = this.getTraceInfo();
			for (var i = 0; i < traces.length; i++) {
				var blist = traces[i].blist;
				if (blist.length === 0) {
					continue;
				}

				this.failcode.add("lrAgainstWind");
				if (this.checkOnly) {
					break;
				}

				this.board.border.setnoerr();
				for (var j = 0; j < blist.length; j++) {
					this.setBorderErrorToWindBase(blist[j], blist[j].wind);
				}
			}
		},
		checkLineArrowDirection: function() {
			return this.checkLineArrowDirectionGeneric(null, "lrAgainstArrow");
		},
		checkLineArrowDirectionGeneric: function(filter, code) {
			var traces = this.getTraceInfo();
			for (var i = 0; i < traces.length; i++) {
				var clist = traces[i].clist;
				if (filter) {
					clist = clist.filter(filter);
				}
				if (clist.length === 0) {
					continue;
				}

				this.failcode.add(code);
				if (this.checkOnly) {
					break;
				}
				clist.seterr(1);
			}
		},

		setCellErrorToWindBase: function(cell, wind) {
			var cell2;
			cell.seterr(1);
			if (wind & 1) {
				cell2 = cell;
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.bottom;
				}
			}
			if (wind & 2) {
				cell2 = cell;
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.top;
				}
			}
			if (wind & 4) {
				cell2 = cell;
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.right;
				}
			}
			if (wind & 8) {
				cell2 = cell;
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.left;
				}
			}
		},
		setBorderErrorToWindBase: function(border, wind) {
			var cell2;
			border.seterr(1);
			if (wind & 1) {
				cell2 = border.sidecell[1];
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.bottom;
				}
			}
			if (wind & 2) {
				cell2 = border.sidecell[0];
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.top;
				}
			}
			if (wind & 4) {
				cell2 = border.sidecell[1];
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.right;
				}
			}
			if (wind & 8) {
				cell2 = border.sidecell[0];
				while (!cell2.isnull) {
					if (cell2.ques === 1) {
						cell2.seterr(1);
						break;
					}
					cell2 = cell2.adjacent.left;
				}
			}
		},

		getTraceInfo: function() {
			if (this._info.trace) {
				return this._info.trace;
			}
			var traces = [];
			for (var i = 0; i < this.board.linegraph.components.length; i++) {
				traces.push(this.searchTraceInfo(this.board.linegraph.components[i]));
			}
			return (this._info.trace = traces);
		},
		searchTraceInfo: function(path) {
			var blist = new this.klass.BorderList(path.getedgeobjs());
			var clist_sub = blist.cellinside().filter(function(cell) {
				return cell.lcnt !== 2;
			});
			var startcell =
				clist_sub.length === 0 ? blist[0].sideobj[0] : clist_sub[0];
			var dir = startcell.getdir(startcell.pathnodes[0].nodes[0].obj, 2);
			var pos = startcell.getaddr();

			var clist1 = [],
				clist2 = [],
				blist1 = [],
				blist2 = [];
			var info = {
				clist: new this.klass.CellList(), // 矢印に反して進んだセル
				blist: new this.klass.BorderList() // 風に反して進んだLine
			};
			var step = 0;

			while (1) {
				if (pos.oncell()) {
					var cell = pos.getc();

					if (step > 0 && cell === startcell) {
						break;
					} // 一周して戻ってきた

					var celldir = cell.qdir;
					if (cell.isShade()) {
						var border = cell.getaddr().movedir(celldir, 1);

						celldir =
							cell.isLineStraight() && border.getb().isLine()
								? [0, cell.DN, cell.UP, cell.RT, cell.LT][celldir]
								: cell.NDIR;
					}

					if (celldir !== cell.NDIR) {
						if (celldir === dir) {
							clist1.push(cell);
						} else {
							clist2.push(cell);
						}
					}

					var adb = cell.adjborder;
					if (step > 0 && cell.lcnt !== 2) {
						break;
					} else if (dir !== 1 && adb.bottom.isLine()) {
						dir = 2;
					} else if (dir !== 2 && adb.top.isLine()) {
						dir = 1;
					} else if (dir !== 3 && adb.right.isLine()) {
						dir = 4;
					} else if (dir !== 4 && adb.left.isLine()) {
						dir = 3;
					}
				} else {
					var border = pos.getb();
					if (!border.isLine()) {
						break;
					} // 途切れてたら終了

					if (border.wind !== 0) {
						if (border.wind & [0, 1, 2, 4, 8][dir]) {
							blist1.push(border);
						}
						if (border.wind & [0, 2, 1, 8, 4][dir]) {
							blist2.push(border);
						}
					}
				}

				pos.movedir(dir, 1);
				step++;
			}

			/* 矢印に反した数が少ない方を優先して出力する */
			var choice = 1;
			if (clist1.length < clist2.length) {
				choice = 1;
			} else if (clist1.length > clist2.length) {
				choice = 2;
			} else {
				/* 矢印が同じ場合、風に反した数が少ない方を優先して出力 */
				choice = blist1.length < blist2.length ? 1 : 2;
			}
			info.clist.extend(choice === 1 ? clist1 : clist2);
			info.blist.extend(choice === 1 ? blist1 : blist2);

			return info;
		}
	},
	"AnsCheck@fakearrow": {
		checklist: [
			"checkAdjacentShadeCell",
			"checkOverShadeArrow",
			"checkLineExist+",
			"checkCrossLine+",
			"checkBranchLine+",
			"checkAcrossArrow",
			"checkLineArrowDirectionUnshade",
			"checkLineArrowDirectionShade",
			"checkNoShadeArrow",
			"checkAllArrow",
			"checkDeadendLine++",
			"checkOneLoop"
		],

		checkOverShadeArrow: function() {
			this.checkAllBlock(
				this.board.roommgr,
				function(cell) {
					return cell.qans === 1;
				},
				function(w, h, a, n) {
					return a <= 1;
				},
				"bkShadeGe2"
			);
		},
		checkNoShadeArrow: function() {
			this.checkAllBlock(
				this.board.roommgr,
				function(cell) {
					return cell.qans === 1;
				},
				function(w, h, a, n) {
					return a >= 1;
				},
				"bkNoShade"
			);
		},

		checkLineArrowDirectionUnshade: function() {
			this.checkLineArrowDirectionGeneric(function(cell) {
				return !cell.isShade();
			}, "lrAgainstArrow");
		},
		checkLineArrowDirectionShade: function() {
			this.checkLineArrowDirectionGeneric(function(cell) {
				return cell.isShade();
			}, "lrFollowsFake");
		}
	}
});
