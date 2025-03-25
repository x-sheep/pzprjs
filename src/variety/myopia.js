//
// myopia.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["myopia", "shiftopia"], {
	MouseEvent: {
		inputModes: {
			edit: ["arrow", "undef", "clear", "info-line"],
			play: [
				"line",
				"peke",
				"bgcolor",
				"bgcolor1",
				"bgcolor2",
				"clear",
				"info-line"
			]
		},
		mouseinput_auto: function() {
			var puzzle = this.puzzle;
			if (puzzle.playmode) {
				if (this.checkInputBGcolor()) {
					this.inputBGcolor();
				} else if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						this.prevPos.reset();
						this.inputpeke();
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					}
				}
			} else if (puzzle.editmode) {
				if (this.mousestart) {
					this.setcursor(this.getcell());
				}
				this.inputarrow_cell();
			}
		},

		inputarrow_cell_main: function(cell, dir) {
			var newdir = Math.max(0, cell.qnum);
			newdir ^= 1 << (dir - 1);
			if (newdir === 0) {
				newdir = -1;
			}
			cell.setNum(newdir);
		},

		checkInputBGcolor: function() {
			var inputbg = this.puzzle.execConfig("bgcolor");
			if (inputbg) {
				if (this.mousestart) {
					inputbg = this.getpos(0.25).oncell();
				} else if (this.mousemove) {
					inputbg = this.inputData >= 10;
				} else {
					inputbg = false;
				}
			}
			return inputbg;
		}
	},
	"MouseEvent@shiftopia": {
		inputModes: {
			edit: ["arrow", "undef", "clear", "info-line"],
			play: ["line", "bgcolor", "bgcolor1", "bgcolor2", "clear", "completion"]
		},
		inputlight: function() {
			var cell = this.getcell();
			if (cell.isnull) {
				return;
			}

			if (this.inputdark(cell, 1)) {
				return;
			}

			if (this.mouseend && this.notInputted()) {
				this.mouseCell = this.board.emptycell;
			}
			this.inputBGcolor();
		},
		inputqcmp: function(val) {
			var cell = this.getcell();
			if (cell.isnull) {
				return;
			}

			this.inputdark(cell, val, true);
		},
		inputdark: function(cell, val, multi) {
			var cell = this.getcell();
			if (cell.isnull || (cell === this.mouseCell && multi)) {
				return false;
			}

			var targetcell = !this.puzzle.execConfig("dispmove") ? cell : cell.base,
				distance = 0.6,
				dx = this.inputPoint.bx - cell.bx /* ここはtargetcellではなくcell */,
				dy = this.inputPoint.by - cell.by;
			if (
				targetcell.isNum() &&
				(this.inputMode === "completion" ||
					(targetcell.qnum === -2 && dx * dx + dy * dy < distance * distance))
			) {
				if (this.inputData === null) {
					this.inputData = targetcell.qcmp !== val ? 21 : 20;
				}

				targetcell.setQcmp(this.inputData === 21 ? val : 0);
				cell.draw();
				this.mouseCell = cell;
				return true;
			}
			this.mouseCell = cell;
			return false;
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart) {
					var cell = this.getcell();
					this.initFirstCell(cell);
				}

				if (this.inputData >= 20) {
					this.inputdark(cell, 1, true);
				} else if (this.btn === "right" && this.pid === "timebomb") {
					this.inputBGcolor();
				} else if (this.mousestart || this.mousemove) {
					this.inputLine();
				} else if (this.mouseend && this.notInputted()) {
					this.inputlight();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.setcursor(this.getcell());
				}
				this.inputarrow_cell();
			}
		}
	},

	KeyEvent: {
		enablemake: true,
		moveTarget: function(ca) {
			if (ca.match(/shift/)) {
				return false;
			}
			return this.moveTCell(ca);
		},

		keyinput: function(ca) {
			var cell = this.cursor.getc();
			var dir = 0;
			if (ca === "1" || ca === "w" || ca === "shift+up") {
				dir = 1;
			} else if (ca === "2" || ca === "s" || ca === "shift+right") {
				dir = 4;
			} else if (ca === "3" || ca === "z" || ca === "shift+down") {
				dir = 2;
			} else if (ca === "4" || ca === "a" || ca === "shift+left") {
				dir = 3;
			}

			if (dir) {
				this.puzzle.mouse.inputarrow_cell_main(cell, dir);
				cell.draw();
			} else if (ca === "5" || ca === "q" || ca === "-") {
				this.key_inputqnum("s1");
			} else if (ca === "6" || ca === "e" || ca === " " || ca === "BS") {
				this.key_inputqnum(" ");
			}
		}
	},

	Cell: {
		numberAsObject: true,
		maxnum: 15,
		seterr: function(num) {
			if (this.board.isenableSetError()) {
				this.error |= num;
			}
		}
	},
	"Cell@shiftopia": {
		isCmp: function() {
			return (
				(!this.puzzle.execConfig("dispmove") ? this : this.base).qcmp === 1
			);
		}
	},

	BoardExec: {
		adjustBoardData: function(key, d) {
			this.adjustCellQnumArrow(key, d);
		},
		getTranslateDir: function(key) {
			var trans = {};
			switch (key) {
				case this.FLIPY:
					trans = { 1: 2, 2: 1, 5: 6, 6: 5, 9: 10, 10: 9, 13: 14, 14: 13 };
					break;
				case this.FLIPX:
					trans = { 4: 8, 5: 9, 6: 10, 7: 11, 8: 4, 9: 5, 10: 6, 11: 7 };
					break;
				case this.TURNR:
					trans = {
						1: 8,
						2: 4,
						3: 12,
						4: 1,
						5: 9,
						6: 5,
						7: 13,
						8: 2,
						9: 10,
						10: 6,
						11: 14,
						12: 3,
						13: 11,
						14: 7
					};
					break;
				case this.TURNL:
					trans = {
						1: 4,
						2: 8,
						3: 12,
						4: 2,
						5: 6,
						6: 10,
						7: 14,
						8: 1,
						9: 5,
						10: 9,
						11: 13,
						12: 3,
						13: 7,
						14: 11
					};
					break;
			}
			return trans;
		}
	},

	"Board@myopia": {
		hasborder: 2,
		borderAsLine: true,

		operate: function(type) {
			switch (type) {
				case "outlineshaded":
					this.outlineShaded();
					break;
				default:
					this.common.operate.call(this, type);
					break;
			}
		},

		outlineShaded: function() {
			this.border.each(function(border) {
				border.updateShaded();
			});
		}
	},
	"Board@shiftopia": {
		hasborder: 1
	},

	"Border@myopia": {
		updateShaded: function() {
			var c0 = this.sidecell[0],
				c1 = this.sidecell[1];
			var qsub1 = c0.isnull ? 2 : c0.qsub;
			var qsub2 = c1.isnull ? 2 : c1.qsub;
			if (qsub1 === 0 || qsub2 === 0) {
				return;
			}
			if (qsub1 === qsub2) {
				this.setLineVal(0);
			} else {
				this.setLine();
			}
			this.draw();
		}
	},
	"Border@shiftopia": {
		prehook: {
			line: function(num) {
				return this.puzzle.execConfig("dispmove") && this.checkFormCurve(num);
			}
		}
	},

	LineGraph: {
		enabled: true
	},
	"LineGraph@shiftopia": {
		moveline: true
	},

	"Graphic@myopia": {
		irowake: true,
		margin: 0.5
	},

	Graphic: {
		bgcellcolor_func: "qsub2",
		numbercolor_func: "qnum",

		paint: function() {
			this.drawBGCells();

			if (this.pid === "shiftopia") {
				this.drawGrid();
				this.drawTip();
				this.drawDepartures();
				this.drawLines();
				this.drawCircles();
			} else {
				this.drawLines();
				this.drawBaseMarks();
			}
			this.drawCrossErrors();
			this.drawArrowCombinations();
			this.drawHatenas();
			this.drawPekes();
			if (this.pid === "shiftopia") {
				this.drawChassis();
			}
			this.drawTarget();
		},

		repaintParts: function(blist) {
			this.range.crosses = blist.crossinside();
			this.drawBaseMarks();
		},

		getQuesNumberColor: function(cell, i) {
			if (cell.error & 1 || cell.error & (8 << i)) {
				return this.errcolor1;
			}
			return this.quescolor;
		},

		drawArrowCombinations: function() {
			var g = this.vinc("cell_arrow");

			var inner = this.cw * 0.25;
			var clist = this.range.cells;

			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i];
				var num = Math.max(0, cell.base ? cell.base.qnum : cell.qnum);

				for (var dir = 1; dir <= 4; dir++) {
					if (num & (1 << (dir - 1))) {
						var px = cell.bx * this.bw,
							py = cell.by * this.bh,
							px2 = px,
							py2 = py;
						var idx = [0, 0, 0, 0];

						switch (dir) {
							case cell.UP:
								idx = [0.5, 0.75, -0.5, 0.75];
								py -= this.bh * 0.8;
								break;
							case cell.DN:
								idx = [0.5, -0.75, -0.5, -0.75];
								py += this.bh * 0.8;
								break;
							case cell.LT:
								idx = [0.75, -0.5, 0.75, 0.5];
								px -= this.bw * 0.8;
								break;
							case cell.RT:
								idx = [-0.75, -0.5, -0.75, 0.5];
								px += this.bw * 0.8;
								break;
						}

						g.vid = "c_arrow_head_" + cell.id + "_" + dir;
						g.fillStyle = this.getQuesNumberColor(cell, dir - 1);
						g.setOffsetLinePath(
							px,
							py,
							0,
							0,
							idx[0] * inner,
							idx[1] * inner,
							idx[2] * inner,
							idx[3] * inner,
							true
						);
						g.fill();
						g.vid = "c_arrow_line_" + cell.id + "_" + dir;
						g.strokeStyle = this.getQuesNumberColor(cell, dir - 1);
						g.lineWidth = this.lw / 2;
						g.strokeLine(
							(px * 1.5 + px2) / 2.5,
							(py * 1.5 + py2) / 2.5,
							px2,
							py2
						);
					} else {
						g.vid = "c_arrow_head_" + cell.id + "_" + dir;
						g.vhide();
						g.vid = "c_arrow_line_" + cell.id + "_" + dir;
						g.vhide();
					}
				}
			}
		}
	},
	"Graphic@shiftopia": {
		qsubcolor1: "rgb(224, 224, 255)",
		circlefillcolor_func: "qcmp"
	},

	Encode: {
		decodePzpr: function(type) {
			this.decodeNumber16();
			this.puzzle.setConfig("slither_full", this.checkpflag("f"));
		},
		encodePzpr: function(type) {
			this.outpflag = this.puzzle.getConfig("slither_full") ? "f" : null;
			this.encodeNumber16();
		}
	},

	FileIO: {
		decodeData: function() {
			this.decodeConfigFlag("f", "slither_full");
			this.decodeCellQnum();
			this.decodeCellQsub();
			this.decodeBorderLine();
		},
		encodeData: function() {
			this.encodeConfigFlag("f", "slither_full");
			this.encodeCellQnum();
			this.encodeCellQsub();
			this.encodeBorderLine();
		}
	},

	"AnsCheck@myopia": {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkLineDirExist",
			"checkLineDirCloser",
			"checkLineDirUnequal",
			"checkDeadendLine+",
			"checkOneLoop",
			"checkNoLineIfVariant"
		],

		getLineDirs: function() {
			if (this._info.lineDirs) {
				return this._info.lineDirs;
			}
			var bd = this.board;
			var ret = [];

			for (var c = 0; c < bd.cell.length; c++) {
				var cell0 = bd.cell[c];
				if (cell0.qnum <= 0) {
					continue;
				}
				var row = [cell0, -1, -1, -1, -1];
				for (var dir = 1; dir <= 4; dir++) {
					var addr = cell0.getaddr();
					addr.movedir(dir, 1);
					while (!addr.getb().isnull && !addr.getb().isLine()) {
						addr.movedir(dir, 2);
					}
					if (addr.getb().isLine()) {
						row[dir] =
							(Math.abs(
								dir === addr.LT || dir === addr.RT
									? addr.bx - cell0.bx
									: addr.by - cell0.by
							) +
								1) /
							2;
					}
				}
				ret.push(row);
			}
			return (this._info.lineDirs = ret);
		}
	},
	AnsCheck: {
		checkLineDirExist: function() {
			var clues = this.getLineDirs();
			for (var i in clues) {
				for (var dir = 1; dir <= 4; dir++) {
					if (!(clues[i][0].qnum & (1 << (dir - 1)))) {
						continue;
					}
					if (clues[i][dir] === -1) {
						this.failcode.add("arNoLineSeen");
						if (this.checkOnly) {
							return;
						}
						clues[i][0].seterr(4 << dir);
					}
				}
			}
		},

		checkLineDirCloser: function() {
			var clues = this.getLineDirs();
			var unknown = this.board.cols + this.board.rows;
			for (var i in clues) {
				var mindist = unknown;
				for (var dir = 1; dir <= 4; dir++) {
					if (clues[i][dir] === -1) {
						continue;
					}
					if (clues[i][0].qnum & (1 << (dir - 1))) {
						mindist = Math.min(mindist, clues[i][dir]);
					}
				}
				for (var dir = 1; dir <= 4; dir++) {
					var dist = clues[i][dir];
					if (clues[i][0].qnum & (1 << (dir - 1))) {
						continue;
					}
					if (mindist === unknown && dist > 1) {
						continue;
					}
					if (dist !== -1 && dist <= mindist) {
						this.failcode.add("arDistanceGt");
						if (this.checkOnly) {
							return;
						}
						clues[i][0].seterr(0x7c);

						var addr = clues[i][0].getaddr();
						for (var n = 0; n < dist - 1; n++) {
							addr.movedir(dir, 2);
							addr.getc().seterr(1);
						}
						addr.movedir(dir, 1);
						addr.getb().seterr(1);
						this.board.border.setnoerr();
					}
				}
			}
		},

		checkLineDirUnequal: function() {
			var clues = this.getLineDirs();
			var unknown = this.board.cols + this.board.rows;
			for (var i in clues) {
				var mindist = unknown;
				for (var dir = 1; dir <= 4; dir++) {
					if (clues[i][dir] === -1) {
						continue;
					}
					if (
						clues[i][0].qnum & (1 << (dir - 1)) &&
						mindist !== clues[i][dir]
					) {
						mindist = mindist === unknown ? clues[i][dir] : -1;
					}
				}
				for (var dir = 1; dir <= 4; dir++) {
					var dist = clues[i][dir];
					if (!(clues[i][0].qnum & (1 << (dir - 1)))) {
						continue;
					}
					if (dist !== -1 && dist !== mindist) {
						this.failcode.add("arDistanceNe");
						if (this.checkOnly) {
							return;
						}
						clues[i][0].seterr(4 << dir);

						var addr = clues[i][0].getaddr();
						for (var n = 0; n < dist - 1; n++) {
							addr.movedir(dir, 2);
							addr.getc().seterr(1);
						}
						addr.movedir(dir, 1);
						addr.getb().seterr(1);
						this.board.border.setnoerr();
					}
				}
			}
		}
	},
	"AnsCheck@shiftopia": {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",

			"checkConnectObject",
			"checkLineOverLetter",
			"checkCurveLine",

			"checkLineDirExist",
			"checkLineDirCloser",
			"checkLineDirUnequal",

			"checkDisconnectLine"
		],

		checkCurveLine: function() {
			this.checkAllArea(
				this.board.linegraph,
				function(w, h, a, n) {
					return w === 1 || h === 1;
				},
				"laCurve"
			);
		},

		getLineDirs: function() {
			if (this._info.lineDirs) {
				return this._info.lineDirs;
			}
			var bd = this.board;
			var ret = [];

			for (var c = 0; c < bd.cell.length; c++) {
				var cell0 = bd.cell[c];
				if (cell0.base.qnum <= 0) {
					continue;
				}
				var row = [cell0, -1, -1, -1, -1];
				for (var dir = 1; dir <= 4; dir++) {
					var addr = cell0.getaddr();
					var cell1 = null;
					do {
						addr.movedir(dir, 2);
						cell1 = addr.getc();
					} while (!cell1.isnull && (!cell1.base || !cell1.base.isNum()));
					if (cell1.base && cell1.base.isNum()) {
						row[dir] =
							Math.abs(
								dir === addr.LT || dir === addr.RT
									? addr.bx - cell0.bx
									: addr.by - cell0.by
							) / 2;
					}
				}
				ret.push(row);
			}

			return (this._info.lineDirs = ret);
		}
	}
});
