//
// statuepark.js
//

(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["statuepark"], {
	MouseEvent: {
		use: true,
		inputModes: {
			edit: ["circle-shade", "circle-unshade", "clear", "completion"],
			play: ["shade", "unshade", "completion"]
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
				this.inputqnum();
				if (this.notInputted() && this.mousestart) {
					this.inputqcmp();
				}
			}
		},

		inputqcmp: function() {
			var piece = this.getbank();
			if (piece) {
				piece.setQcmp(piece.qcmp ? 0 : 1);
				piece.draw();
			}
		}
	},

	KeyEvent: {
		enablemake: true
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

	Bank: {
		enabled: true,

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
				name: "preset.zero",
				shortkey: "z",
				constant: []
			}
		],

		deserialize: function(str) {
			var piece = new this.klass.BankPiece();

			if (str.length < 3) {
				throw new Error("Invalid piece");
			}

			piece.w = parseInt(str[0], 36);
			piece.h = parseInt(str[1], 36);
			var len = piece.w * piece.h;

			var bits = "";
			for (var i = 2; i < str.length; i++) {
				bits += parseInt(str[i], 32)
					.toString(2)
					.padStart(5, "0");
			}

			piece.str = bits.substring(0, len).padEnd(len, "0");

			return piece;
		}
	},

	BankPiece: {
		canon: null,
		compressed: null,

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

	Cell: {
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

	AreaShadeGraph: {
		enabled: true
	},
	AreaUnshadeGraph: {
		enabled: true
	},

	Graphic: {
		enablebcolor: true,

		shadecolor: "rgb(80, 80, 80)",
		bgcellcolor_func: "qsub1",

		circlefillcolor_func: "qnum2",
		circleratio: [0.3, 0.25],

		paint: function() {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawCircles();

			this.drawChassis();
			this.drawBank();

			this.drawTarget();
		},

		drawBankPiece: function(g, piece, idx) {
			var str = piece ? piece.str : "";
			var r = this.bankratio;

			// TODO if length is shorter than last time, not all blocks are updated
			var count = str.length;
			for (var i = 0; i < count; i++) {
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

	AnsCheck: {
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
	}
});
