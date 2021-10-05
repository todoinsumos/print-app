/* eslint-disable quotes */
module.exports = {
	'apps': [ {
		name: "print",
		script: "./build/index.js",
		watch: [ "build" ],
		env: {
			"PORT": 3009,
			"NODE_ENV": "production",
		},
		env_production: {
			"PORT": 3009,
			"NODE_ENV": "production",
		},
	} ],

};
