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

			for (var i = 0; i < this.pieces.length; i++) {
				// TODO implement
				var p = this.pieces[i];
				p.x = i === 0 ? 0 : this.pieces[i - 1].x + this.pieces[i - 1].w + 1;
				p.y = 0;
			}
		},

		draw: function() {
			this.puzzle.painter.range.bank = true;
			this.puzzle.painter.prepaint();
		},

		errclear: function() {
			for (var i = 0; i < this.pieces.length; i++) {
				this.pieces[i].seterr(0);
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

		x: 0,
		y: 0,

		error: 0,
		qcmp: 0,

		seterr: function(num) {
			if (this.board.isenableSetError() && this.error !== num) {
				this.error = num;
				this.draw();
			}
		},

		draw: function() {
			this.puzzle.painter.range.bankPieces.push(this);
			this.puzzle.painter.prepaint();
		}
	}
});
