/* edamame.js */

ui.debug.addDebugData("edamame", {
	url: "3/3/h0bi",
	failcheck: [
		[
			null,
			"pzprv3/edamame/3/3/. . 0 /1 . . /. . . /0 0 0 /0 0 0 /3 1 3 /0 0 /0 0 /1 1 /0 0 0 /0 0 0 /"
		]
	],
	inputs: [
		{
			input: [
				"newboard,3,2",
				"playmode",
				"mouse,left,1,1",
				"mouse,right,3,1",
				"mouse,alt+left,3,1",
				"mouse,alt+right,5,1"
			],
			result:
				"pzprv3/edamame/2/3/. . . /. . . /1 20 32 /0 0 0 /0 0 /0 0 /0 0 0 /"
		},
		{
			input: ["mouse,left,1,3,3,3", "mouse,left,1,3", "mouse,leftx2,3,3"],
			result:
				"pzprv3/edamame/2/3/. . . /. . . /1 20 32 /1 3 0 /0 0 /1 0 /0 0 0 /"
		},
		{
			input: [
				"playmode,bgcolor1",
				"mouse,left,5,3",
				"playmode,bgcolor2",
				"mouse,left,3,3",
				"playmode,mark-circle",
				"mouse,left,5,1",
				"playmode,subcross",
				"mouse,left,5,3"
			],
			result:
				"pzprv3/edamame/2/3/. . . /. . . /1 20 33 /1 35 20 /0 0 /1 0 /0 0 0 /"
		}
	]
});
