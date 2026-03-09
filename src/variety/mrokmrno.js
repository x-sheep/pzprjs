(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["mrokmrno"], {
	MouseEvent: {
		inputModes: { edit: ["number", "clear"], play: ["number", "clear"] },
		autoedit_func: "qnum",
		autoplay_func: "qnum"

		// TODO qsub input
		// TODO click on ques circle to cycle faces
	},

	KeyEvent: {
		enablemake: true,
		enableplay: true
	},

	BoardExec: {
		allowedOperations: function(isplaymode) {
			return isplaymode ? 0 : this.ALLOWALL;
		}
	},

	Cell: {
		enableSubNumberArray: true,
		disInputHatena: true,
		numberWithMB: true,

		// 1: N
		// 2: K
		// 3: O
		// 4: No mouth
		// 5: Happy
		// 6: Sad

		maxnum: 6,

		getNum: function() {
			return this.anum !== -1 ? this.anum : this.qnum;
		},
		setNum: function(val) {
			if (val === 0) {
				return;
			}
			if (this.puzzle.editmode) {
				this.setQnum(val);
				this.setAnum(-1);
				this.clrSnum();
			} else {
				this.setAnum(val);
				if (this.isNum()) {
					this.clrSnum();
				}
			}
		},

		prehook: {
			anum: function(num) {
				if (num === -1) {
					return false;
				}
				switch (this.qnum) {
					case 3:
						return num <= 3;
					case 4:
						return num <= 4;
					case -1:
						return false;
					default:
						return true;
				}
			}
		}
	},
	AreaNumberGraph: {
		enabled: true,
		isnodevalid: function(cell) {
			return cell.isNum();
		}
		// TODO find adjacent letters, as well as invalid letter combos
	},

	Graphic: {
		paint: function() {
			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawGrid();

			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawCursor();
		},

		// TODO draw eyes and mouth

		getNumberTextCore: function(num) {
			switch (num) {
				case 1:
					return "N";
				case 2:
					return "K";
				case 3:
					return "O";
				case 4:
					return "OO";
				case 5:
					return ")";
				case 6:
					return "(";
				default:
					return "";
			}
		}
	},

	Encode: {
		decodePzpr: function(type) {
			this.decodeNumber10();
		},
		encodePzpr: function(type) {
			this.encodeNumber10();
		}
	},
	FileIO: {},

	AnsCheck: {
		checklist: [
			"checkOverThreeCells",
			"checkNoMouth",
			"checkIdentical",
			"checkLessThreeCells"
		],
		checkNoMouth: function() {
			this.checkAllCell(function(cell) {
				return cell.getNum() === 4;
			}, "ceNoMouth");
		},

		checkLessThreeCells: function() {
			this.checkAllArea(
				this.board.nblkmgr,
				function(w, h, a, n) {
					return a >= 3;
				},
				"bkSizeLt3"
			);
		},
		checkOverThreeCells: function() {
			this.checkAllArea(
				this.board.nblkmgr,
				function(w, h, a, n) {
					return a <= 3;
				},
				"bkSizeGt3"
			);
		},
		// TODO check invalid letter combos (exactly 2 letters)
		// TODO check too many faces
		// TODO check too many letters

		checkIdentical: function() {
			var bd = this.board;
			var hasError = false;
			this.checkRowsCols(function(clist) {
				var found = null;

				for (var idx = 0; idx < clist.length; idx++) {
					var cell = clist[idx];
					if (!cell.isNum()) {
						continue;
					}

					if (found && found.getNum() === cell.getNum()) {
						if (this.checkOnly) {
							return false;
						}
						hasError = true;
						bd.cellinside(found.bx, found.by, cell.bx, cell.by).seterr(1);
					}
					found = cell;
				}

				return true;
			}, "nmDupRow");
			if (hasError) {
				this.failcode.add("nmDupRow");
			}
		}
	},
	FailCode: {
		nmDupRow: "nmDupRow.lollipops"
	}
});
