pzpr.classmgr.makeCommon({
	Bank: {
		enabled: false,

		// Valid values are: null | "auxeditor:*"
		editmode: null,

		// Valid values are: boolean | function(): boolean
		allowAdd: false,

		// One entry object contains the following:
		// {
		//   title: string
		//   allowsInput: boolean
		//   func: string
		// }
		presets: [],

		pieces: [],

		canonize: function(piece) {
			return this.serialize(piece);
		},

		serialize: function(piece) {
			return "";
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

		width: 1,
		height: 1
	}
});
