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

		width: 40,
		height: 6,

		defaultPreset: function() {
			return this.presets[0].constant;
		},

		presets: [
			{
				name: "statuepark_pentominoes",
				shortkey: "p",
				constant: [
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
				]
			},
			{
				name: "statuepark_tetrominoes",
				shortkey: "t",
				constant: ["1:1111", "2:010111", "2:1111", "2:011110", "2:011101"]
			},
			{
				name: "statuepark_double_tetrominoes",
				shortkey: "d",
				constant: [
					"1:1111",
					"1:1111",
					"2:010111",
					"2:010111",
					"2:1111",
					"2:1111",
					"2:011110",
					"2:011110",
					"2:011101",
					"2:011101"
				]
			}
		],

		deserialize: function(str) {
			var piece = new this.klass.BankPiece();
			piece.key = str;

			var tokens = str.split(":");
			piece.w = +tokens[0];
			piece.h = tokens[1].length / piece.w;

			return piece;
		}
	},

	BankPiece: {
		serialize: function() {
			return this.key;
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
			var str = piece ? piece.key.split(":")[1] : "";
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
			this.decodeCircle();
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
			// TODO load qcmp in piece bank
		},
		encodeData: function() {
			this.encodePieceBank();
			this.encodeCellQnum();
			this.encodeCellAns();
			// TODO save qcmp in piece bank
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
