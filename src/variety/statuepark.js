//
// statuepark.js
//

(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["statuepark", "statuepark-aux", "pentopia"], {
	MouseEvent: {
		use: true,
		inputModes: {
			edit: ["circle-shade", "circle-unshade", "clear", "completion"],
			play: ["shade", "unshade", "clear", "completion"]
		},

		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					this.inputcell();
				}
				if (this.notInputted() && this.mousestart) {
					this.inputqcmp();
				}
			} else if (this.puzzle.editmode && this.mousestart) {
				this.inputqnum();
				if (this.notInputted()) {
					if (this.btn === "left") {
						this.inputpiece();
					} else {
						this.inputqcmp();
					}
				}
			}
		},

		mouseinput_clear: function() {
			var cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) {
				return;
			}
			if (this.puzzle.editmode) {
				cell.setQnum(-1);
			}
			cell.setQans(0);
			cell.setQsub(0);
			cell.draw();
		},

		inputqcmp: function() {
			var piece = this.getbank();
			if (piece) {
				piece.setQcmp(piece.qcmp ? 0 : 1);
				piece.draw();
			}
		},

		inputpiece: function() {
			var piece = this.getbank();
			if (!piece) {
				return;
			}

			this.puzzle.emit("request-aux-editor");

			if (piece.index === null) {
				return;
			}

			var pos0 = this.cursor.getaddr();
			this.cursor.bankpiece = piece.index;
			pos0.draw();

			var s = Math.max(this.puzzle.board.cols, this.puzzle.board.rows);
			var data = [s, s, piece.serialize()];

			var thiz = this;
			var args = {
				pid: "statuepark-aux",
				key: piece.index,
				url: data.join("/")
			};

			this.puzzle.emit("request-aux-editor", args, function(auxpuzzle) {
				var shape = auxpuzzle.board.getShape();
				if (!shape) {
					thiz.cursor.bankpiece = null;
				}
				thiz.board.bank.setPiece(shape, piece.index);
			});
		}
	},

	"MouseEvent@pentopia": {
		inputModes: {
			edit: ["arrow", "undef", "clear", "completion"],
			play: ["shade", "unshade", "clear", "completion"]
		},

		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					this.inputcell();
				}
				if (this.notInputted() && this.mousestart) {
					this.inputqcmp();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.setcursor(this.getcell());
				}
				this.inputarrow_cell();
				if (this.notInputted() && this.mouseend) {
					if (this.btn === "left") {
						this.inputpiece();
					} else {
						this.inputqcmp();
					}
				}
			}
		},

		inputarrow_cell_main: function(cell, dir) {
			var newdir = Math.max(0, cell.qnum);
			newdir ^= 1 << (dir - 1);
			if (newdir === 0) {
				newdir = -1;
			}
			cell.setNum(newdir);
		}
	},

	KeyEvent: {
		enablemake: true
	},
	TargetCursor: {
		setaddr: function(pos) {
			if (this.bankpiece !== null) {
				this.puzzle.emit("request-aux-editor");
			}
			this.common.setaddr.call(this, pos);
		}
	},

	Board: {
		rows: 12,
		cols: 12,

		getBankPiecesInGrid: function() {
			var ret = [];
			var shapes = this.board.sblkmgr.components;
			for (var r = 0; r < shapes.length; r++) {
				var block = shapes[r];
				ret.push([block.clist.getBlockShapes().canon, block.clist]);
			}
			return ret;
		}
	},

	"Board@statuepark-aux": {
		setShape: function(shape) {
			if (!shape) {
				return;
			}

			var w = shape.w;
			var h = shape.h;
			var sx = (this.cols - w) | 1;
			var sy = (this.rows - h) | 1;
			for (var y = 0; y < h; y++) {
				for (var x = 0; x < w; x++) {
					var cell = this.getc(x * 2 + sx, y * 2 + sy);
					if (!cell || cell.isnull) {
						continue;
					}
					cell.setQans(+shape.str[y * w + x]);
				}
			}
		},

		getShape: function() {
			var clist = this.cell.filter(function(cell) {
				return cell.qans;
			});

			if (clist.length === 0) {
				return null;
			}
			var piece = new this.klass.BankPiece();
			piece.deserializeRaw(clist.getBlockShapes().id);
			return piece.serialize();
		}
	},

	Bank: {
		enabled: true,
		allowAdd: true,

		defaultPreset: function() {
			return this.presets[0].constant;
		},

		presets: [
			{
				name: "preset.pentominoes",
				shortkey: "p",
				constant: [
					"337k",
					"15v",
					"24as",
					"24bo",
					"23fg",
					"337i",
					"23rg",
					"334u",
					"335s",
					"33bk",
					"24bk",
					"337o"
				]
			},
			{
				name: "preset.tetrominoes",
				shortkey: "t",
				constant: ["14u", "23bg", "22u", "23f", "23eg"]
			},
			{
				name: "preset.double_tetrominoes",
				shortkey: "d",
				constant: [
					"14u",
					"14u",
					"23bg",
					"23bg",
					"22u",
					"22u",
					"23f",
					"23f",
					"23eg",
					"23eg"
				]
			},
			{
				name: "preset.copy_answer",
				func: "copyAnswer"
			},
			{
				name: "preset.zero",
				shortkey: "z",
				constant: []
			}
		],

		copyAnswer: function() {
			var p = new this.klass.BankPiece();
			var pieces = this.board.getBankPiecesInGrid().map(function(pair) {
				p.deserialize(pair[0]);
				return p.serialize();
			});

			pieces.sort();
			return pieces;
		}
	},

	"Bank@statuepark-aux": {
		enabled: false
	},

	BankPiece: {
		canon: null,
		compressed: null,

		deserializeRaw: function(str) {
			var tokens = str.split(":");
			this.w = +tokens[0];
			this.str = tokens[1];
			this.h = this.str.length / this.w;
		},

		deserialize: function(str) {
			this.canon = null;
			this.compressed = null;

			if (!str) {
				this.w = this.h = 1;
				this.str = "0";
				return;
			}

			if (str.indexOf(":") !== -1) {
				this.deserializeRaw(str);
				return;
			}

			if (str.length < 3) {
				throw new Error("Invalid piece");
			}

			this.w = parseInt(str[0], 36);
			this.h = parseInt(str[1], 36);
			var len = this.w * this.h;

			var bits = "";
			for (var i = 2; i < str.length; i++) {
				bits += parseInt(str[i], 32)
					.toString(2)
					.padStart(5, "0");
			}

			this.str = bits.substring(0, len).padEnd(len, "0");
		},

		canonize: function() {
			if (this.canon) {
				return this.canon;
			}

			var data = [this.str, "", "", "", "", "", "", ""];

			for (var y = 0; y < this.h; y++) {
				for (var x = 0; x < this.w; x++) {
					data[1] += this.str[(this.h - y - 1) * this.w + x];
				}
			}
			for (var x = 0; x < this.w; x++) {
				for (var y = 0; y < this.h; y++) {
					data[4] += this.str[y * this.w + x];
					data[5] += this.str[(this.h - y - 1) * this.w + x];
				}
			}
			data[2] = data[1]
				.split("")
				.reverse()
				.join("");
			data[3] = data[0]
				.split("")
				.reverse()
				.join("");
			data[6] = data[5]
				.split("")
				.reverse()
				.join("");
			data[7] = data[4]
				.split("")
				.reverse()
				.join("");

			for (var i = 0; i < 8; i++) {
				data[i] = (i < 4 ? this.w : this.h) + ":" + data[i];
			}

			data.sort();
			return (this.canon = data[0]);
		},

		serialize: function() {
			if (this.compressed) {
				return this.compressed;
			}

			var ret = this.w.toString(36) + this.h.toString(36);

			for (var i = 0; i < this.str.length; i += 5) {
				var sub = this.str.substr(i, 5).padEnd(5, "0");
				ret += parseInt(sub, 2).toString(32);
			}

			while (ret.lastIndexOf("0") === ret.length - 1) {
				ret = ret.substring(0, ret.length - 1);
			}

			return (this.compressed = ret);
		}
	},

	"Cell@statuepark": {
		numberAsObject: true,
		disInputHatena: true,
		maxnum: 2,

		allowShade: function() {
			return this.qnum !== 1;
		},

		allowUnshade: function() {
			return this.qnum !== 2;
		}
	},

	"Cell@pentopia": {
		numberAsObject: true,
		maxnum: 15,
		allowShade: function() {
			return this.qnum === -1;
		}
	},

	AreaShadeGraph: {
		enabled: true
	},
	"AreaUnshadeGraph@statuepark": {
		enabled: true
	},

	"Graphic@statuepark": {
		enablebcolor: true,

		shadecolor: "rgb(80, 80, 80)",
		bgcellcolor_func: "qsub1",

		circlefillcolor_func: "qnum2",
		circleratio: [0.3, 0.25]
	},

	Graphic: {
		paint: function() {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			if (this.pid === "statuepark") {
				this.drawCircles();
			} else {
				this.drawQuesNumbers();
			}

			this.drawChassis();
			this.drawBank();

			this.drawTarget();
		},

		maxpiececount: 0,

		drawBankPiece: function(g, piece, idx) {
			var str = piece ? piece.str : "";
			var r = this.bankratio;

			this.maxpiececount = Math.max(str.length, this.maxpiececount);
			for (var i = 0; i < this.maxpiececount; i++) {
				g.vid = "pb_piece_" + idx + "_" + i;

				if (str[i] === "1") {
					var px = this.cw * r * (piece.x + 0.25 + (i % piece.w));
					var py = this.ch * r * (piece.y + 0.25 + ((i / piece.w) | 0));
					py += (this.board.rows + 0.5) * this.ch;

					g.fillStyle = this.getBankPieceColor(piece);
					g.fillRect(px + 1, py + 1, this.cw * r - 2, this.ch * r - 2);
				} else {
					g.vhide();
				}
			}
		}
	},

	"Graphic@pentopia": {
		enablebcolor: true,

		shadecolor: "rgb(80, 80, 80)",
		bgcellcolor_func: "qsub1"
	},

	"Graphic@statuepark-aux": {
		paint: function() {
			this.drawShadedCells();
			this.drawDashedGrid();
			this.drawChassis();
		},

		drawCells_common: function(header, colorfunc) {
			var g = this.context;
			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i],
					color = colorfunc.call(this, cell);
				g.vid = header + cell.id;
				if (!!color) {
					g.fillStyle = color;
					g.fillRectCenter(
						cell.bx * this.bw,
						cell.by * this.bh,
						this.bw - 1.5,
						this.bh - 1.5
					);
				} else {
					g.vhide();
				}
			}
		}
	},

	Encode: {
		decodePzpr: function(type) {
			if (this.outbstr[0] !== "/") {
				this.decodeCircle();
			}
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeCircle();
			this.encodePieceBank();
		}
	},
	"Encode@pentopia": {
		decodePzpr: function(type) {
			if (this.outbstr[0] !== "/") {
				this.decodeNumber16();
			}
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeNumber16();
			this.encodePieceBank();
		}
	},

	"Encode@statuepark-aux": {
		decodePzpr: function(type) {
			var shape = new this.klass.BankPiece();
			shape.deserialize(this.outbstr);
			this.board.setShape(shape);
		},

		encodePzpr: function(type) {
			this.outbstr = this.board.getShape() || "1:0";
		}
	},

	FileIO: {
		decodeData: function() {
			this.decodePieceBank();
			this.decodeCellQnum();
			this.decodeCellAns();
			this.decodePieceBankQcmp();
		},
		encodeData: function() {
			this.encodePieceBank();
			this.encodeCellQnum();
			this.encodeCellAns();
			this.encodePieceBankQcmp();
		}
	},

	"FileIO@statuepark-aux": {
		decodeData: function() {
			var shape = new this.klass.BankPiece();
			shape.deserialize(this.readLine());
			this.board.setShape(shape);
		},
		encodeData: function() {
			this.writeLine(this.board.getShape() || "1:0");
		}
	},

	"AnsCheck@statuepark": {
		checklist: [
			"checkUnshadeOnCircle",
			"checkConnectUnshade",
			"checkBankPiecesAvailable",
			"checkBankPiecesInvalid",
			"checkShadeOnCircle",
			"checkBankPiecesUsed"
		],

		checkShadeOnCircle: function() {
			this.checkAllCell(function(cell) {
				return !cell.isShade() && cell.qnum === 2;
			}, "circleUnshade");
		},

		checkUnshadeOnCircle: function() {
			this.checkAllCell(function(cell) {
				return cell.isShade() && cell.qnum === 1;
			}, "circleShade");
		}
	},

	"AnsCheck@pentopia": {
		// TODO arrow distances arDistanceGt
		// TODO arrow distances arDistanceNe
		checklist: [
			"checkShadeOnArrow",
			"checkBankPiecesAvailable",
			"checkShadeDiagonal",
			"checkShadeDirExist",
			"checkShadeDirExist",
			"checkBankPiecesInvalid+"
		],

		checkShadeOnArrow: function() {
			this.checkAllCell(function(cell) {
				return cell.isShade() && cell.qnum !== -1;
			}, "csOnArrow");
		},

		checkShadeDiagonal: function() {
			var bd = this.board;
			for (var c = 0; c < bd.cell.length; c++) {
				var cell = bd.cell[c];
				if (cell.bx >= bd.maxbx - 1 || cell.by >= bd.maxby - 1) {
					continue;
				}

				var bx = cell.bx,
					by = cell.by;
				var clist = bd.cellinside(bx, by, bx + 2, by + 2).filter(function(cc) {
					return cc.isShade();
				});
				if (clist.length !== 2) {
					continue;
				}

				var ca = clist[0],
					cb = clist[1];

				if (ca.bx === cb.bx || ca.by === cb.by) {
					continue;
				}

				if (ca.sblk !== cb.sblk) {
					this.failcode.add("shDiag");
					if (this.checkOnly) {
						break;
					}
					clist.seterr(1);
				}
			}
		},

		getShadeDirs: function() {
			if (this._info.shadeDirs) {
				return this._info.shadeDirs;
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
					while (!addr.getc().isnull && !addr.getc().isShade()) {
						addr.movedir(dir, 2);
					}
					if (addr.getc().isShade()) {
						row[dir] = 1;
					}
				}
				ret.push(row);
			}

			return (this._info.shadeDirs = ret);
		},
		checkShadeDirExist: function() {
			var clues = this.getShadeDirs();
			for (var i in clues) {
				for (var dir = 1; dir <= 4; dir++) {
					if (!(clues[i][0].qnum & (1 << (dir - 1)))) {
						continue;
					}
					if (clues[i][dir] === -1) {
						this.failcode.add("arNoShade");
						if (this.checkOnly) {
							return;
						}
						clues[i][0].seterr(1);
					}
				}
			}
		}
	}
});
