//
// パズル固有スクリプト部 スリザーリンク・バッグ版 slither.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["slither", "swslither"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["number", "clear", "info-line"],
			play: [
				"line",
				"peke",
				"bgcolor",
				"bgcolor1",
				"bgcolor2",
				"clear",
				"info-line"
			]
		},
		mouseinput_auto: function() {
			var puzzle = this.puzzle;
			if (puzzle.playmode) {
				if (this.checkInputBGcolor()) {
					this.inputBGcolor();
				} else if (this.btn === "left") {
					if (this.mousestart || this.mousemove) {
						this.inputLine();
					} else if (this.mouseend && this.notInputted()) {
						this.prevPos.reset();
						this.inputpeke();
					}
				} else if (this.btn === "right") {
					if (this.mousestart || this.mousemove) {
						this.inputpeke();
					}
				}
			} else if (puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
			}
		},

		checkInputBGcolor: function() {
			var inputbg = this.puzzle.execConfig("bgcolor");
			if (inputbg) {
				if (this.mousestart) {
					inputbg = this.getpos(0.25).oncell();
				} else if (this.mousemove) {
					inputbg = this.inputData >= 10;
				} else {
					inputbg = false;
				}
			}
			return inputbg;
		}
	},

	"MouseEvent@swslither": {
		inputModes: {
			edit: ["sheep", "wolf", "number", "clear", "info-line"],
			play: [
				"line",
				"peke",
				"bgcolor",
				"bgcolor1",
				"bgcolor2",
				"clear",
				"info-line"
			]
		},
		mouseinput_other: function() {
			switch (this.inputMode) {
				case "sheep":
					this.inputFixedNumber(5);
					break;
				case "wolf":
					this.inputFixedNumber(6);
					break;
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: 4,
		minnum: 0,

		getdir4BorderLine1: function() {
			var adb = this.adjborder,
				cnt = 0;
			if (adb.top.isLine()) {
				cnt++;
			}
			if (adb.bottom.isLine()) {
				cnt++;
			}
			if (adb.left.isLine()) {
				cnt++;
			}
			if (adb.right.isLine()) {
				cnt++;
			}
			return cnt;
		}
	},

	"Cell@swslither": {
		maxnum: 6
	},

	Board: {
		hasborder: 2,
		borderAsLine: true,

		operate: function(type) {
			switch (type) {
				case "outlineshaded":
					this.outlineShaded();
					break;
				default:
					this.common.operate.call(this, type);
					break;
			}
		},

		outlineShaded: function() {
			this.border.each(function(border) {
				border.updateShaded();
			});
		}
	},

	"Board@swslither": {
		scanResult: null,
		scanInside: function() {
			if (this.scanResult !== null) {
				return this.scanResult;
			}

			var inside = false;
			this.cell.each(function(cell) {
				if (cell.adjborder.left.isLine()) {
					inside = !inside;
				}
				cell.inside = inside;
				if (
					(cell.id + 1) % cell.board.cols === 0 &&
					cell.adjborder.right.isLine()
				) {
					inside = !inside;
				}
			});

			this.scanResult = true;
			return true;
		},

		rebuildInfo: function() {
			this.scanResult = null;
			this.common.rebuildInfo.call(this);
		}
	},

	Border: {
		updateShaded: function() {
			var c0 = this.sidecell[0],
				c1 = this.sidecell[1];
			var qsub1 = c0.isnull ? 2 : c0.qsub;
			var qsub2 = c1.isnull ? 2 : c1.qsub;
			if (qsub1 === 0 || qsub2 === 0) {
				return;
			}
			if (qsub1 === qsub2) {
				this.setLineVal(0);
			} else {
				this.setLine();
			}
			this.draw();
		}
	},

	"Border@swslither": {
		posthook: {
			line: function() {
				this.board.scanResult = null;
			}
		}
	},

	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,
		bgcellcolor_func: "qsub2",
		numbercolor_func: "qnum",
		margin: 0.5,

		paint: function() {
			this.drawBGCells();
			this.drawLines();
			this.drawBaseMarks();
			if (this.pid === "swslither") {
				this.drawSheepWolf();
			}
			this.drawQuesNumbers();
			this.drawPekes();
			this.drawTarget();
		},

		repaintParts: function(blist) {
			this.range.crosses = blist.crossinside();
			this.drawBaseMarks();
		}
	},

	"Graphic@swslither": {
		initialize: function() {
			this.imgtile = new this.klass.ImageTile();
			this.common.initialize.call(this);
		},
		drawSheepWolf: function() {
			var g = this.vinc("cell_number_image", "auto");
			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i];
				var keyimg = ["cell", cell.id, "quesimg"].join("_");
				var x = (cell.bx - 1) * this.bw;
				var y = (cell.by - 1) * this.bh;
				var tile = cell.qnum >= 5 ? cell.qnum - 5 : null;
				this.imgtile.putImage(g, keyimg, tile, x, y, this.cw, this.ch);
			}
		},
		getQuesNumberText: function(cell) {
			if (cell.qnum >= 5) {
				return "";
			}
			return this.common.getQuesNumberText.call(this, cell);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decode4Cell();
		},
		encodePzpr: function(type) {
			this.encode4Cell();
		},

		decodeKanpen: function() {
			this.fio.decodeCellQnum_kanpen();
		},
		encodeKanpen: function() {
			this.fio.encodeCellQnum_kanpen();
		}
	},
	"Encode@swslither": {
		decodePzpr: function(type) {
			this.decodeNumber10();
		},
		encodePzpr: function(type) {
			this.encodeNumber10();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			if (this.filever === 1) {
				this.decodeCellQnum();
				this.decodeCellQsub();
				this.decodeBorderLine();
			} else if (this.filever === 0) {
				this.decodeCellQnum();
				this.decodeBorderLine();
			}
		},
		encodeData: function() {
			this.filever = 1;
			this.encodeCellQnum();
			this.encodeCellQsub();
			this.encodeBorderLine();
		},
		kanpenOpen: function() {
			this.decodeCellQnum_kanpen();
			this.decodeBorderLine();
		},
		kanpenSave: function() {
			this.encodeCellQnum_kanpen();
			this.encodeBorderLine();
		},

		kanpenOpenXML: function() {
			this.PBOX_ADJUST = 0;
			this.decodeCellQnum_XMLBoard_Brow();
			this.PBOX_ADJUST = 1;
			this.decodeBorderLine_slither_XMLAnswer();
		},
		kanpenSaveXML: function() {
			this.PBOX_ADJUST = 0;
			this.encodeCellQnum_XMLBoard_Brow();
			this.PBOX_ADJUST = 1;
			this.encodeBorderLine_slither_XMLAnswer();
		},

		UNDECIDED_NUM_XML: 5,
		PBOX_ADJUST: 1,
		decodeBorderLine_slither_XMLAnswer: function() {
			this.decodeCellXMLArow(function(cross, name) {
				var val = 0;
				var bdh = cross.relbd(0, 1),
					bdv = cross.relbd(1, 0);
				if (name.charAt(0) === "n") {
					val = +name.substr(1);
				} else {
					if (name.match(/h/)) {
						val += 1;
					}
					if (name.match(/v/)) {
						val += 2;
					}
				}
				if (val & 1) {
					bdh.line = 1;
				}
				if (val & 2) {
					bdv.line = 1;
				}
				if (val & 4) {
					bdh.qsub = 2;
				}
				if (val & 8) {
					bdv.qsub = 2;
				}
			});
		},
		encodeBorderLine_slither_XMLAnswer: function() {
			this.encodeCellXMLArow(function(cross) {
				var val = 0,
					nodename = "";
				var bdh = cross.relbd(0, 1),
					bdv = cross.relbd(1, 0);
				if (bdh.line === 1) {
					val += 1;
				}
				if (bdv.line === 1) {
					val += 2;
				}
				if (bdh.qsub === 2) {
					val += 4;
				}
				if (bdv.qsub === 2) {
					val += 8;
				}

				if (val === 0) {
					nodename = "s";
				} else if (val === 1) {
					nodename = "h";
				} else if (val === 2) {
					nodename = "v";
				} else if (val === 3) {
					nodename = "hv";
				} else {
					nodename = "n" + val;
				}
				return nodename;
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",

			"checkdir4BorderLine",

			"checkOneLoop",
			"checkDeadendLine+",

			"checkSheepIn@swslither",
			"checkWolvesOut@swslither"
		],

		checkdir4BorderLine: function() {
			this.checkAllCell(function(cell) {
				return (
					cell.qnum >= 0 &&
					cell.qnum <= 4 &&
					cell.getdir4BorderLine1() !== cell.qnum
				);
			}, "nmLineNe");
		},

		checkSheepIn: function() {
			var bd = this.board;
			if (!bd.scanInside()) {
				return;
			}
			this.checkAllCell(function(cell) {
				return cell.qnum === 5 && !cell.inside;
			}, "nmOutside");
		},

		checkWolvesOut: function() {
			var bd = this.board;
			if (!bd.scanInside()) {
				return;
			}
			this.checkAllCell(function(cell) {
				return cell.qnum === 6 && cell.inside;
			}, "nmInside");
		}
	},

	"ImageTile@swslither": {
		imgsrc_dataurl:
			"data:image/webp;base64,UklGRiYHAABXRUJQVlA4WAoAAAAQAAAA/wAAfwAAQUxQSPECAAABkBSAbSRJgiZogrJMtAwWwkAYCHp0dR22K3luREwA/qeUkkjumnLS5H4pV829Uu40N0q5mduk3K5NUh7kFjGPbpGf0d6QBJSHl4hN5Hw67yY5sU02oZRDsxydqpTIuZSTNstJOetqTHFzKOaiWUq5ymKulmgmX0nMKlKuq5bTUO+QmCWUO2sxLfkSifmYcm8t9xAgxbY5XBLxiJLzaZs8Uu6ulabKd3O6xKScyxaV+0uxy3kOoQc68mWydhpBM3AUvE1ASWQzTOL3+WqxlV+KoyRxJw3CUpgmZh+8laZJ1MdjGMXnidpoDFbTPFEXTGEUpkRC86SNhmAhZWx1wQzGCkRdNAIrcT0wgVBac6WNBkBxzcUu6Kdq0Fh/2qibUV9TpQ3UjAvhNuhl1FfmVhu1Yj1mcnVBJ6O+R4tWKNPrbVSP4yViPXZKPb1AXM+tuCLhq6icV4TprQ1Ic68IiqtbVEzrwfTncqgWM6Br4Q1Q2xNEtTSfajkzaiVMlHamZCVoOKG0M2cpeB2cQV0KXgVnVJWC1kAZVqUyuesw46qQ1sDzpJBHUxlmYJVhRmcZTxQuVT7lYVRFa6BEAqeQDrgCRm1mSoBOhKoejcUypgAQdbUOniOoPZpR2hlUtTgZSjOjqhQGUy0duJ3UQWMJxZ0IUDcAToIlEHq2EwAS1T2T0NTdgpYaSWjKnLRcSPIXtYDmEdr6mwCAVYRPd4LHQTvhWEVwTCdCVy+DPoSTNfgFINHXs7gRSOG0ivWmF+FyCWNMekXwKgAoezVUgKN8/kygVzHG/bsYeI7zcDX0GLYHT2lNOIsewhL82vZgeEYToYEB4ByG5RPGFkEPcCbX03jQbcQuQTcJ4/362k8NDwTeQkytEwYp+98ZkbYt0S8D6pIw97lDnsJJfzM+fUYjAaDPCJOzCnRg4pAvAICUJRKzn9FDn8RZHZlYfle6SonEBvIbbuBD+6gD8wv2CyBJnNyxqz6BTec37RroA2HjKRL/hwsAVlA4IA4EAACwJgCdASoAAYAAPulorlEpJaQipxEsYSAdCWlu3WBpKT+s39rtO4467dB3cBYh8Z7l3kagFlcg1Jc8ycEfC/S0kx/fahFc4s4lfa47VTiezaIrryYyEcIoST30o+pTGaQCRExE3lnaZ4XnSg0PHEOMiw+4y4RvBbU20rcDCagAPJvkCyyACWVXkX8cVHPa3K68SoAxPjIERcoHajuraJG/HlAVcyO6yi7W2nAzH/OC0w+VvxF9VOGly6OOHXqg0CeerFxfV6omLVqwKnaoB8RMUFftZYLqyLjhuWhbJgnZdAD4DS4KQrzMif5yW2LGDwwRL6lIWeJFE0/T0EN+AuenW+EdNfupyYrjStCvtOWbMaUa/2qtVsHdRzdFdclbm668CL7XluwMIeZ42zqHSZnZkyEqKuaBxseYn+hmHQAA/vWGJ8bdf//TFgLm4FHtZLMKQYbdfccl/I1QlPV0OYrmZFcoDoe/WY6KQk59/z899fSyhnsKeI8sjNm+xHBdr2JI3zazDS8LFwkFrlokl/BsIDUJGbWBoh2UHyw0M7/ni4fX3EHxf/93eoeolK+0m1MGn6cizzgIWhvu63WvYR2TgxzazGP1TGgAErS+Mo6vREgFDMoTwnPxjUEcqsKrB9+W062tn90VX72KWCbzQkTDh0pSeREgpn4YjHW13Hfjw+BdmbVPlAzTJk4miALyCNA0yYZp6D6VrwPObym3Vj0aa55Hfq9qsit16PXGehx5MW9WCsLELzPwLuPrBh4Uls+Qju+em5UyZrMZ6OgTVUpNaZvIxN7v/vTuoN56Y4hgNw496ABgSHYIX1TlH7xoRQ734V7GO4W4RIy/D2yQ6otgin6pVuSM+JLulVfq+i/HjIT//3liX6/KaZHZraypzKVERqT1eVhVOLTF06UrSy+o7wt4fhPFKSs+f4PjtE7xOhx/tGtVIASafOFJtUIFWGDDQXpXxy/C9bm22rYV2La2tAOnU5Bmwc9a/XhqiqRh2P0dOzTAkQTu1KcgZ1Jwkc4YmMz/1zaX+mKAym+DOozDOZYS5sjlGYzYKke6FJgREtB4QkQZ+v0YnZkjMuR7C82JWQ7+dS5aiALxv7S1CsTyXZPVWQqY8s9fopsjAeJ0B2BDgSzLI4hksg9Du6/nn8MwI0BlelA2tsxn6IqvrPQz6BbUwbmfIxRQvEBZQWooSvoeLk5zIfWf2B1JBvvwliA4mIhUJ8PydD3Uxlksa5bXyEyXMMP9tnmwn1LDIuNkf8CIF+0IdeIZceOzU1xH1/XaAGeWN81ayt+WLXaZo0d4d53SKtvLZf8Nyv76TCZ5KWoOzaEnPx4C+4iIrr8wAl6BlMt5RsBxueHYR4s+2hH1Kq36LDfNQ5O+vXAAAAA=",
		cols: 2,
		rows: 1,
		width: 256,
		height: 128
	}
});
