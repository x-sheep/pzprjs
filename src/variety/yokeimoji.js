(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["yokeimoji"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
		use: true,
		inputModes: {
			edit: ["number", "clear", "info-blk"],
			play: ["shade", "unshade", "peke", "info-blk"]
		},
		autoedit_func: "qnum",
		// TODO change mouse input
		autoplay_func: "cellpeke"
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		key_inputqnum_main: function(cell, ca) {
			var vowel = this.board.vowels.indexOf(ca);

			if (ca === "BS" || ca === " ") {
				cell.setQnum(-1);
				cell.setQchar(0);
			} else if (ca === "-" || ca === "s1") {
				cell.setQnum(-2);
				cell.setQchar(0);
			} else if (vowel >= 0) {
				if (cell.qchar !== 0 && cell.qnum > 0) {
					cell.setQchar(0);
				}
				cell.setQnum(vowel + 1);
			} else if (ca in this.board.letterMap) {
				var code = ca.charCodeAt(0) - 97;
				if (code !== cell.qchar) {
					cell.setQchar(code);
					cell.setQnum(0);
				} else {
					// TODO only cycle numbers when repeatedly pressing the same key
					cell.setQnum(0);
					// cell.setQnum((cell.qnum + 1) % 6);
				}
			} else {
				return;
			}

			cell.draw();
		}
	},

	Cell: {
		minnum: 0,
		maxnum: 5,

		kana: function() {
			if (this.qnum < 0) {
				return this.qnum === -2 ? "ー" : "";
			}

			var consonant =
				this.qchar === 0 ? "" : String.fromCodePoint(97 + this.qchar);
			if (this.qnum) {
				var result = this.board.letterMap[consonant][this.qnum - 1];
				if (result === " ") {
					return consonant + result;
				}
				return result || consonant;
			}
			return consonant === "n" ? "ン" : consonant;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Board: {
		hasborder: 1,
		cols: 8,
		rows: 8,

		vowels: "aiueo",

		letterMap: {
			"": "アイウエオ",
			k: "カキクケコ",
			g: "ガギグゲゴ",
			s: "サシスセソ",
			z: "ザジズゼゾ",
			t: "タチツテト",
			d: "ダヂヅデド",
			n: "ナニヌネノ",
			h: "ハヒフヘホ",
			b: "バビブベボ",
			p: "パピプペポ",
			m: "マミムメモ",
			y: "ヤ ユ ヨ",
			r: "ラリルレロ",
			w: "ワヰ ヱヲ"
		}
	},

	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		errcolor1: "red",
		fontShadecolor: "rgb(96,96,96)",

		paint: function() {
			this.drawBGCells();
			this.drawGrid();
			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawPekes();

			this.drawTarget();
		},

		getQuesNumberText: function(cell) {
			return cell.kana();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeCellQnum();
			this.decodeCellAns();
			this.decodeBorderLine();
		},
		encodeData: function() {
			this.encodeCellQnum();
			this.encodeCellAns();
			this.encodeBorderLineIfPresent();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			// TODO letter start 1
			// TODO letter start 2
			// TODO letter sequence 1
			// TODO letter sequence 2
			// TODO letter sequence 3
			// TODO unique words
			"doneShadingDecided"
		]
	}
});
