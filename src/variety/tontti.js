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
				this.cross[id].initAdjacent();
			}
		}
	},
	Border: {
		enableLineNG: true
	},
	LineGraph: {
		enabled: true,

		rebuild2: function() {
			var excells = this.board.excell;
			for (var c = 0; c < excells.length; c++) {
				this.setComponentRefs(excells[c], null);
				this.resetObjNodeList(excells[c]);
			}

			this.common.rebuild2.call(this);
		}
	},
	"AreaTonttiGraph:AreaRoomGraph": {
		enabled: true,
		pointgroup: "cross",
		relation: { "border.line": "separator" },
		isedgevalidbylinkobj: function(linkobj) {
			return !linkobj.line;
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
				sidenodeobj = border.sideobj;
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
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		paint: function() {
			this.drawBGCells();
			this.drawGrid();
			this.drawBorders();

			this.drawQuesNumbers();
			this.drawLines();
			this.drawPekes();

			this.drawChassis();
			this.drawMBs();

			this.drawTarget();
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
		checklist: ["checkCrossLine", "checkSameConnected", "checkDeadendLine+"],

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
		}
	},

	FailCode: {
		lnAdjacent: [
			"(please translate) Identical line shapes are connected.",
			"Identical line shapes are connected."
		]
	}
});
