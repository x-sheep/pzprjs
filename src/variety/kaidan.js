(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["kaidan"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: {
			edit: ["number", "clear"],
			play: ["line", "shade", "unshade"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					this.inputLine();
				} else if (this.mouseend && this.notInputted()) {
					this.inputcell();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
			}
		}
	},

	KeyEvent: {
		enablemake: true
	},
	Border: {
		prehook: {
			line: function(num) {
				return (num && this.isLineNG()) || this.checkFormCurve(num);
			}
		}
	},

	Cell: {
		maxnum: 4,
		minnum: 0,
		noLP: function(dir) {
			return this.isNum() || this.qans;
		}
	},

	Board: {
		cols: 8,
		rows: 8,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		makeClist: true
	},
	AreaUnshadeGraph: {
		enabled: true,
		relation: { "cell.qnum": "node", "cell.qans": "node" },
		isnodevalid: function(cell) {
			return !cell.noLP();
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		gridcolor_type: "LIGHT",

		fontShadecolor: "white",
		fgcellcolor_func: "qnum",

		paint: function() {
			this.drawBGCells();
			this.drawGrid();

			this.drawQuesCells();
			this.drawQuesNumbers();

			this.drawCircles();
			this.drawCrosses();

			this.drawLines();

			this.drawChassis();

			this.drawTarget();
		},
		drawCrosses: function() {
			var g = this.vinc("cell_mb", "auto", true);
			g.lineWidth = 1;

			var rsize = this.cw * 0.25;
			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i],
					px,
					py;
				g.vid = "c_MB2_" + cell.id;
				if (cell.qsub > 0) {
					px = cell.bx * this.bw;
					py = cell.by * this.bh;
					g.lineWidth = (1 + this.cw / 40) | 0;
					g.strokeStyle = !cell.trial ? this.mbcolor : "rgb(192, 192, 192)";
					g.strokeCross(px, py, rsize);
				} else {
					g.vhide();
				}
			}
		},

		getQuesNumberColor: function(cell) {
			return cell.qcmp === 1 ? this.qcmpcolor : this.fontShadecolor;
		},
		getCircleStrokeColor: function(cell) {
			if (cell.qans === 1) {
				if (cell.error === 1) {
					return this.errcolor1;
				} else if (cell.trial) {
					return this.trialcolor;
				} else {
					return this.quescolor;
				}
			}
			return null;
		},
		getCircleFillColor: function(cell) {
			return null;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decode4Cell();
		},
		encodePzpr: function(type) {
			this.encode4Cell();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {},
		encodeData: function() {}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineOverlap",
			"checkLineOnShadeCell",
			"checkAdjacentShadeCell",
			"checkConnectUnshade",
			"checkLengthConsecutive",
			"checkEmptyCell_kaidan+"
		],
		// TODO short ends
		checkLengthConsecutive: function() {
			this.checkSideCell(function(cell1, cell2) {
				return (
					cell1.lcnt &&
					cell2.lcnt &&
					cell1.path !== cell2.path &&
					Math.abs(cell1.path.clist.length - cell2.path.clist.length) !== 1
				);
			}, "lnConsecutive");
		},

		checkLineOverlap: function() {
			this.checkAllCell(function(cell) {
				return cell.lcnt > 2 || cell.isLineCurve();
			}, "laCurve");
		},
		checkEmptyCell_kaidan: function() {
			this.checkAllCell(function(cell) {
				return cell.lcnt === 0 && !cell.isShade() && cell.noNum();
			}, "ceEmpty");
		}
	}
});
