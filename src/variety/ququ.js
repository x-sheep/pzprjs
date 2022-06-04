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
		numberRemainsUnshaded: true,

		getDir: function() {
			var bx = this.bx,
				by = this.by;
			if (bx % 3 === 1) {
				if (by % 3 === 0) {
					return this.UP;
				} else if (by % 3 === 2) {
					return this.DN;
				}
			} else if (by % 3 === 1) {
				if (bx % 3 === 0) {
					return this.LT;
				} else if (bx % 3 === 2) {
					return this.RT;
				}
			}
			return this.NDIR;
		}
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
				var bx = (idx % this.cols) * 3;
				var by = ((idx / this.cols) | 0) * 3;

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

	BoardExec: {
		execadjust: function(name) {
			if (!this.isBoardOp(name)) {
				return;
			}

			var puzzle = this.puzzle,
				bd = this.board;
			if (name.indexOf("reduce") === 0) {
				if (name === "reduceup" || name === "reducedn") {
					if (bd.rows <= 1) {
						return;
					}
				} else if (name === "reducelt" || name === "reducert") {
					if (bd.cols <= 1) {
						return;
					}
				}
			}

			puzzle.opemgr.newOperation();

			puzzle.painter.suspendAll();

			// undo/redo時はexecadjust_mainを直接呼びます
			var d = { x1: 0, y1: 0, x2: 3 * bd.cols, y2: 3 * bd.rows }; // TURNFLIPには範囲が必要
			this.execadjust_main(this.boardtype[name][1], d);
			this.addOpe(d, name);

			bd.setminmax();
			bd.rebuildInfo();

			// Canvasを更新する
			puzzle.painter.resizeCanvas();
			puzzle.emit("adjust");
			puzzle.painter.unsuspend();
		},

		insex: {
			cell: { 1: true, 2: true, 3: true }
		},

		distObj: function(key, piece) {
			var bd = this.board;
			if (piece.isnull) {
				return -1;
			}

			key &= 0x0f;
			if (key === this.UP) {
				return piece.by + 1;
			} else if (key === this.DN) {
				return 3 * bd.rows - piece.by;
			} else if (key === this.LT) {
				return piece.bx + 1;
			} else if (key === this.RT) {
				return 3 * bd.cols - piece.bx;
			}
			return -1;
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",
		shadecolor: "#444444",
		paint: function() {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();
			this.drawSlashGrid();

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
		},

		drawSlashGrid: function() {
			var g = this.vinc("slash", "crispEdges", true),
				bd = this.board;

			var x1 = Math.max(bd.minbx, this.range.x1),
				y1 = Math.max(bd.minby, this.range.y1),
				x2 = Math.min(bd.maxbx, this.range.x2),
				y2 = Math.min(bd.maxby, this.range.y2);
			if (x1 > x2 || y1 > y2) {
				return;
			}

			var bw = this.bw,
				bh = this.bh;
			var xa = (x1 / 3) | 0,
				xb = (x2 / 3) | 0;
			var ya = (y1 / 3) | 0,
				yb = (y2 / 3) | 0;

			g.lineWidth = this.gw;
			g.strokeStyle = this.gridcolor;
			for (var x = xa; x <= xb; x++) {
				for (var y = ya; y <= yb; y++) {
					var px1 = x * bw * 2,
						px2 = bw * 2 + px1,
						py1 = y * bh * 2,
						py2 = bh * 2 + py1;
					g.vid = "bdsa_" + x + "_" + y;
					g.strokeLine(px1, py1, px2, py2);
					g.vid = "bdsb_" + x + "_" + y;
					g.strokeLine(px1, py2, px2, py1);
				}
			}
		},

		drawCells_common: function(header, colorfunc) {
			var g = this.context;
			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i],
					color = colorfunc.call(this, cell);
				g.vid = header + cell.id;
				if (!!color) {
					g.fillStyle = color;

					var px = ((cell.bx / 3) | 0) * this.bw * 2;
					var py = ((cell.by / 3) | 0) * this.bh * 2;
					var idx = [0, 0, 0, 0];

					switch (cell.getDir()) {
						case cell.DN:
							idx = [1, 1, -1, 1];
							break;
						case cell.UP:
							idx = [1, -1, -1, -1];
							break;
						case cell.RT:
							idx = [1, -1, 1, 1];
							break;
						case cell.LT:
							idx = [-1, -1, -1, 1];
							break;
					}

					g.setOffsetLinePath(
						px + this.bw,
						py + this.bh,
						0,
						0,
						idx[0] * this.bw,
						idx[1] * this.bh,
						idx[2] * this.bw,
						idx[3] * this.bh,
						true
					);
					g.fill();
				} else {
					g.vhide();
				}
			}
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
