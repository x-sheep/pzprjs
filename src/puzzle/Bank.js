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
		},

		deserialize: function(str) {
			return new this.klass.BankPiece();
		}
	},

	BankPiece: {
		count: 1,

		// For editing purposes. The amount that the count can vary between when editing.
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

		seterr: function(num) {
			if (this.board.isenableSetError()) {
				// TODO implement
			}
		}
	}
});
