(function(pidlist, classbase) {
	if (typeof module === "object" && module.exports) {
		module.exports = [pidlist, classbase];
	} else {
		pzpr.classmgr.makeCustom(pidlist, classbase);
	}
})(["ququ"], {
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: {
			edit: [],
			play: ["shade", "unshade", "info-blk"]
		},
		mouseinput_auto: function() {
			// if (this.puzzle.playmode) {
			if (this.mousestart || this.mousemove) {
				this.inputcell();
			}
			// }
		},

		getpos: function(rc) {
			var bx = ((this.inputPoint.bx / 2) | 0) * 3,
				by = ((this.inputPoint.by / 2) | 0) * 3;

			var dx = (this.inputPoint.bx % 2) - 1,
				dy = (this.inputPoint.by % 2) - 1;

			if (Math.abs(dx) > Math.abs(dy)) {
				by++;
				if (dx > 0) {
					bx += 2;
				}
			} else {
				bx++;
				if (dy > 0) {
					by += 2;
				}
			}

			return new this.klass.Address(bx, by);
		}
	},

	// AreaShadeGraph: {
	// 	enabled: true
	// },
	// AreaUnshadeGraph: {
	// 	enabled: true
	// },

	Cell: {
		numberRemainsUnshaded: true
	},

	Board: {
		cols: 4,
		rows: 4,
		hascross: 0,

		estimateSize: function(type, col, row) {
			if (type === "cell") {
				return col * row * 4;
			}
			return 0;
		},

		setposCells: function() {
			for (var id = 0; id < this.cell.length; id++) {
				var cell = this.cell[id];
				cell.id = id;
				cell.isnull = false;

				var idx = (id / 4) | 0;
				var pos = id % 4;
				var bx = (idx / this.cols) | 0;
				var by = idx % this.cols;

				bx += [1, 0, 2, 1][pos];
				by += [0, 1, 1, 2][pos];

				cell.bx = bx;
				cell.by = by;
			}
		},

		getobj: function(bx, by) {
			return this.getc(bx, by);
		},

		getc: function(bx, by) {
			var id = null,
				qc = this.cols;
			if (
				bx >= this.minbx &&
				bx <= this.maxbx &&
				by >= this.minby &&
				by <= this.maxby
			) {
				var idx = ((by / 3) | 0) * qc + ((bx / 3) | 0);
				if (bx % 3 === 1) {
					if (by % 3 === 0) {
						// Up
						id = idx * 4;
					} else if (by % 3 === 2) {
						// Down
						id = idx * 4 + 3;
					}
				} else if (by % 3 === 1) {
					if (bx % 3 === 0) {
						// Left
						id = idx * 4 + 1;
					} else if (bx % 3 === 2) {
						// Right
						id = idx * 4 + 2;
					}
				}
			}

			return id !== null ? this.cell[id] : this.emptycell;
		},

		cellinside: function(x1, y1, x2, y2) {
			var clist = new this.klass.CellList();
			for (var by = y1; by <= y2; by++) {
				for (var bx = x1; bx <= x2; bx++) {
					var cell = this.getc(bx, by);
					if (!cell.isnull) {
						clist.add(cell);
					}
				}
			}
			return clist;
		},

		setminmax: function() {
			this.minbx = 0;
			this.minby = 0;
			this.maxbx = 3 * this.cols - 1;
			this.maxby = 3 * this.rows - 1;

			this.puzzle.cursor.setminmax();
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",
		paint: function() {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesNumbers();

			this.drawChassis();
		},

		getBoardCols: function() {
			var bd = this.board;
			return (bd.maxbx - bd.minbx + 1) / 3;
		},
		getBoardRows: function() {
			var bd = this.board;
			return (bd.maxby - bd.minby + 1) / 3;
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
		decodeData: function() {},
		encodeData: function() {}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: []
	}
});
