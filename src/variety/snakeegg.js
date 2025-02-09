﻿//
// snakeegg.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["snakeegg", "meidjuluk", "overlap"], {
	MouseEvent: {
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				this.mouseinputAutoPlay();
				if (this.notInputted() && this.mousestart) {
					this.inputqcmp();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
				if (this.mousestart && this.getbank()) {
					if (this.btn === "left") {
						this.inputpiece();
					} else {
						this.inputqcmp();
					}
				}
			}
		},
		inputpiece: function() {
			var piece = this.getbank();
			if (!piece || piece.index === null) {
				return;
			}

			var pos0 = this.cursor.getaddr();
			this.cursor.bankpiece = piece.index;
			pos0.draw();
		},

		inputqcmp: function() {
			var piece = this.getbank();
			if (piece) {
				piece.setQcmp(piece.qcmp ? 0 : 1);
				piece.draw();
			}
		}
	},
	"MouseEvent@snakeegg": {
		use: true,
		autoplay_func: "cell",
		inputModes: {
			edit: ["number", "circle-shade", "info-blk"],
			play: ["shade", "unshade", "number", "info-blk"]
		},
		mouseinput: function() {
			if (this.inputMode === "circle-shade") {
				this.inputFixedNumber(0);
			} else {
				this.common.mouseinput.call(this);
			}
		}
	},
	"MouseEvent@meidjuluk": {
		autoplay_func: "border",
		inputModes: {
			edit: ["number", "empty", "clear"],
			play: ["number", "border", "subline"]
		}
	},
	"MouseEvent@overlap": {
		autoplay_func: "line",
		inputModes: {
			edit: ["number", "clear"],
			play: ["number", "line", "peke"]
		}
	},

	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function(ca) {
			if (this.puzzle.playmode) {
				return this.moveTCell(ca);
			}

			var cursor = this.cursor;
			if (cursor.bankpiece !== null) {
				var pos0 = this.cursor.getaddr();
				var act = false;

				var piece =
					this.board.bank.pieces[cursor.bankpiece] || this.board.bank.addButton;

				switch (ca) {
					case "left":
						if (cursor.bankpiece > 0) {
							cursor.bankpiece--;
							act = true;
						}
						break;
					case "right":
						if (cursor.bankpiece < this.board.bank.pieces.length) {
							cursor.bankpiece++;
							act = true;
						}
						break;
					case "up":
						if (piece.y === 0) {
							cursor.bankpiece = null;

							var estx = (piece.x + piece.w / 2) / (this.board.bank.width || 1);
							var bx = (estx * this.board.cols * 2) | 1;

							cursor.bx = Math.max(cursor.minx, Math.min(bx, cursor.maxx));
							cursor.by = cursor.maxy;
							act = true;
						} else {
							act = this.moveBankVertical(-1);
						}
						break;
					case "down":
						act = this.moveBankVertical(+1);
						break;
					default:
						break;
				}

				pos0.draw();
				return act;
			}

			if (ca === "down" && cursor.by === cursor.maxy) {
				var pos0 = this.cursor.getaddr();
				if (cursor.bx === cursor.minx) {
					cursor.bankpiece = 0;
				} else {
					var center = cursor.bx / this.puzzle.painter.bankratio;
					var i = 0;
					while (true) {
						var piece = this.board.bank.pieces[i];
						if (!piece) {
							cursor.bankpiece = this.board.bank.pieces.length;
							break;
						}
						if (piece.x <= center && piece.x + piece.w >= center) {
							cursor.bankpiece = i;
							break;
						}
						if (piece.y > 0) {
							cursor.bankpiece = i - 1;
							break;
						}
						i++;
					}
				}
				pos0.draw();
				return true;
			}
			return this.moveTCell(ca);
		},
		moveBankVertical: function(dir) {
			var cursor = this.cursor;
			var piece =
				this.board.bank.pieces[cursor.bankpiece] || this.board.bank.addButton;

			var center = piece.x + piece.w / 2;

			for (
				var i = cursor.bankpiece + dir;
				i >= 0 && i <= this.board.bank.pieces.length;
				i += dir
			) {
				piece = this.board.bank.pieces[i] || this.board.bank.addButton;
				if (piece.x <= center && piece.x + piece.w >= center) {
					cursor.bankpiece = i;
					return true;
				}
			}
			return false;
		},
		keyinput: function(ca) {
			if (this.cursor.bankpiece !== null && this.puzzle.editmode) {
				var piece =
					this.board.bank.pieces[this.cursor.bankpiece] ||
					this.board.bank.addButton;

				if ((ca === "BS" || ca === " ") && piece.getNum() === -1) {
					if (piece !== this.board.bank.addButton) {
						this.board.bank.setPiece(null, this.cursor.bankpiece);
					}
					if (ca === "BS" && this.cursor.bankpiece > 0) {
						this.cursor.bankpiece--;
					}
					piece.draw();
					return;
				}

				var val = this.getNewNumber(piece, ca, piece.getNum());
				if (val === null) {
					return;
				}
				piece.setNum(val);
				piece = this.board.bank.pieces[this.cursor.bankpiece];

				piece.draw();
				this.prev = piece;
				this.cancelDefault = true;
			} else {
				this.key_inputqnum(ca);
			}
		}
	},

	Cell: {
		disableAnum: true,
		minnum: function() {
			return this.puzzle.playmode ? 1 : 0;
		},
		maxnum: function() {
			return this.puzzle.playmode
				? Math.max(1, this.board.bank.highestPiece)
				: Math.min(
						999,
						this.board.rows * this.board.cols -
							(this.pid === "snakeegg" ? 2 : 0)
				  );
		},
		enableSubNumberArray: true,
		allowShade: function() {
			return this.qnum === 0 || this.qnum === -1;
		},
		allowUnshade: function() {
			return this.qnum !== 0;
		}
	},
	"Cell@meidjuluk": {
		supportQnumAnum: true,
		minnum: 1,
		isNum: function() {
			return this.isEmpty();
		},
		noNum: function() {
			return this.isValid();
		}
	},
	"Cell@overlap": {
		supportQnumAnum: true, // TODO not functional
		minnum: 0
		// TODO maxnum for editmode
	},

	Board: {
		getBankPiecesInGrid: function() {
			var ret = [];
			var shapes = this.ublkmgr.enabled
				? this.ublkmgr.components
				: this.roommgr.components;
			for (var r = 0; r < shapes.length; r++) {
				var clist = shapes[r].clist;
				ret.push([clist.length + "", clist]);
			}
			return ret;
		}
	},
	"Board@meidjuluk": {
		hasborder: 1
	},
	"Board@overlap": {
		hasborder: 2,
		borderAsLine: true,
		getBankPiecesInGrid: function() {
			return [];
		}
	},
	"Border@meidjuluk": {
		isQuesBorder: function() {
			return this.sidecell[0].isEmpty() || this.sidecell[1].isEmpty();
		},

		prehook: {
			qans: function() {
				return this.isQuesBorder();
			},
			qsub: function() {
				return this.isQuesBorder();
			}
		}
	},
	"AreaRoomGraph@meidjuluk": {
		enabled: true
	},
	"LineGraph@overlap": {
		enabled: true,
		isLineCross: true
	},
	Bank: {
		enabled: true,
		allowAdd: true,
		defaultPreset: function() {
			return this.presets[0].constant;
		},
		presets: [
			{
				name: "preset.nine",
				createOnly: true,
				shortkey: "i",
				constant: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
			},
			{
				name: "preset.range",
				func: "generateRange",
				field: { type: "number", value: 9, min: 0, max: 999, size: 4 }
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
		generateRange: function(input) {
			var limit = Math.max(0, Math.min(+input, 999));
			if (isNaN(limit) || (limit | 0) !== limit) {
				limit = 0;
			}
			var sizes = new Array(limit);
			for (var i = 0; i < limit; i++) {
				sizes[i] = i + 1 + "";
			}
			return sizes;
		},
		copyAnswer: function() {
			var manager = this.board.ublkmgr.enabled
				? this.board.ublkmgr
				: this.board.roommgr;

			var sizes = manager.components.map(function(u) {
				return u.clist.length + "";
			});
			sizes.sort(function(a, b) {
				return a - b;
			});
			return sizes;
		},
		highestPiece: 0,
		rebuildExtraData: function() {
			var max = 0;
			for (var b = 0; b < this.pieces.length; b++) {
				max = Math.max(max, this.pieces[b].getNum());
			}
			this.highestPiece = max;
		}
	},
	BankPiece: {
		num: null,
		deserialize: function(str) {
			if (+str) {
				this.num = +str;
			} else if (!str) {
				this.num = -1;
			} else {
				throw new Error("Invalid piece: " + typeof str + " " + str);
			}
		},
		serialize: function() {
			if (this.num > 0) {
				return this.num + "";
			}
			return null;
		},
		getmaxnum: function() {
			return 999;
		},
		getminnum: function() {
			return 1;
		},
		getNum: function() {
			return this.num;
		},
		setNum: function(num) {
			this.board.bank.setPiece(num, this.index);
		},

		disInputHatena: true,

		/* Gaps between numbers are 1/10 */
		w: 10,
		h: 10
	},
	BankEditOperation: {
		isBankEdit: true,
		disInputHatena: true,

		isModify: function(lastope) {
			if (
				lastope.isBankEdit &&
				lastope.index === this.index &&
				(this.old === null || this.num === null || +lastope.num === +this.old)
			) {
				lastope.num = this.num;
				return true;
			}
			return false;
		}
	},
	BankAddButton: {
		w: 10,
		h: 10,
		getmaxnum: function() {
			return 999;
		},
		getminnum: function() {
			return 1;
		},
		getNum: function() {
			return -1;
		},
		setNum: function(num) {
			if (num < 0) {
				return;
			}
			this.board.bank.setPiece(num, this.index);
		}
	},

	"AreaShadeGraph@snakeegg": {
		enabled: true,
		coloring: true
	},
	"AreaUnshadeGraph@snakeegg": {
		enabled: true
	},

	Graphic: {
		bankratio: 0.1,
		bankVerticalOffset: 0.25,

		paint: function() {
			this.drawBGCells();

			if (this.pid === "meidjuluk" || this.pid === "overlap") {
				this.drawDashedGrid(this.pid !== "overlap");
			} else {
				this.drawShadedCells();
				this.drawGrid();
			}
			this.drawTargetSubNumber(true);

			if (this.pid === "meidjuluk") {
				this.drawBorders();
				this.drawBorderQsubs();
			} else if (this.pid === "overlap") {
				this.drawLines();
				this.drawPekes();
			}

			this.drawSubNumbers();
			this.drawQuesNumbers();

			if (this.pid === "snakeegg") {
				this.drawCircles();
			}

			if (this.pid !== "overlap") {
				this.drawChassis();
			}

			this.drawBank();
			this.drawTarget();
		},

		drawBankPiece: function(g, piece, idx) {
			if (!piece) {
				g.vid = "pb_c" + idx;
				g.vhide();
				g.vid = "pb_n" + idx;
				g.vhide();
				return;
			}

			var x = this.cw * 0.1 * (piece.x + 5);
			var y = this.ch * 0.1 * piece.y;
			y += (this.board.rows + 0.75) * this.ch;

			g.vid = "pb_c" + idx;
			g.strokeStyle = this.getBankPieceColor(piece);
			g.fillStyle = null;
			g.shapeCircle(x, y, this.cw * 0.4);

			g.vid = "pb_n" + idx;
			g.strokeStyle = null;
			g.fillStyle = this.getBankPieceColor(piece);
			var str = piece.num >= 0 ? "" + piece.num : "";
			this.disptext(str, x, y, { ratio: 0.65 });
		},

		drawTarget: function() {
			this.drawCursor(
				true,
				this.puzzle.editmode ||
					this.puzzle.mouse.inputMode.indexOf("number") >= 0
			);
		}
	},
	"Graphic@snakeegg,meidjuluk#1": {
		getNumberTextCore: function(num) {
			return num > 0 ? "" + num : num === -2 ? "?" : "";
		}
	},
	"Graphic@meidjuluk": {
		getBGCellColor: function(cell) {
			if ((cell.error || cell.qinfo) === 1) {
				return this.errbcolor1;
			} else if (cell.isEmpty()) {
				return "black";
			}
			return null;
		},
		getBorderColor: function(border) {
			if (border.isQuesBorder()) {
				return "black";
			}
			return this.getBorderColor_qans(border);
		}
	},
	"Graphic@snakeegg": {
		irowakeblk: true,
		shadecolor: "rgb(80, 80, 80)",
		bgcellcolor_func: "qsub1",
		circlestrokecolor_func: "null",
		getCircleFillColor: function(cell) {
			return cell.qnum === 0 ? this.quescolor : null;
		}
	},
	"Graphic@overlap": {
		irowake: true,
		bordercolor_func: "qans"
	},

	Encode: {
		decodePzpr: function(type) {
			if (this.outbstr[0] !== "/") {
				this.decodeNumber10or16();
			}
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeNumber10or16();
			this.encodePieceBank();
		},
		decodePieceBank: function() {
			if (this.outbstr[this.outbstr.length - 1] === "=") {
				this.outbstr = this.outbstr.substring(0, this.outbstr.length - 1);
			}

			var num = +this.outbstr.substr(2);
			if (this.outbstr.substr(0, 2) === "//" && !isNaN(num)) {
				var bank = this.board.bank;
				bank.initialize(bank.generateRange(num));
				this.outbstr = "";
			} else {
				this.common.decodePieceBank.call(this);
			}
		},
		encodePieceBank: function() {
			var bank = this.board.bank;
			var count = bank.pieces.length;
			var isBasic = false;
			if (count > 0 && count <= 999 && count !== 9) {
				isBasic = true;
				for (var i = 0; i < count && isBasic; i++) {
					if (bank.pieces[i].num !== i + 1) {
						isBasic = false;
					}
				}
			}

			if (isBasic) {
				this.outbstr += "//" + count;
			} else {
				this.common.encodePieceBank.call(this);
			}
		}
	},
	"Encode@meidjuluk": {
		decodePzpr: function() {
			var bd = this.board;
			if (this.outbstr[0] !== "/") {
				this.genericDecodeNumber16(bd.cell.length, function(c, val) {
					if (val === 0) {
						bd.cell[c].ques = 7;
					} else {
						bd.cell[c].qnum = val;
					}
				});
			}
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			var bd = this.board;
			this.genericEncodeNumber16(bd.cell.length, function(c) {
				return bd.cell[c].isEmpty() ? 0 : bd.cell[c].qnum;
			});
			this.encodePieceBank();
		}
	},
	"Encode@overlap": {
		decodePzpr: function() {
			this.decodeNumber16();
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeNumber16();
			this.encodePieceBank();
		}
	},

	FileIO: {
		decodeData: function() {
			this.decodeCellQnum();
			if (this.pid === "meidjuluk") {
				this.decodeBorderAns();
			} else if (this.pid === "overlap") {
				this.decodeBorderLine();
			} else {
				this.decodeCellAns();
			}
			this.decodePieceBank();
			this.decodePieceBankQcmp();
			this.decodeCellSnum();
		},
		encodeData: function() {
			this.encodeCellQnum();
			if (this.pid === "meidjuluk") {
				this.encodeBorderAns();
			} else if (this.pid === "overlap") {
				this.encodeBorderLine();
			} else {
				this.encodeCellAns();
			}
			this.encodePieceBank();
			this.encodePieceBankQcmp();
			this.encodeCellSnum();
		},
		decodeCellQnum: function() {
			this.decodeCell(function(cell, ca) {
				cell.ques = 0;
				if (ca === "*") {
					cell.ques = 7;
				} else if (ca === "-") {
					cell.qnum = -2;
				} else if (ca !== ".") {
					cell.qnum = +ca;
				}
			});
		},
		encodeCellQnum: function() {
			this.encodeCell(function(cell) {
				if (cell.ques === 7) {
					return "* ";
				} else if (cell.qnum === -2) {
					return "- ";
				} else if (cell.qnum >= 0) {
					return cell.qnum + " ";
				} else {
					return ". ";
				}
			});
		}
	},

	"AnsCheck@snakeegg": {
		checklist: [
			"checkShadeCellExist+",
			"check2x2ShadeSection",
			"checkShadeLoop",
			"checkShadeBranch",

			"checkShadeOnCircle",
			"checkNumberSize",
			"checkCircleEndpoint",
			"checkBankPiecesAvailable",
			"checkBankPiecesInvalid",

			"checkConnectShade",
			"checkBankPiecesUsed",
			"doneShadingDecided"
		],

		check2x2ShadeSection: function() {
			this.check2x2Block(function(cell) {
				return cell.isShade() && cell.sblk.clist.length !== 4;
			}, "cs2x2");
		},

		checkShadeBranch: function() {
			this.checkAllCell(function(cell) {
				return (
					cell.isShade() &&
					cell.countDir4Cell(function(adj) {
						return adj.isShade();
					}) > 2
				);
			}, "shBranch");
		},
		checkNumberSize: function() {
			this.checkAllCell(function(cell) {
				return (
					cell.qnum > 0 && (!cell.ublk || cell.ublk.clist.length !== cell.qnum)
				);
			}, "bkSizeNe");
		},
		checkShadeOnCircle: function() {
			this.checkAllCell(function(cell) {
				return cell.qnum === 0 && !cell.isShade();
			}, "circleUnshade");
		},
		checkCircleEndpoint: function() {
			this.checkAllCell(function(cell) {
				if (!cell.isShade()) {
					return false;
				}
				return (
					cell.qnum === 0 &&
					cell.countDir4Cell(function(adj) {
						return adj.isShade();
					}) !== 1
				);
			}, "shEndpoint");
		},
		checkShadeLoop: function() {
			var blocks = this.board.sblkmgr.components;
			if (blocks.length !== 1) {
				return;
			}
			var loop = blocks[0];
			if (loop.circuits > 0) {
				this.failcode.add("shLoop");
				if (!this.checkOnly) {
					loop.clist.seterr(1);
				}
			}
		}
	},
	"AnsCheck@meidjuluk": {
		checklist: [
			"checkDifferentNumberInRoom",
			"checkSmallArea",
			"checkNumberDivisions",
			"checkBankPiecesAvailable",
			"checkBankPiecesInvalid",
			"checkBankPiecesUsed"
		],

		isDifferentNumberInClist: function(clist) {
			if (clist.length > this.board.bank.highestPiece) {
				return true;
			}
			return this.isIndividualObject(clist, function(cell) {
				return cell.getNum();
			});
		},

		checkSmallArea: function() {
			this.checkAllCell(function(cell) {
				return cell.qnum > 0 && cell.qnum > cell.room.clist.length;
			}, "bkSizeLt");
		},

		checkNumberDivisions: function() {
			var max = this.board.bank.highestPiece;
			this.checkAllCell(function(cell) {
				return (
					cell.qnum > 0 &&
					cell.room.clist.length <= max &&
					cell.room.clist.length % cell.qnum
				);
			}, "bkNumDivisor");
		}
	},
	"AnsCheck@overlap": {
		checklist: [
			"checkBankPiecesAvailable",
			"checkBankPiecesInvalid",
			"checkBankPiecesUsed"
		]
	},
	FailCode: {
		shBranch: "shBranch.snake",
		shEndpoint: "shEndpoint.snake",
		shLoop: "shLoop.snake",
		bkSizeLt: "bkSizeLt.fillomino"
	}
});
