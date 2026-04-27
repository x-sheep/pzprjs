/* yokeimoji.js */
ui.debug.addDebugData("yokeimoji", {
	url: "4/4/-62-62..-1cd-23-62-1c-23-1c-62d-1cd./",
	failcheck: [
		[
			"brNoShade",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/. . . . /. . . . /. . . . /. . . . /"
		],
		[
			"csAdjacent",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/# . . # /. . # . /. . . . /. # # . /"
		],
		[
			"cuDivideRB",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/. . . # /. . # . /. # . . /# . . . /"
		],
		[
			"cuBadStart",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/. . . # /. . . . /. . . . /# . . # /"
		],
		[
			"cuBadStart",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/# . . # /. . # . /. . . . /. . # . /"
		],
		[
			"cuBadSequence",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/. . . # /. . # . /. . . . /# . . . /"
		],
		[
			"bankGt",
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/. . . # /# . # . /. . . . /# . # . /"
		],
		[
			null,
			"pzprv3/yokeimoji/4/4/リリーー/インカリ/イカイリ/ンインー/# + + # /+ + # + /+ + + + /# + # + /"
		]
	],
	inputs: [
		{
			input: ["newboard,3,3", "editmode", "key,a,n,o,-"],
			result: "pzprv3/yokeimoji/3/3/アノー/.../.../. . . /. . . /. . . /"
		},
		{
			input: ["mouse,leftx2,3,3", "key,n,n,2"],
			result: "pzprv3/yokeimoji/3/3/アノー/.ン./.ン./. . . /. . . /. . . /"
		},
		{
			input: ["key,enter,x,u"],
			result: "pzprv3/yokeimoji/3/3/アノー/.ン./.ウ./. . . /. . . /. . . /"
		},
		{
			input: ["key,BS,BS,i"],
			result: "pzprv3/yokeimoji/3/3/アノー/.ン./イ../. . . /. . . /. . . /"
		},
		{
			input: ["key,up, "],
			result: "pzprv3/yokeimoji/3/3/アノー/.../イ../. . . /. . . /. . . /"
		},
		{
			input: ["key,y,e"],
			result: "pzprv3/yokeimoji/3/3/アノー/.エ./イ../. . . /. . . /. . . /"
		}
	]
});
