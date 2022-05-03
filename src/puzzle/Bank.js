pzpr.classmgr.makeCommon({
	Bank: {
		enabled: false,

		// Valid values are: null | "auxeditor:*"
		editmode: null,

		// Valid values are: boolean | function(): boolean
		allowAdd: false,

		// One entry contains one of these:
		// {
		//   title: string
		//   shortkey: string
		//   constant: [string]
		// } | {
		//   title: string
		//   allowsInput: boolean
		//   func: string
		// }
		presets: [],

		// The current list of BankPiece objects.
		pieces: null,

		defaultPreset: function() {
			return [];
		},

		initialize: function(pieces) {
			this.pieces = [];
			if (!pieces) {
				return;
			}

			for (var p in pieces) {
				this.pieces.push(this.deserialize(pieces[p]));
			}

			this.performLayout();
		},

		deserialize: function(str) {
			return new this.klass.BankPiece();
		},

		width: 1,
		height: 1,

		performLayout: function() {
			if (!this.pieces || !this.width) {
				return;
			}

			var x = 0,
				y = 0,
				nexty = 1;

			for (var i = 0; i < this.pieces.length; i++) {
				var p = this.pieces[i];
				if (x + p.w + 1 > this.width) {
					x = 0;
					y = nexty;
				}

				p.x = x;
				p.y = y;
				nexty = Math.max(nexty, y + p.h + 1);
				p.index = i;
				x += p.w + 1;
			}

			this.height = nexty - 0.5;
		},

		draw: function() {
			this.puzzle.painter.range.bank = true;
			this.puzzle.painter.prepaint();
		},

		errclear: function() {
			for (var i = 0; i < this.pieces.length; i++) {
				this.pieces[i].seterr(0);
			}
		},

		ansclear: function() {
			this.subclear();
		},

		subclear: function() {
			for (var i = 0; i < this.pieces.length; i++) {
				this.pieces[i].setQcmp(0);
			}
		}
	},

	BankPiece: {
		count: 1,

		// For editor purposes. The amount that the count can vary between.
		mincount: 1,
		maxcount: 1,

		canonize: function() {
			return this.serialize();
		},

		serialize: function() {
			return "";
		},

		width: 1,
		height: 1,

		index: 0,
		x: 0,
		y: 0,

		error: 0,
		qcmp: 0,

		seterr: function(num) {
			if (this.board.isenableSetError()) {
				this.error = num;
			}
		},

		setQcmp: function(num) {
			this.addOpe("qcmp", num);
		},

		draw: function() {
			this.puzzle.painter.range.bankPieces.push(this);
			this.puzzle.painter.prepaint();
		},

		addOpe: function(property, num) {
			var ope = new this.klass.BankPieceOperation(
				this.index,
				property,
				this[property],
				num
			);
			if (!ope.isNoop()) {
				ope.redo();
				this.puzzle.opemgr.add(ope);
			}
		}
	},

	"BankPieceOperation:Operation": {
		index: 0,
		num: 0,
		old: 0,
		property: "",

		STRPROP: {
			K: "qcmp"
		},

		isNoop: function() {
			return this.num === this.old;
		},

		setData: function(index, property, old, num) {
			this.index = index;
			this.property = property;
			this.old = old;
			this.num = num;
		},

		exec: function(num) {
			var piece = this.board.bank.pieces[this.index];
			piece[this.property] = num;
			piece.draw();
		},

		toString: function() {
			var prefix = "P";
			for (var i in this.STRPROP) {
				if (this.property === this.STRPROP[i]) {
					prefix += i;
					break;
				}
			}

			return [prefix, this.index, this.num, this.old].join(",");
		},

		decode: function(strs) {
			this.property = this.STRPROP[strs[0].charAt(1)];
			if (!this.property || strs[0].charAt(0) !== "P") {
				return false;
			}

			this.index = +strs[1];
			this.num = +strs[2];
			this.old = +strs[3];

			return true;
		}
	}
});
