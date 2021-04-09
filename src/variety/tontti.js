//
// パズル固有スクリプト部 遠い誓い版 toichika.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["tontti"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["number", "clear"],
			play: ["line", "subcircle", "subcross", "clear"]
		},

		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === "left") {
						this.inputLine();
					} else if (this.btn === "right") {
						this.inputpeke();
					}
				} else if (this.mouseend && this.notInputted()) {
					if (this.inputpeke_ifborder()) {
						return;
					}
					this.inputMB();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					this.inputborder();
				} else if (this.mouseend && this.notInputted()) {
					this.inputqnum();
				}
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function() {
			return this.board.cols * this.board.rows;
		},
		noLP: function(dir) {
			return this.getNum() !== -1;
		}
	},
	CellList: {
		getQnumCell: function() {
			var ret = null;
			for (var i = 0, len = this.length; i < len; i++) {
				if (this[i].isNum()) {
					if (ret) {
						return this.board.emptycell;
					}
					ret = this[i];
				}
			}
			return ret || this.board.emptycell;
		}
	},
	ExCell: {
		noLP: function(dir) {
			return false;
		}
	},
	Board: {
		hasborder: 2,
		hasexcell: 2,
		hascross: 2,

		rows: 6,
		cols: 6,

		addExtraInfo: function() {
			this.tonttigraph = this.addInfoList(this.klass.AreaTonttiGraph);
		},

		setposCrosses: function() {
			this.common.setposCrosses.call(this);

			for (var id = 0; id < this.cross.length; id++) {
				var cross = this.cross[id];
				cross.initAdjacent();
				cross.cell = this.getc(cross.bx + 1, cross.by + 1);
			}
		}
	},
	Border: {
		enableLineNG: true
	},
	"AreaTonttiGraph:AreaRoomGraph": {
		enabled: true,
		pointgroup: "cross",
		relation: { "border.line": "separator" },
		isedgevalidbylinkobj: function(linkobj) {
			return !linkobj.line;
		},
		seterr: function(component, val) {
			component.getnodeobjs().seterr(val);
		},
		setExtraData: function(component) {
			var items = component.getnodeobjs();
			var cells = [];

			for (var id = 0; id < items.length; id++) {
				var cross = items[id];
				if (!cross.cell.isnull) {
					cells.push(cross.cell);
				}
			}

			component.clist = new this.klass.CellList(cells);
		},
		setComponentRefs: function(obj, component) {
			obj.tontti = component;
		},
		getObjNodeList: function(nodeobj) {
			return nodeobj.tonttinodes;
		},
		resetObjNodeList: function(nodeobj) {
			nodeobj.tonttinodes = [];
		},
		getSideObjByLinkObj: function(border) {
			return border.sidecross;
		},
		getSideObjByNodeObj: function(cross) {
			var crosses = [];
			for (var key in cross.adjacent) {
				var cross2 = cross.adjacent[key];
				if (!cross2.isnull) {
					crosses.push(cross2);
				}
			}
			return crosses;
		},
		getSideNodesByLinkObj: function(border) {
			var sidenodes = [],
				sidenodeobj = border.sidecross;
			for (var i = 0; i < sidenodeobj.length; i++) {
				var nodes = this.getObjNodeList(sidenodeobj[i]);
				if (!!nodes && !!nodes[0]) {
					sidenodes.push(nodes[0]);
				}
			}
			return sidenodes;
		},
		getSideNodesBySeparator: function(border) {
			var sidenodes = this.getSideNodesByLinkObj(border);
			return sidenodes.length >= 2 ? sidenodes : null;
		},
		resetBorderCount: function() {
			var bd = this.board,
				borders = bd.border;
			/* 外枠のカウントをあらかじめ足しておく */
			for (var c = 0; c < bd.cell.length; c++) {
				var cross = bd.cell[c];
				cross.lcnt = 0;
			}
			for (var c = 0; c < bd.excell.length; c++) {
				var cross = bd.excell[c];
				cross.lcnt = 0;
			}
			for (var id = 0; id < borders.length; id++) {
				if (!this.isedgevalidbylinkobj(borders[id])) {
					this.incdecBorderCount(borders[id], true);
				}
			}
		},
		incdecBorderCount: function(border, isset) {
			for (var i = 0; i < 2; i++) {
				var cross = border.sidecell[i];
				if (!cross.isnull) {
					if (isset) {
						cross.lcnt++;
					} else {
						cross.lcnt--;
					}
				}
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		paint: function() {
			this.drawBGCells();
			this.drawBGCrosses();
			this.drawGrid();
			this.drawBorders();

			this.drawQuesNumbers();
			this.drawLines();
			this.drawPekes();

			this.drawChassis();
			this.drawMBs();

			this.drawTarget();
		},

		drawBGCrosses: function() {
			var g = this.context;
			var clist = this.range.crosses;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i],
					color = cell.error === 1 ? this.errbcolor1 : null;
				g.vid = "c_cross_" + cell.id;
				if (!!color) {
					g.fillStyle = color;
					g.fillRectCenter(
						cell.bx * this.bw,
						cell.by * this.bh,
						this.bw + 0.5,
						this.bh + 0.5
					);
				} else {
					g.vhide();
				}
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decodeNumber16();
		},
		encodePzpr: function(type) {
			this.encodeNumber16();
		}
	},
	FileIO: {
		decodeData: function() {
			this.decodeCellQnum();
			this.decodeBorderLine();
			this.decodeCellQsub();
		},
		encodeData: function() {
			this.encodeCellQnum();
			this.encodeBorderLine();
			this.encodeCellQsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkCrossLine",
			"checkNoNumber",
			"checkSameConnected",
			"checkNumberAndUnshadeSize",
			"checkDoubleNumber",
			"checkDeadendLine+"
		],

		checkLineCount: function(val, code) {
			this.checkAllCell(function(cell) {
				return cell.lcnt === val;
			}, code);
		},

		checkSameConnected: function() {
			this.checkSideCell(function(cell1, cell2) {
				if (cell1.group !== "cell" || cell2.group !== "cell") {
					return false;
				}

				if (cell1.by === cell2.by && !cell1.adjborder.right.line) {
					return false;
				}
				if (cell1.bx === cell2.bx && !cell1.adjborder.bottom.line) {
					return false;
				}

				if (cell1.lcnt === 3) {
					return cell2.lcnt === 3;
				}
				if (cell1.isLineStraight()) {
					return cell2.isLineStraight();
				}
				if (cell1.isLineCurve()) {
					return cell2.isLineCurve();
				}

				return false;
			}, "lnAdjacent");
		},
		checkNoNumber: function() {
			this.checkAllBlock(
				this.board.tonttigraph,
				function(cell) {
					return cell.isNum();
				},
				function(w, h, a, n) {
					return a !== 0;
				},
				"bkNoNum"
			);
		},
		checkDoubleNumber: function() {
			this.checkAllBlock(
				this.board.tonttigraph,
				function(cell) {
					return cell.isNum();
				},
				function(w, h, a, n) {
					return a < 2;
				},
				"bkNumGe2"
			);
		},
		checkNumberAndUnshadeSize: function() {
			this.checkAllBlock(
				this.board.tonttigraph,
				function(cell) {
					return cell.lcnt === 0;
				},
				function(w, h, a, n) {
					return n <= 0 || n === a;
				},
				"bkSizeNe"
			);
		}
	},

	FailCode: {
		lnAdjacent: [
			"(please translate) Identical line shapes are connected.",
			"Identical line shapes are connected."
		]
	}
});
