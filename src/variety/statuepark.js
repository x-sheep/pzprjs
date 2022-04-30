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
			edit: ["circle-shade", "circle-unshade", "clear"],
			play: ["shade", "unshade"]
		},

		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					this.inputcell();
				}
			} else if (this.puzzle.editmode) {
				this.inputqnum();
			}
		}
	},

	KeyEvent: {
		enablemake: true
	},

	Board: {
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
		height: 20,

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
		}
	},

	Encode: {
		decodePzpr: function(type) {
			this.decodeCircle();
			// TODO decode piece bank
		},
		encodePzpr: function(type) {
			this.encodeCircle();
			// TODO encode piece bank
		}
	},

	FileIO: {
		decodeData: function() {
			// TODO encode piece bank
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function() {
			// TODO encode piece bank
			this.encodeCellQnum();
			this.encodeCellAns();
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
