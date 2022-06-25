//
// Tapa-Like Loop / tapaloop.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["tapaloop", "disloop"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: [],
			play: ["line", "peke", "subcircle", "subcross", "info-line"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						if (!this.inputpeke_ifborder()) {
							this.inputMB();
						}
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					} else if (this.mouseend && this.notInputted()) {
						if (!this.inputpeke_ifborder()) {
							this.inputMB();
						}
					}
				}
			} else if (this.puzzle.editmode && this.mousestart) {
				this.setcursor(this.getcell());
			}
		}
	},

	"MouseEvent@disloop": {
		inputModes: {
			edit: ["arrow"],
			play: ["line", "peke", "info-line"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						this.inputpeke_ifborder();
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					} else if (this.mouseend && this.notInputted()) {
						this.inputpeke_ifborder();
					}
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.setcursor(this.getcell());
				}
				this.inputarrow_cell();
			}
		},

		inputarrow_cell_main: function(cell, dir) {
			cell.setQdir(cell.qdir === dir ? 0 : dir);
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function(ca) {
			this.key_inputqnums(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		noLP: function(dir) {
			return this.qnums.length === 0 ? false : true;
		}
	},

	"Cell@tapaloop": {
		minnum: 0,
		maxnum: 8,

		isValidQnums: function(val) {
			var sum = 0;
			for (var i = 0; i < val.length; i++) {
				if (val[i] === 0) {
					return false;
				}
				sum += val[i] >= 0 ? val[i] : 1;
			}
			return sum <= 8;
		},

		getSegmentLengths: function() {
			var segs = [];
			var current = 0;
			var cellrel = [
				[-2, -2],
				[0, -2],
				[2, -2],
				[2, 0],
				[2, 2],
				[0, 2],
				[-2, 2],
				[-2, 0]
			];
			var borderrel = [
				[-1, -2],
				[1, -2],
				[2, -1],
				[2, 1],
				[1, 2],
				[-1, 2],
				[-2, 1],
				[-2, -1]
			];

			for (var i = 0; i < 8; i++) {
				if (current === 0) {
					var cell = this.relcell(cellrel[i][0], cellrel[i][1]);
					if (!!cell && cell.lcnt > 0) {
						current = 1;
					} else {
						continue;
					}
				}
				var border = this.relbd(borderrel[i][0], borderrel[i][1]);
				if (!!border && border.isLine()) {
					current++;
				} else {
					segs.push(current);
					current = 0;
				}
			}
			if (current > 0) {
				segs.push(current);
			}
			if (segs.length === 0) {
				segs.push(0);
			} else if (this.relbd(-2, -1).isLine()) {
				segs[0] += segs[segs.length - 1] - 1;
				segs.pop();
			}

			return segs;
		}
	},

	"Cell@disloop": {
		maxnum: 9,

		getSegmentLengths: function() {
			if (this.qdir === 0 || this.qnums.length === 0) {
				return this.qnums.length === 1 && this.qnums[0] === -2 ? [1] : [];
			}

			var dir = this.qdir;
			var addr = this.getaddr();
			addr.movedir(dir, 3);

			var ret = [0];
			while (ret.length <= this.qnums.length) {
				ret[0]++;
				addr.movedir(dir, 1);
				if (addr.getc().lcnt !== 2) {
					break;
				}

				for (var newdir = 1; newdir <= 4; newdir++) {
					// Don't go backwards
					if (newdir === { 1: 2, 2: 1, 3: 4, 4: 3 }[dir]) {
						continue;
					}
					var copy = addr.getaddr();
					copy.movedir(newdir, 1);
					if (copy.getb().line) {
						if (newdir !== dir) {
							ret.unshift(0);
							dir = newdir;
						}
						break;
					}
				}
				addr.movedir(dir, 1);
			}

			return ret.slice(-this.qnums.length);
		}
	},

	Border: {
		enableLineNG: true,
		isBorder: function() {
			return this.sidecell[0].noLP() || this.sidecell[1].noLP();
		}
	},
	Board: {
		hasborder: 1
	},
	"BoardExec@disloop": {
		adjustBoardData: function(key, d) {
			this.adjustNumberArrow(key, d);
		}
	},
	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "SLIGHT",

		paint: function() {
			this.drawBGCells();
			this.drawGrid();

			this.drawTapaNumbers();
			if (this.pid === "disloop") {
				this.drawCellArrows();
				this.drawBorders();
			}

			this.drawMBs();
			this.drawPekes();
			this.drawLines();

			this.drawChassis();
			this.drawTarget();
		}
	},

	"Graphic@disloop": {
		// TODO hide text when clues are 1 question mark and no arrow is given
		getBGCellColor: function(cell) {
			if (cell.noLP()) {
				return "rgb(224,224,224)";
			}
			return this.getBGCellColor_error1(cell);
		},

		getCellArrowColor: function(cell) {
			if (cell.qdir >= 1 && cell.qdir <= 4) {
				return cell.error ? this.errcolor1 : this.quescolor;
			}
			return null;
		},

		drawCellArrows: function() {
			var g = this.vinc("cell_arrow", "crispEdges");

			var inner = this.cw * 0.5;

			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i];
				var dir = cell.qdir;
				var color = this.getCellArrowColor(cell);

				g.lineWidth = (this.lw + this.addlw) / 2;
				if (!!color) {
					g.fillStyle = color;
					g.strokeStyle = color;
					var px = cell.bx * this.bw,
						py = cell.by * this.bh;
					var idx = [0, 0, 0, 0];

					switch (dir) {
						case cell.UP:
							idx = [0.5, 0.75, -0.5, 0.75];
							py -= this.bh * 1.75;
							break;
						case cell.DN:
							idx = [0.5, -0.75, -0.5, -0.75];
							py += this.bh * 1.75;
							break;
						case cell.LT:
							idx = [0.75, -0.5, 0.75, 0.5];
							px -= this.bw * 1.75;
							break;
						case cell.RT:
							idx = [-0.75, -0.5, -0.75, 0.5];
							px += this.bw * 1.75;
							break;
					}

					g.vid = "c_arrow_" + cell.id;
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
				} else {
					g.vid = "c_arrow_" + cell.id;
					g.vhide();
				}
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	"Encode@tapaloop": {
		decodePzpr: function(type) {
			this.decodeNumber_tapaloop();
		},
		encodePzpr: function(type) {
			this.encodeNumber_tapaloop();
		},
		decodeNumber_tapaloop: function() {
			var c = 0,
				i = 0,
				bstr = this.outbstr,
				bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				var cell = bd.cell[c],
					ca = bstr.charAt(i);

				if (this.include(ca, "0", "8")) {
					cell.qnums = [parseInt(ca, 10)];
				} else if (ca === ".") {
					cell.qnums = [-2];
				} else if (this.include(ca, "a", "f")) {
					var num = parseInt(bstr.substr(i, 2), 36),
						val = [];
					if (num >= 360) {
						num -= 360;
						val = [0, 0];
						val[0] = (num / 8) | 0;
						num -= val[0] * 8;
						val[1] = num;
					}
					for (var k = 0; k < 4; k++) {
						if (val[k] === 0) {
							val[k] = -2;
						}
					}
					cell.qnums = val;
					i++;
				} else if (ca === "+") {
					var num = parseInt(bstr.substr(i + 1, 2), 36) - 36,
						val = [0, 0, 0];
					val[0] = (num / 49) | 0;
					num -= val[0] * 49;
					val[1] = (num / 7) | 0;
					num -= val[1] * 7;
					val[2] = num;
					for (var k = 0; k < 4; k++) {
						if (val[k] === 0) {
							val[k] = -2;
						}
					}
					cell.qnums = val;
					i = i + 2;
				} else if (ca === "-") {
					var num = parseInt(bstr.substr(i + 1, 2), 36) - 36,
						val = [0, 0, 0, 0];
					val[0] = (num / 216) | 0;
					num -= val[0] * 216;
					val[1] = (num / 36) | 0;
					num -= val[1] * 36;
					val[2] = (num / 6) | 0;
					num -= val[2] * 6;
					val[3] = num;
					for (var k = 0; k < 4; k++) {
						if (val[k] === 0) {
							val[k] = -2;
						}
					}
					cell.qnums = val;
					i = i + 2;
				} else if (ca >= "g" && ca <= "z") {
					c += parseInt(ca, 36) - 16;
				}

				c++;
				if (!bd.cell[c]) {
					break;
				}
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeNumber_tapaloop: function() {
			var count = 0,
				cm = "",
				bd = this.board;
			for (var c = 0; c < bd.cell.length; c++) {
				var pstr = "",
					qn = bd.cell[c].qnums;

				if (qn.length === 1) {
					if (qn[0] === -2) {
						pstr = ".";
					} else {
						pstr = qn[0].toString(10);
					}
				} else if (qn.length === 2) {
					pstr = (
						(qn[0] > 0 ? qn[0] : 0) * 8 +
						(qn[1] > 0 ? qn[1] : 0) +
						360
					).toString(36);
				} else if (qn.length === 3) {
					pstr =
						"+" +
						(
							(qn[0] > 0 ? qn[0] : 0) * 49 +
							(qn[1] > 0 ? qn[1] : 0) * 7 +
							(qn[2] > 0 ? qn[2] : 0) +
							36
						).toString(36);
				} else if (qn.length === 4) {
					pstr =
						"-" +
						(
							(qn[0] > 0 ? qn[0] : 0) * 216 +
							(qn[1] > 0 ? qn[1] : 0) * 36 +
							(qn[2] > 0 ? qn[2] : 0) * 6 +
							(qn[3] > 0 ? qn[3] : 0) +
							36
						).toString(36);
				} else {
					count++;
				}

				if (count === 0) {
					cm += pstr;
				} else if (pstr || count === 20) {
					cm += (15 + count).toString(36) + pstr;
					count = 0;
				}
			}
			if (count > 0) {
				cm += (15 + count).toString(36);
			}

			this.outbstr += cm;
		}
	},
	"Encode@disloop": {
		decodePzpr: function(type) {
			this.decodeArrowNumber_disloop();
		},
		encodePzpr: function(type) {
			this.encodeArrowNumber_disloop();
		},
		decodeArrowNumber_disloop: function() {
			var bd = this.board;
			this.genericDecodeNumber16(bd.cell.length, function(c, val) {
				bd.cell[c].qdir = 0;
				if (val === -1) {
					bd.cell[c].qnums = [];
				} else if (!val) {
					bd.cell[c].qnums = [-2];
				} else {
					var nums = [];
					while (val > 0) {
						nums.unshift(val % 10 || -2);
						val = (val / 10) | 0;
					}
					bd.cell[c].qdir = nums[0];
					bd.cell[c].qnums = nums.slice(1);
				}
			});
		},
		encodeArrowNumber_disloop: function() {
			var bd = this.board;
			this.genericEncodeNumber16(bd.cell.length, function(c) {
				var cell = bd.cell[c];
				if (cell.qnums.length === 0) {
					return -1;
				}
				if (cell.qdir === 0) {
					return 0;
				}
				var ret = cell.qdir;
				for (var i = 0; i < cell.qnums.length; i++) {
					ret *= 10;
					if (cell.qnums[i] > 0) {
						ret += cell.qnums[i];
					}
				}
				return ret;
			});
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeQnums();
			this.decodeBorderLine();
		},
		encodeData: function() {
			this.encodeQnums();
			this.encodeBorderLine();
		}
	},
	"FileIO@disloop": {
		decodeData: function() {
			this.decodeQnums();
			this.decodeDirs();
			this.decodeBorderLine();
		},
		encodeData: function() {
			this.encodeQnums();
			this.encodeDirs();
			this.encodeBorderLine();
		},

		decodeDirs: function() {
			this.decodeCell(function(cell, ca) {
				cell.qdir = +ca || 0;
			});
		},
		encodeDirs: function() {
			this.encodeCell(function(cell) {
				return cell.qdir + " ";
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		// TODO enforce arrows when required
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkTapaloop",
			"checkDeadendLine+",
			"checkOneLoop"
		],

		checkTapaloop: function() {
			this.checkAllCell(function(cell) {
				if (cell.qnums.length === 0) {
					return false;
				}
				var segs = cell.getSegmentLengths();
				// TODO in disloop, be more lenient with incomplete loops with lower seg counts
				if (cell.qnums.length !== segs.length) {
					return true;
				}
				for (var i = 0; i < cell.qnums.length; i++) {
					var num = cell.qnums[i];
					if (num === -2) {
						continue;
					}
					var idx = segs.indexOf(num);
					if (idx < 0) {
						return true;
					}
					segs.splice(idx, 1);
				}
			}, "tapaloopError");
		}
	}
});
