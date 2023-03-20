/* martini.js */

ui.debug.addDebugData("martini", {
	url: "6/6/hll441s1j41u0g2h.h0i300g0.h.j0h3g1k",
	failcheck: [
		[
			"circleShade",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /. . # . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /"
		],
		[
			"circleUnshade",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /"
		],
		[
			"cbShade",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /. . . . . . /# # # . . . /. # # . . . /. . . . . . /. . . . . . /. . . . . . /"
		],
		[
			"bkShadeDivide",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /# . . . . . /. # # . . . /. # # . # . /. . . # . . /. # . . . . /. . . . . . /"
		],
		[
			"bkSizeLt",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /# . . # . . /. # # . . . /. # # . # . /. . . . . . /. # . . . . /. . . . . . /"
		],
		[
			"bkSizeGt",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /# . . . . . /. # # . . . /. # # . # . /. . . # # # /# # . . . # /. . # # # . /"
		],
		[
			"csDivide",
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /# . . . . . /. # # . . # /. # # . # . /. . . # # # /# # . . . . /. . # # # . /"
		],
		[
			null,
			"pzprv3/martini/6/6/7/0 1 1 1 1 2 /3 4 4 1 1 2 /3 4 4 5 5 2 /3 3 3 5 5 5 /3 3 3 5 5 5 /6 6 6 6 6 5 /0 . 2 . . - /. . 0 . . . /3 0 0 . 0 - /. . - . . . /. 0 . . 3 . /1 . . . . . /# + + + + + /+ # # + + # /+ # # + # + /+ + + # # # /# # + + + # /+ + # # # + /"
		]
	],
	inputs: [
		{
			input: [
				"newboard,3,2",
				"editmode,circle-shade",
				"mouse,left,1,1",
				"editmode,circle-unshade",
				"mouse,left,3,1"
			],
			result: "pzprv3/martini/2/3/1/0 0 0 /0 0 0 /0 - . /. . . /. . . /. . . /"
		},
		{
			input: ["editmode,auto", "cursor,5,1", "key,2"],
			result: "pzprv3/martini/2/3/1/0 0 0 /0 0 0 /0 - 2 /. . . /. . . /. . . /"
		},
		{
			input: ["playmode", "mouse,left,1,1,5,1,5,3"],
			result: "pzprv3/martini/2/3/1/0 0 0 /0 0 0 /0 - 2 /. . . /# . . /. . # /"
		},
		{
			input: ["mouse,right,1,1,5,1,5,3"],
			result: "pzprv3/martini/2/3/1/0 0 0 /0 0 0 /0 - 2 /. . . /# + + /. . + /"
		},
		{
			input: [
				"newboard,3,3",
				"playmode",
				"mouse,left,1,1,3,1",
				"mouse,left,5,3",
				"mouse,left,1,5",
				"playmode,info-blk",
				"mouse,left,5,3"
			],
			result: function(puzzle, assert) {
				var bd = puzzle.board;
				assert.equal(bd.getc(5, 3).qinfo, 1);
				assert.equal(bd.getc(1, 5).qinfo, 0);
			}
		}
	]
});
