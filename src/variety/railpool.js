//
// Rail Pool / railpool.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["railpool"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["border", "empty", "clear", "info-line"],
			play: ["line", "peke", "info-line"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						this.inputpeke();
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					}
				}
			} else if (this.puzzle.editmode) {
				if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputborder();
					} else if (this.mouseend && this.notInputted()) {
						this.setcursor(this.getcell());
					}
				} else if (this.btn === "right") {
					this.inputempty();
				}
			}
		},
		// taken from simpleloop
		mouseinput_other: function() {
			if (this.inputMode === "empty") {
				this.inputempty();
			}
		},
		inputempty: function() {
			var cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) {
				return;
			}
			if (this.inputData === null) {
				this.inputData = cell.isEmpty() ? 0 : 7;
			}

			cell.setQues(this.inputData);
			cell.drawaround();
			this.mouseCell = cell;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function(ca) {
			this.key_inputqnum_railpool(ca);
		},
		key_inputqnum_railpool: function(ca) {
			var cell = this.cursor.getc(),
				nums = cell.qnums,
				val = [];

			// this is really weird and should be improved
			if (("1" <= ca && ca <= "9") || ca === "-") {
				var num = ca !== "-" ? +ca : -2;
				if (num === -2) {
					// typed a question mark
					if (nums.length <= 3) {
						// if there's space, add another question mark clue
						val = nums.concat([num]);
					} else {
						// if there are already 4 clues...
						if (
							nums.every(function(n) {
								return n === -2;
							})
						) {
							// remove all of them, if they are all question marks
							val = [];
						} else {
							// if there are numbers, remove them to make space for question marks
							val = nums.slice(1).concat([-2]);
						}
					}
				} else {
					// typed a number
					if (nums.includes(num)) {
						// if it's in the cell, remove it;
						val = nums.filter(function(n) {
							return n !== num;
						});
					} else {
						// if not, add it (and if needed, remove a value to not exceed 4 clues per tile)
						if (nums.length > 3) {
							nums = nums.slice(0, 3);
						}
						val = nums.concat([num]).sort(function(a, b) {
							if (a === -2) {
								return 1;
							}
							if (b === -2) {
								return -1;
							}
							return a - b;
						});
					}
				}
			} else if (ca === "BS" || ca === " ") {
				val = [];
			} else {
				return;
			}

			cell.setNums(val);

			this.prev = cell;
			cell.draw();
		}
	},

	// (almost) everything between here and Border is taken from tapaloop.js
	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		qnums: [],
		noLP: function(dir) {
			return this.isEmpty();
		},
		setNums: function(val) {
			this.setQnums(val);
			this.setQans(0);
			this.setQsub(0);
		},
		setQnums: function(val) {
			if (this.puzzle.pzpr.util.sameArray(this.qnums, val)) {
				return;
			}
			this.addOpeQnums(this.qnums, val); // i don't know what this is for
			this.qnums = val;
		},
		addOpeQnums: function(old, val) {
			if (this.puzzle.pzpr.util.sameArray(old, val)) {
				return;
			}
			this.puzzle.opemgr.add(new this.klass.ObjectOperation2(this, old, val));
		},
		// this was taken from geradeweg.js
		getSegment: function(horiz) {
			var llist = new this.klass.PieceList();
			var cell;
			if (horiz) {
				for (
					cell = this;
					cell.adjborder.right.isLine();
					cell = cell.adjacent.right
				) {
					llist.add(cell.adjborder.right);
				}
				for (
					cell = this;
					cell.adjborder.left.isLine();
					cell = cell.adjacent.left
				) {
					llist.add(cell.adjborder.left);
				}
			} else {
				for (
					cell = this;
					cell.adjborder.top.isLine();
					cell = cell.adjacent.top
				) {
					llist.add(cell.adjborder.top);
				}
				for (
					cell = this;
					cell.adjborder.bottom.isLine();
					cell = cell.adjacent.bottom
				) {
					llist.add(cell.adjborder.bottom);
				}
			}
			return llist;
		},		
		seterr: function(num) {
			if (!this.board.isenableSetError()) {
				return;
			}
			this.error |= num;
		}
	},
	CellList: {
		allclear: function(isrec) {
			this.common.allclear.call(this, isrec);

			for (var i = 0; i < this.length; i++) {
				var cell = this[i];
				if (cell.qnums.length > 0) {
					if (isrec) {
						cell.addOpeQnums(cell.qnums, []);
					}
					cell.qnums = [];
				}
			}
		},
		getClueSet: function() {
			var result = [];
			for (var i = 0; i < this.length; i++) {
				var cell = this[i];
				for (var k = 0; k < cell.qnums.length; k++) {
					var num = cell.qnums[k];
					if (num === -2 || !result.includes(num)) {
						result.push(num);
					}
				}
			}
			return result;
		},
		getSegmentLengthsSet: function() {
			var result = [];
			for (var i = 0; i < this.length; i++) {
				var cell = this[i];

				var horiz = cell.getSegment(true);
				var vert = cell.getSegment(false);

				if (horiz.length > 0 && !result.includes(horiz.length)) {
					result.push(horiz.length);
				}

				if (vert.length > 0 && !result.includes(vert.length)) {
					result.push(vert.length);
				}
			}
			return result;
		}
	},
	"ObjectOperation2:Operation": {
		setData: function(cell, old, val) {
			this.bx = cell.bx;
			this.by = cell.by;
			this.old = old;
			this.val = val;
			this.property = "qnums";
		},
		decode: function(strs) {
			if (strs.shift() !== "CR") {
				return false;
			}
			this.bx = +strs.shift();
			this.by = +strs.shift();
			var str = strs.join(",");
			var strs2 = str.substr(1, str.length - 2).split(/\],\[/);
			if (strs2[0].length === 0) {
				this.old = [];
			} else {
				this.old = strs2[0].split(/,/);
				for (var i = 0; i < this.old.length; i++) {
					this.old[i] = +this.old[i];
				}
			}
			if (strs2[1].length === 0) {
				this.val = [];
			} else {
				this.val = strs2[1].split(/,/);
				for (var i = 0; i < this.val.length; i++) {
					this.val[i] = +this.val[i];
				}
			}
			return true;
		},
		toString: function() {
			return [
				"CR",
				this.bx,
				this.by,
				"[" + this.old.join(",") + "]",
				"[" + this.val.join(",") + "]"
			].join(",");
		},

		isModify: function(lastope) {
			// 前回と同じ場所なら前回の更新のみ
			if (
				lastope.property === this.property &&
				lastope.bx === this.bx &&
				lastope.by === this.by &&
				this.puzzle.pzpr.util.sameArray(lastope.val, this.old)
			) {
				lastope.val = this.val;
				return true;
			}
			return false;
		},

		undo: function() {
			this.exec(this.old);
		},
		redo: function() {
			this.exec(this.val);
		},
		exec: function(val) {
			var puzzle = this.puzzle,
				cell = puzzle.board.getc(this.bx, this.by);
			cell.setQnums(val);
			cell.draw();
			puzzle.checker.resetCache();
		}
	},
	OperationManager: {
		addExtraOperation: function() {
			this.operationlist.push(this.klass.ObjectOperation2);
		}
	},

	Border: {
		enableLineNG: true
	},
	Board: {
		hasborder: 1
	},
	AreaRoomGraph: {
		enabled: true
	},
	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,
		
		// individual number error coloring inspired on lohkous.js
		getQuesNumberColor: function(cell, i) {
			if (cell.error & 1) {
				return this.errcolor1;
			} else if (cell.error & (8 << i)) {
				return "red";
			}
			return this.quescolor;
		},

		paint: function() {
			this.drawBGCells();
			this.drawGrid();

			this.drawBorders();
			this.drawTapaNumbers();

			this.drawPekes();
			this.drawLines();

			this.drawChassis();
			this.drawTarget();
		},

		// from simpleloop.js
		getBGCellColor: function(cell) {
			return cell.ques === 7 ? "black" : this.getBGCellColor_error1(cell);
		},
		getBorderColor: function(border) {
			var cell1 = border.sidecell[0],
				cell2 = border.sidecell[1];
			if (
				border.inside &&
				!cell1.isnull &&
				!cell2.isnull &&
				(cell1.isEmpty() || cell2.isEmpty())
			) {
				return "black";
			}
			return this.getBorderColor_ques(border);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decodeBorder();
			this.decodeEmpty();
			this.decodeNumber_railpool();
		},
		encodePzpr: function(type) {
			this.encodeBorder();
			this.encodeEmpty();
			this.encodeNumber_railpool();
		},
		// each number cell can have up to 4 clues between 0..9, strictly increasing
		// and non repeating (with the exception of 0, which we use to encode '?')
		// in total, this is 438 possible options.
		// Tapa clues are encoded using 2 chars, one in base 16 and 
		// the other in base 36, giving 576 possible values.
		// In other words, if we are very very smart about the encoding, 
		// we could fit each number clues in just 2 chars.
		// After wasting way too much time trying it (without a precomputed table),
		// I'm surrendering and simply using 1 char per number
		decodeNumber_railpool: function() {
			var c = 0,
				i = 0,
				bstr = this.outbstr,
				bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				var cell = bd.cell[c],
					ca = bstr.charAt(i);

				if (this.include(ca, "0", "j")) {
					var val = [];
					
					while (!this.include(ca, "0", "9")) {
						val.push(parseInt(ca, 36) - 10);
						i++;
						ca = bstr.charAt(i);
					}
					val.push(parseInt(ca, 36));
					
					for (var k = 0; k < 4; k++) {
						if (val[k] === 0) {
							val[k] = -2;
						}
					}
					cell.qnums = val;					
				} else if (ca >= "k" && ca <= "z") {
					c += parseInt(ca, 36) - 20;
				}

				c++;
				if (!bd.cell[c]) {
					break;
				}
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeNumber_railpool: function() {
			var count = 0,
				cm = "",
				bd = this.board;
			for (var c = 0; c < bd.cell.length; c++) {
				// Since 0 isn't a valid clue, encode ? as 0
				var pstr = "",
					qn = bd.cell[c].qnums.map(function (n) {
						if (n === -2) {
							return 0;
						}
						return n;
					});

				if (qn.length === 0) {
					count++;
				} else {
					for (var k=0; k<qn.length - 1; k++) {
						pstr += (qn[k] + 10).toString(36);
					}
					pstr += (qn[qn.length - 1]).toString(10);
				}

				if (count === 0) {
					cm += pstr;
				} else if (pstr || count === 16) {
					cm += (19 + count).toString(36) + pstr;
					count = 0;
				}
			}
			if (count > 0) {
				cm += (19 + count).toString(36);
			}

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeQnums_railpool();
			this.decodeEmpty();
			this.decodeAreaRoom();
			this.decodeBorderLine();
		},
		encodeData: function() {
			this.encodeQnums_railpool();
			this.encodeEmpty();
			this.encodeAreaRoom();
			this.encodeBorderLine();
		},
		// from tapaloop.js
		decodeQnums_railpool: function() {
			this.decodeCell(function(cell, ca) {
				if (ca !== ".") {
					cell.qnums = [];
					var array = ca.split(/,/);
					for (var i = 0; i < array.length; i++) {
						cell.qnums.push(array[i] !== "-" ? +array[i] : -2);
					}
				}
			});
		},
		encodeQnums_railpool: function() {
			this.encodeCell(function(cell) {
				if (cell.qnums.length > 0) {
					var array = [];
					for (var i = 0; i < cell.qnums.length; i++) {
						array.push(cell.qnums[i] >= 0 ? "" + cell.qnums[i] : "-");
					}
					return array.join(",") + " ";
				} else {
					return ". ";
				}
			});
		},
		// from country.js
		decodeEmpty: function() {
			this.decodeCell(function(cell, ca) {
				if (ca === "*") {
					cell.ques = 7;
				}
			});
		},
		encodeEmpty: function() {
			this.encodeCell(function(cell) {
				if (cell.ques === 7) {
					return "* ";
				} else {
					return ". ";
				}
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",

			"checkUncluedLength",
			"checkMissingLength",
			"checkIncompatibleSets",

			"checkDeadendLine+",
			"checkOneLoop",
			"checkNoLine"
		],

		checkUncluedLength: function() {
			var result = true,
				rooms = this.board.roommgr.components;
			for (var r = 0; r < rooms.length; r++) {
				var clist = rooms[r].clist,
					clueSet = rooms[r].clist.getClueSet();
				if (clueSet.length === 0) {
					continue;
				}
				if (clueSet.includes(-2)) {
					// question marks are checked in checkIncompatibleSets
					continue;
				}
				for (var i = 0; i < clist.length; i++) {
					var cell = clist[i];

					var horiz = cell.getSegment(true);
					var vert = cell.getSegment(false);

					if (horiz.length > 0 && !clueSet.includes(horiz.length)) {
						result = false;
						if (this.checkOnly) {
							break;
						}
						horiz.seterr(1);
					}

					if (vert.length > 0 && !clueSet.includes(vert.length)) {
						result = false;
						if (this.checkOnly) {
							break;
						}
						vert.seterr(1);
					}
				}

				if (this.checkOnly && !result) {
					break;
				}
			}
			if (!result) {
				this.failcode.add("segUnclued");
			}
		},

		checkMissingLength: function() {
			var result = true,
				rooms = this.board.roommgr.components;
			for (var r = 0; r < rooms.length; r++) {
				var clist = rooms[r].clist,
					clueSet = rooms[r].clist.getClueSet();
				if (clueSet.length === 0) {
					continue;
				}

				var actualSet = rooms[r].clist.getSegmentLengthsSet();
				for (var k = 0; k < clueSet.length; k++) {
					var clueNum = clueSet[k];
					if (clueNum === -2) {
						continue;
					}
					if (!actualSet.includes(clueNum)) {
						result = false;

						if (this.checkOnly) {
							break;
						}

						for (var i = 0; i < clist.length; i++) {
							var cell = clist[i];
							for (var j = 0; j < cell.qnums.length; j++) {
								if (cell.qnums[j] === clueNum) {
									cell.seterr(8 << j);
								}
							}
						}
					}
				}

				if (this.checkOnly && !result) {
					break;
				}
			}
			if (!result) {
				this.failcode.add("clueUnused");
			}
		},

		checkIncompatibleSets: function() {
			var result = true,
				rooms = this.board.roommgr.components;

			for (var r = 0; r < rooms.length; r++) {
				var clueSet = rooms[r].clist.getClueSet();
				if (clueSet.length === 0) {
					continue;
				}
				var actualSet = rooms[r].clist.getSegmentLengthsSet();

				if (clueSet.length !== actualSet.length) {
					result = false;
					if (this.checkOnly) {
						break;
					}
					rooms[r].clist.seterr(1);
				}
			}
			if (!result) {
				this.failcode.add("incompatibleSets");
			}
		}
	}
});
