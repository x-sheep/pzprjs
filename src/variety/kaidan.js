(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["kaidan"], {
	MouseEvent: {
		// TODO completion for numbers
		// TODO completion for line ends
		// TODO rename input modes
		use: true,
		RBShadeCell: true,
		inputModes: {
			edit: ["number", "clear"],
			play: ["line", "shade", "unshade", "completion"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.btn === "right") {
					this.inputdragcross();
				} else if (this.mousestart || this.mousemove) {
					this.inputLine();
				}
				if (this.mouseend && this.notInputted()) {
					this.inputcell();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
			}
		},
		inputdragcross: function() {
			if (this.firstPoint.bx === null) {
				this.firstPoint.set(this.inputPoint);
			} else if (this.inputData === null) {
				var dx = this.inputPoint.bx - this.firstPoint.bx,
					dy = this.inputPoint.by - this.firstPoint.by;
				if (dx * dx + dy * dy > 0.1) {
					// TODO should not change cross to circle when dragging in 1 button mode
					this.inputShade();
				}
			} else {
				this.inputShade();
			}
		},
		inputqcmp: function() {
			var cell = this.getcell();
			if (cell.isnull || cell.noNum()) {
				return;
			}

			cell.setQcmp(+!cell.qcmp);
			cell.draw();

			this.mousereset();
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
		numberRemainsUnshaded: true,
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

	Graphic: {
		hideHatena: true,

		gridcolor_type: "LIGHT",

		fontShadecolor: "white",
		fgcellcolor_func: "qnum",
		qcmpcolor: "rgb(127,127,127)",
		// TODO draw rectangle ends

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
		drawLines: function() {
			var g = this.vinc("line", "crispEdges");

			var blist = this.range.borders;
			for (var i = 0; i < blist.length; i++) {
				var border = blist[i],
					color = this.getLineColor(border);

				if (!!color) {
					var px = border.bx * this.bw,
						py = border.by * this.bh;
					var mx = this.bw / 2;
					var my = this.bh / 2;
					var isvert = this.board.borderAsLine === border.isVert();
					var lm = this.lm + this.addlw / 2;

					g.fillStyle = color;
					if (isvert) {
						g.vid = "b_line1_" + border.id;
						g.fillRectCenter(px - mx, py, lm, this.bh + lm + my);
						g.vid = "b_line2_" + border.id;
						g.fillRectCenter(px + mx, py, lm, this.bh + lm + my);
					} else {
						g.vid = "b_line1_" + border.id;
						g.fillRectCenter(px, py - my, this.bw + lm + mx, lm);
						g.vid = "b_line2_" + border.id;
						g.fillRectCenter(px, py + my, this.bw + lm + mx, lm);
					}
				} else {
					g.vid = "b_line1_" + border.id;
					g.vhide();
					g.vid = "b_line2_" + border.id;
					g.vhide();
				}
			}
			this.addlw = 0;
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

	Encode: {
		decodePzpr: function(type) {
			this.decode4Cell();
		},
		encodePzpr: function(type) {
			this.encode4Cell();
		}
	},
	FileIO: {
		// TODO implement
		decodeData: function() {},
		encodeData: function() {}
	},

	AnsCheck: {
		checklist: [
			"checkLineOverlap",
			"checkLineOnShadeCell",
			"checkAdjacentShadeCell",
			"checkDir4ShadeOver",
			"checkConnectUnshade",
			"checkShortEnds",
			"checkLengthConsecutive",
			"checkDir4ShadeLess",
			"checkEmptyCell_kaidan+"
		],

		checkDir4ShadeOver: function() {
			this.checkDir4Cell(
				function(cell) {
					return cell.isShade();
				},
				2,
				"nmShadeGt"
			);
		},
		checkDir4ShadeLess: function() {
			this.checkDir4Cell(
				function(cell) {
					return cell.isShade();
				},
				1,
				"nmShadeLt"
			);
		},
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

		checkShortEnds: function() {
			this.checkSideCell(function(cell1, cell2) {
				if (cell1.lcnt !== 1 || cell2.lcnt !== 1) {
					return false;
				}
				var cb = cell1.board.getb(
					(cell1.bx + cell2.bx) / 2,
					(cell1.by + cell2.by) / 2
				);
				if (cb.line) {
					return false;
				}

				var b1 = cb.relbd((cell1.bx - cb.bx) * 2, (cell1.by - cb.by) * 2);
				var b2 = cb.relbd((cell2.bx - cb.bx) * 2, (cell2.by - cb.by) * 2);

				return b1.line && b2.line;
			}, "lnEnds");
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
