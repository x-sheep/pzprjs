(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["scrabble", "nansuke"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["clear"],
			play: ["numexist", "objblank", "clear"]
		},
		autoedit_func: "qnum",
		autoplay_func: "qnum",

		autohide_cursor: function() {},
		inputDot: function() {
			this.inputFixedNumber(-3);
		},
		mouseinput_auto: function() {
			var pos = this.getpos(0);
			var paint = this.puzzle.painter;

			if (this.mousestart && pos.bx > this.board.maxbx) {
				if (this.puzzle.editmode) {
					var x = this.board.cols * paint.cw + paint.bh;
					this.puzzle.emit("request-wordbank", { x: x });
				} else {
					var y = (this.inputPoint.by / (paint.bankfontsize * 2)) | 0;
					var piece = this.board.bank.pieces[y];
					if (piece) {
						piece.setQcmp(piece.qcmp ? 0 : 1);
						piece.draw();
					}
				}
				return;
			}

			var cell = pos.getc();
			if (cell.isnull || cell === this.mouseCell) {
				return;
			}

			if (this.mousestart) {
				var old = this.cursor.getaddr();
				if (old.equals(cell)) {
					this.cursor.toggleDir();
				} else {
					this.cursor.setaddr(cell);
					old.drawRowOrCol(this.cursor.isVert);
					cell.drawRowOrCol(this.cursor.isVert);
				}
			} else {
				var isVert = this.cursor.getvert(cell, 2);
				if (typeof isVert === "boolean" && isVert !== this.cursor.isVert) {
					this.cursor.toggleDir();
				}
			}
		}
	},
	"MouseEvent@nansuke": {
		inputModes: {
			edit: ["empty", "clear"],
			play: ["clear"]
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,

		moveTarget: function(ca) {
			var last = this.cursor.getaddr();
			if (this.moveTCell(ca)) {
				var curr = this.cursor.getaddr();
				last.drawRowOrCol(this.cursor.isVert);
				curr.drawRowOrCol(this.cursor.isVert);
				return true;
			}
			return false;
		},

		key_inputqnum_main: function(cell, ca) {
			if (ca === "enter") {
				this.cursor.toggleDir();
				return;
			}

			if (this.pid === "nansuke") {
				if (this.puzzle.editmode && (ca === "x" || ca === "-")) {
					ca = "s1";
				}
			} else {
				if (ca === "+" && this.puzzle.playmode) {
					ca = "s1";
				} else if ((ca === " " || ca === "-") && this.puzzle.playmode) {
					ca = "s2";
				}
			}

			var current = this.puzzle.editmode ? cell.qnum : cell.qsub || cell.anum;
			if (cell.ques) {
				current = -2;
			}
			if (this.cursor.targetdir === 0 && ca === "BS" && current === -1) {
				this.cursor.goPrevious();
				cell.draw();
				cell = this.cursor.getc();
			}

			this.common.key_inputqnum_main.call(this, cell, ca);
			var wasInput = ca === " " || ca === "-" || ca === "s1" || ca === "s2";

			if (cell.numberAsLetter) {
				wasInput |= ca >= "a" && ca <= "z" && ca.length === 1;
			} else {
				wasInput |= ca >= "0" && ca <= "9";
			}

			if (this.cursor.targetdir === 0 && wasInput) {
				this.cursor.goNext();
			}
			this.cursor.draw();
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberWithMB: true,
		numberAsLetter: true,
		enableSubNumberArray: true,

		maxnum: 26,

		isDot: function() {
			return this.qsub === 2;
		},
		drawRowOrCol: function(isVert) {
			this.klass.Position.prototype.drawRowOrCol.call(this, isVert);
		}
	},
	"Cell@nansuke": {
		minnum: 0,
		maxnum: 9,
		numberWithMB: false,
		numberAsLetter: false,

		getNum: function() {
			return this.ques === 7 ? -2 : this.qnum !== -1 ? this.qnum : this.anum;
		},
		setNum: function(val) {
			if (this.puzzle.editmode) {
				if (val === -2) {
					this.setValid(7);
					return;
				} else {
					this.setValid(0);
				}
			} else if (this.ques) {
				return;
			}

			this.common.setNum.call(this, val);
		}
	},

	AreaNumberGraph: {
		enabled: true
	},

	TargetCursor: {
		isVert: false,

		initialize: function() {
			this.common.initialize.call(this);
			this.isActive = true;
		},

		toggleDir: function() {
			this.isVert = !this.isVert;
			var addr = this.getaddr();
			addr.drawRowOrCol(true);
			addr.drawRowOrCol(false);
		},

		chtarget: function(mouse, dx, dy) {
			this.common.chtarget.call(this, mouse, dx, dy);
			this.getaddr().drawRowOrCol(this.isVert);
		},

		goNext: function() {
			if (this.isVert) {
				if (!this.getc().adjacent.bottom.isnull) {
					this.movedir(this.DN, 2);
				}
			} else {
				if (!this.getc().adjacent.right.isnull) {
					this.movedir(this.RT, 2);
				}
			}
		},

		goPrevious: function() {
			if (this.isVert) {
				if (!this.getc().adjacent.top.isnull) {
					this.movedir(this.UP, 2);
				}
			} else {
				if (!this.getc().adjacent.left.isnull) {
					this.movedir(this.LT, 2);
				}
			}
		}
	},

	Position: {
		drawRowOrCol: function(isVert) {
			if (isVert) {
				this.puzzle.painter.paintRange(
					this.bx,
					this.board.minby,
					this.bx,
					this.board.maxby
				);
			} else {
				this.puzzle.painter.paintRange(
					this.board.minbx,
					this.by,
					this.board.maxbx,
					this.by
				);
			}
		}
	},

	Address: {
		drawRowOrCol: function(isVert) {
			this.klass.Position.prototype.drawRowOrCol.call(this, isVert);
		}
	},

	Board: {
		getBankPiecesInGrid: function() {
			return this.getBankPiecesInGrid_scrabble(false);
		},
		getBankPiecesInGrid_scrabble: function(allcells) {
			var ret = [];
			this.puzzle.checker.checkRowsColsPartly(
				function(clist) {
					if (clist.length < 2) {
						return true;
					}

					var word = "";
					clist.each(function(cell) {
						var num = cell.getNum();
						var letter = cell.numberAsLetter
							? (num + 9).toString(36).toUpperCase()
							: num + "";
						if (num < 0) {
							word = false;
						} else if (word !== false) {
							word += letter;
						}
					});

					if (word) {
						ret.push([word, clist]);
					}

					return true;
				},
				function(cell) {
					return allcells ? !cell.isValid() : !cell.isNum();
				}
			);
			return ret;
		}
	},
	"Board@nansuke": {
		getBankPiecesInGrid: function() {
			return this.getBankPiecesInGrid_scrabble(true);
		}
	},
	BoardExec: {
		allowedOperations: function(isplaymode) {
			return isplaymode ? 0 : this.ALLOWALL;
		}
	},
	Bank: {
		enabled: true,
		isVerticalList: true,
		allowAdd: "empty",
		presets: [
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
			var pieces = this.board.getBankPiecesInGrid(false).map(function(pair) {
				p.deserialize(pair[0]);
				return p.serialize();
			});

			// TODO sort by character length too
			pieces.sort();
			return pieces;
		},

		// TODO replace this mess with a single function that accepts an entire textfield
		splitBy: /[^a-zA-Z]/g,
		sanitizeItem: function(str) {
			var tokens = str.toUpperCase().split("");
			var numberAsLetter = this.board.emptycell.numberAsLetter;
			tokens = tokens.filter(function(ca) {
				return numberAsLetter ? ca >= "A" && ca <= "Z" : ca >= "0" && ca <= "9";
			});
			return tokens.join("");
		}
	},
	"Bank@nansuke": {
		splitBy: /[^0-9]/g
	},
	BankPiece: {
		str: "",
		deserialize: function(str) {
			var letters = this.board.emptycell.numberAsLetter;
			for (var i = 0; i < str.length; i++) {
				var point = str.codePointAt(i);
				if (letters ? point < 65 || point > 90 : point < 48 || point > 57) {
					throw Error("Invalid character");
				}
			}

			this.str = str;
			this.w = str.length;
		},
		serialize: function() {
			return this.str;
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		paint: function() {
			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawGrid();

			this.drawDotCells();
			this.drawMBs(false);
			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawChassis();
			this.drawBank();

			this.drawCursor();
		},

		getBGCellColor: function(cell) {
			var cursor = this.puzzle.cursor;

			if (!cell.isValid()) {
				return "black";
			}

			if (
				!this.board.haserror &&
				!this.board.hasinfo &&
				!this.outputImage &&
				this.puzzle.getConfig("cursor") &&
				cursor.targetdir === 0 &&
				cursor.isActive
			) {
				if (cursor.isVert && cell.bx === cursor.bx) {
					return this.qsubcolor2;
				}
				if (!cursor.isVert && cell.by === cursor.by) {
					return this.qsubcolor2;
				}
			}
			return this.getBGCellColor_qsub1(cell);
		},

		bankfontsize: 0.66,
		drawBankPiece: function(g, piece, idx) {
			g.vid = "pb_piece_" + idx;
			if (!piece) {
				g.vhide();
				return;
			}

			var fontsize = this.ch * this.bankfontsize;
			var canvasw = this.getCanvasCols() * this.cw;
			var x = this.board.cols * this.cw + this.bh;
			var maxw =
				piece.w === this.board.bank.width ? canvasw - x - this.bw : undefined;
			var y = fontsize * (piece.y + 1);

			g.fillStyle = this.getBankPieceColor(piece);
			g.font = (fontsize | 0) + "px " + this.fontfamily;
			g.textAlign = "left";
			g.textBaseline = "bottom";
			g.fillText(piece.str, x, y, maxw);
		}
	},

	Encode: {
		decodePzpr: function(type) {
			this.decodeNumber16();
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeNumber16();
			this.encodePieceBank();
		}
	},
	"Encode@nansuke": {
		decodePzpr: function(type) {
			this.decodeEmpty();
			this.decodeNumber16();
			this.decodePieceBank();
		},
		encodePzpr: function(type) {
			this.encodeBinary("ques", 7);
			this.encodeNumber16();
			this.encodePieceBank();
		}
	},

	FileIO: {
		decodeData: function() {
			this.decodeCellQnum();
			this.decodeCellAnumsub();
			this.decodePieceBank();
			this.decodePieceBankQcmp();
		},
		encodeData: function() {
			this.encodeCellQnum();
			this.encodeCellAnumsub();
			this.encodePieceBank();
			this.encodePieceBankQcmp();
		}
	},

	AnsCheck: {
		checklist: [
			"checkBankPiecesAvailable",
			"checkBankPiecesInvalid",
			"checkConnectNumber@scrabble",
			"checkNoNumCell@nansuke",
			"checkBankPiecesUsed"
		]
	}
});
