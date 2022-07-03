//
// context.js
//
(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["context"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
		use: true,
		inputModes: {
			edit: ["number", "clear"],
			play: ["shade", "unshade", "info-ublk"]
		},
		mouseinput_auto: function() {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					this.inputcell();
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum();
				}
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function(ca) {
			if (ca.match(/shift/)) {
				return false;
			}
			return this.moveTCell(ca);
		},

		keyinput: function(ca) {
			if (this.key_inputdirec(ca)) {
				return;
			}
			this.key_inputqnum(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		minnum: 0,
        maxnum: 4
	},

	BoardExec: {
		adjustBoardData: function(key, d) {
			this.adjustNumberArrow(key, d);
		}
	},

	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		fontShadecolor: "rgb(96,96,96)",

		paint: function() {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawShadedCells();

			this.drawArrowNumbers();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function(type) {
			this.decodeNumber16();
		},
		encodePzpr: function(type) {
			this.encodeNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function() {
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function() {
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
            "checkShadeCountDiag",
            "checkUnshadeCountAdj",
			"checkConnectUnshadeRB",
			"doneShadingDecided"
		],

        checkShadeCountDiag: function(){
            this.checkAllCell(function(cell) {
                return cell.qnum >= 0 && cell.isShade() && ((cell.relobj(-2,-2).isShade()) + (cell.relobj(-2,2).isShade()) + (cell.relobj(2,-2).isShade()) + (cell.relobj(2,2).isShade())) !== cell.qnum;
            }, "nmShadeDiagNe");
        },

        checkUnshadeCountAdj: function() {
            this.checkAllCell(function(cell) {
                return cell.qnum >= 0 && !cell.isShade() && ((cell.relobj(-2,0).isShade()) + (cell.relobj(2,0).isShade()) + (cell.relobj(0,-2).isShade()) + (cell.relobj(0,2).isShade())) !== cell.qnum
            }, "nmUnshadeAdjNe");
        }

	}
});
