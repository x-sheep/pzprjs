//
// パズル固有スクリプト部 なわばり・フォーセルズ・ファイブセルズ版 nawabari.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["nawabari", "fourcells", "fivecells", "heteromino", "pentominous"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === "left" && this.isBorderMode()) {
						this.inputborder();
					} else {
						this.inputQsubLine();
					}
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					if (this.pid === "heteromino") {
						this.inputempty();
					} else {
						this.inputqnum();
					}
				}
			}
		},
		mouseinput_other: function() {
			if (this.inputMode === "empty") {
				this.inputempty();
			} else if (this.inputMode.indexOf("letter") === 0 && this.mousestart) {
				this.inputqnum();
			}
		},
		inputempty: function() {
			var cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) {
				return;
			}

			if (this.inputData === null) {
				this.inputData = cell.isEmpty() ? 0 : 7;
			}

			cell.setValid(this.inputData);
			this.mouseCell = cell;
		}
	},
	"MouseEvent@nawabari": {
		inputModes: { edit: ["number", "clear"], play: ["border", "subline"] }
	},
	"MouseEvent@fourcells,fivecells": {
		inputModes: {
			edit: ["empty", "number", "clear"],
			play: ["border", "subline"]
		}
	},
	"MouseEvent@pentominous": {
		inputModes: {
			edit: ["empty", "letter", "letter-", "clear"],
			play: ["border", "letter", "letter-", "subline"]
		}
	},
	"MouseEvent@heteromino": {
		inputModes: { edit: ["empty", "clear"], play: ["border", "subline"] }
	},
	"MouseEvent@fourcells,fivecells,heteromino": {
		inputModes: {
			edit: ["empty", "number", "clear"],
			play: ["border", "subline"]
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		key_inputvalid: function() {
			var cell = this.cursor.getc();
			if (!cell.isnull) {
				cell.setValid(cell.ques !== 7 ? 7 : 0);
			}
		}
	},

	"KeyEvent@fourcells,fivecells,heteromino": {
		keyinput: function(ca) {
			if (ca === "w") {
				this.key_inputvalid();
			} else if (this.pid !== "heteromino") {
				this.key_inputqnum(ca);
			}
		}
	},

	"KeyEvent@pentominous": {
		enableplay: true,

		keyinput: function(ca) {
			if (this.puzzle.editmode && ca === "q") {
				this.key_inputvalid();
			} else {
				this.key_inputqnum(ca);
			}
		},

		getNewNumber: function(cell, ca, cur) {
			var idx = this.klass.Cell.prototype.letters.toLowerCase().indexOf(ca);
			if (idx !== -1) {
				return idx;
			} else if (ca === "-") {
				return -2;
			} else if (ca === "BS" || ca === "-") {
				return -1;
			}
			return null;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		getdir4BorderCount: function() {
			var cnt = 0,
				cblist = this.getdir4cblist();
			for (var i = 0; i < cblist.length; i++) {
				var tcell = cblist[i][0],
					tborder = cblist[i][1];
				if (tcell.isnull || tcell.isEmpty() || tborder.isBorder()) {
					cnt++;
				}
			}
			return cnt;
		},

		setValid: function(inputData) {
			this.setQues(inputData);
			this.setQnum(-1);
			this.adjborder.top.qans = 0;
			this.adjborder.bottom.qans = 0;
			this.adjborder.right.qans = 0;
			this.adjborder.left.qans = 0;
			this.drawaround();
			this.board.roommgr.rebuild();
		}
	},
	"Cell@nawabari": {
		maxnum: 4,
		minnum: 0
	},
	"Cell@fourcells": {
		maxnum: 3
	},
	"Cell@fivecells": {
		maxnum: 3,
		minnum: 0
	},
	"Cell@pentominous": {
		enableSubNumberArray: true,
		letters: "FILNPTUVWXYZ",
		lettershapes: [
			"3:001111010",
			"1:11111",
			"2:01010111",
			"2:01011110",
			"2:011111",
			"3:001111001",
			"2:110111",
			"3:001001111",
			"3:001011110",
			"3:010111010",
			"2:01011101",
			"3:001111100"
		],

		minnum: 0,
		maxnum: 11
	},
	"CellList@heteromino": {
		triminoShape: function() {
			if (this.length !== 3) {
				return -1;
			}
			var rect = this.getRectSize();
			var id = 0;
			for (var i = 0; i < this.length; i++) {
				var cell = this[i];
				var dx = (cell.bx - rect.x1) >> 1,
					dy = (cell.by - rect.y1) >> 1;
				if (dx >= 2 || dy >= 2) {
					continue;
				}
				id += 1 << (dx + 2 * dy);
			}
			return id;
		}
	},

	Border: {
		isGrid: function() {
			return this.sidecell[0].isValid() && this.sidecell[1].isValid();
		},
		isBorder: function() {
			return this.qans > 0 || this.isQuesBorder();
		},
		isQuesBorder: function() {
			return !!(this.sidecell[0].isEmpty() ^ this.sidecell[1].isEmpty());
		},

		prehook: {
			qans: function() {
				return !this.isGrid();
			},
			qsub: function() {
				return !this.isGrid();
			}
		}
	},

	Board: {
		hasborder: 2
	},
	"Board@fourcells,fivecells,pentominous": {
		initBoardSize: function(col, row) {
			this.common.initBoardSize.call(this, col, row);

			var odd = (col * row) % (this.pid === "fourcells" ? 4 : 5);
			if (odd >= 1) {
				this.getc(this.minbx + 1, this.minby + 1).ques = 7;
			}
			if (odd >= 2) {
				this.getc(this.maxbx - 1, this.minby + 1).ques = 7;
			}
			if (odd >= 3) {
				this.getc(this.minbx + 1, this.maxby - 1).ques = 7;
			}
			if (odd >= 4) {
				this.getc(this.maxbx - 1, this.maxby - 1).ques = 7;
			}
		}
	},

	"Board@pentominous#1": {
		subclear: function() {
			this.cell.ansclear();
			this.common.subclear.call(this);
		}
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		numbercolor_func: "qnum",

		paint: function() {
			this.drawBGCells();

			this.drawValidDashedGrid();
			this.drawQansBorders();
			this.drawQuesBorders();

			this.drawQuesNumbers();
			this.drawBorderQsubs();

			if (this.pid === "heteromino") {
				this.drawChassis();
			}

			if (this.pid === "pentominous") {
				this.drawTargetSubNumber();
				this.drawSubNumbers();
				this.drawAnsNumbers();
				// TODO redraw cursor when changing any mouse mode
				this.drawCursor(
					true,
					this.puzzle.editmode ||
						this.puzzle.mouse.inputMode.indexOf("letter") === 0
				);
			} else {
				this.drawTarget();
			}
		},

		getQuesBorderColor: function(border) {
			return border.isQuesBorder() ? this.quescolor : null;
		},

		drawValidDashedGrid: function() {
			var g = this.vinc("grid_waritai", "crispEdges", true);

			var dasharray = this.getDashArray();

			g.lineWidth = 1;
			g.strokeStyle = this.gridcolor;

			var blist = this.range.borders;
			for (var n = 0; n < blist.length; n++) {
				var border = blist[n];
				g.vid = "b_grid_wari_" + border.id;
				if (border.isGrid()) {
					var px = border.bx * this.bw,
						py = border.by * this.bh;
					if (border.isVert()) {
						g.strokeDashedLine(px, py - this.bh, px, py + this.bh, dasharray);
					} else {
						g.strokeDashedLine(px - this.bw, py, px + this.bw, py, dasharray);
					}
				} else {
					g.vhide();
				}
			}
		}
	},

	"Graphic@heteromino": {
		getBGCellColor: function(cell) {
			if (!cell.isValid()) {
				return "black";
			}
			return this.getBGCellColor_error1(cell);
		}
	},

	"Graphic@pentominous": {
		getNumberTextCore: function(num) {
			return num === -2 ? "?" : this.klass.Cell.prototype.letters[num] || "";
		},

		getAnsNumberColor: function(cell) {
			return !cell.trial ? this.subcolor : this.trialcolor;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decodeFivecells();
		},
		encodePzpr: function(type) {
			this.encodeFivecells();
		},

		// decode/encodeNumber10関数の改造版にします
		decodeFivecells: function() {
			for (var c = 0; c < this.board.cell.length; c++) {
				this.board.cell[c].setQues(0);
			}

			var c = 0,
				i = 0,
				bstr = this.outbstr,
				bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				var cell = bd.cell[c],
					ca = bstr.charAt(i);

				cell.ques = 0;
				if (ca === "7") {
					cell.ques = 7;
				} else if (ca === ".") {
					cell.qnum = -2;
				} else if (this.include(ca, "0", "9")) {
					cell.qnum = parseInt(ca, 10);
				} else if (this.include(ca, "a", "z")) {
					c += parseInt(ca, 36) - 10;
				}

				c++;
				if (c >= bd.cell.length) {
					break;
				}
			}
			this.outbstr = bstr.substr(i);
		},
		encodeFivecells: function() {
			var cm = "",
				count = 0,
				bd = this.board;
			for (var c = 0; c < bd.cell.length; c++) {
				var pstr = "",
					qn = bd.cell[c].qnum,
					qu = bd.cell[c].ques;

				if (qu === 7) {
					pstr = "7";
				} else if (qn === -2) {
					pstr = ".";
				} else if (qn !== -1) {
					pstr = qn.toString(10);
				} // 0～3
				else {
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
	"Encode@pentominous": {
		decodePzpr: function(type) {
			var bd = this.board;
			this.genericDecodeNumber16(bd.cell.length, function(c, val) {
				if (val === 12) {
					bd.cell[c].ques = 7;
				} else {
					bd.cell[c].qnum = val;
				}
			});
		},
		encodePzpr: function(type) {
			var bd = this.board;
			this.genericEncodeNumber16(bd.cell.length, function(c) {
				return bd.cell[c].isEmpty() ? 12 : bd.cell[c].qnum;
			});
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeCell(function(cell, ca) {
				cell.ques = 0;
				if (ca === "*") {
					cell.ques = 7;
				} else if (ca === "-") {
					cell.qnum = -2;
				} else if (ca !== ".") {
					cell.qnum = +ca;
				}
			});
			this.decodeBorderAns();
			this.decodeCellAnumsub();
		},
		encodeData: function() {
			if (this.pid === "fourcells") {
				this.filever = 1;
			}
			this.encodeCell(function(cell) {
				if (cell.ques === 7) {
					return "* ";
				} else if (cell.qnum === -2) {
					return "- ";
				} else if (cell.qnum >= 0) {
					return cell.qnum + " ";
				} else {
					return ". ";
				}
			});
			this.encodeBorderAns();
			this.encodeCellAnumsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkRoomRect@nawabari",
			"checkNoNumber@nawabari",
			"checkDoubleNumber@nawabari",
			"checkOverThreeCells@heteromino",
			"checkOverFourCells@fourcells",
			"checkOverFiveCells@fivecells,pentominous",
			"checkdir4BorderAns@!heteromino,!pentominous",
			"checkLetterBlock@pentominous",
			"checkDifferentShapeBlock@pentominous",
			"checkBorderDeadend+",
			"checkLessThreeCells@heteromino",
			"checkLessFourCells@fourcells",
			"checkLessFiveCells@fivecells,pentominous",
			"checkTouchDifferent@heteromino"
		],

		checkOverThreeCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a >= 3;
				},
				"bkSizeLt3"
			);
		},
		checkLessThreeCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a <= 3;
				},
				"bkSizeGt3"
			);
		},
		checkOverFourCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a >= 4;
				},
				"bkSizeLt4"
			);
		},
		checkLessFourCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a <= 4;
				},
				"bkSizeGt4"
			);
		},
		checkOverFiveCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a >= 5;
				},
				"bkSizeLt5"
			);
		},
		checkLessFiveCells: function() {
			this.checkAllArea(
				this.board.roommgr,
				function(w, h, a, n) {
					return a <= 5;
				},
				"bkSizeGt5"
			);
		},

		checkdir4BorderAns: function() {
			this.checkAllCell(function(cell) {
				return cell.isValidNum() && cell.getdir4BorderCount() !== cell.qnum;
			}, "nmBorderNe");
		},

		checkTouchDifferent: function() {
			var bd = this.board;
			for (var i = 0; i < bd.border.length; i++) {
				var b = bd.border[i];
				if (!b.isBorder()) {
					continue;
				}
				var cell1 = b.sidecell[0],
					cell2 = b.sidecell[1];
				if (!cell1.isValid() || !cell2.isValid()) {
					continue;
				}

				var l1 = cell1.room.clist,
					l2 = cell2.room.clist;
				if (l1.length !== 3 || l2.length !== 3) {
					continue;
				}
				if (l1.triminoShape() !== l2.triminoShape()) {
					continue;
				}

				this.failcode.add("bkSameTouch");
				if (this.checkOnly) {
					return;
				}
				l1.seterr(1);
				l2.seterr(1);
			}
		},

		checkLetterBlock: function() {
			this.checkAllCell(function(cell) {
				return (
					cell.qnum >= 0 &&
					cell.room.clist.length === 5 &&
					cell.lettershapes[cell.qnum] !==
						cell.room.clist.getBlockShapes().canon
				);
			}, "nmShapeNe");
		},

		checkDifferentShapeBlock: function() {
			var sides = this.board.roommgr.getSideAreaInfo();
			for (var i = 0; i < sides.length; i++) {
				var area1 = sides[i][0],
					area2 = sides[i][1];
				if (area1.clist.length !== 5 || area2.clist.length !== 5) {
					continue;
				}
				if (this.isDifferentShapeBlock(area1, area2)) {
					continue;
				}

				this.failcode.add("bsSameShape");
				if (this.checkOnly) {
					break;
				}
				area1.clist.seterr(1);
				area2.clist.seterr(1);
			}
		}
	}
});
