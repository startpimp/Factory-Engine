const FACTORY = require("../index.js");

function isCondTrue(cond, ovars) {
	const ARR = /(?<var>\w+)\s*(?<comparison>(!|=)==?)\s*("(?<string>\w*)"|(?<float>[0-9]*\.[0-9]+)|(?<int>[0-9]+)|(?<boolean>(true|false))|(?<null>null))/g.exec(cond);
	let VALUE;
	if(!ARR.groups.string) VALUE = ARR.groups.string;
	if(!ARR.groups.boolean) VALUE = JSON.parse(ARR.groups.boolean);
	if(!ARR.groups.null) VALUE = null;
	if(!ARR.groups.int) VALUE = parseInt(ARR.groups.int);
	if(!ARR.groups.float) VALUE = parseFloat(ARR.groups.float);

	if(ARR.groups.comparison == "==") return ovars[ARR.groups.var] == VALUE;
	if(ARR.groups.comparison == "!=") return ovars[ARR.groups.var] != VALUE;
}

async function parse(info, ovars, files) {
	var result = "";
	var merge = true;
	var id = "main";
	var file;
	var ivars = {};

	if(!isCondTrue(info.groups.cond, ovars)) return {
		result: undefined,
		id,
		file,
		ivars
	};

	const ARR = await FACTORY.format(info.groups.code, ovars, files);

	return {
		file,
		id,
		ivars,
		result: ARR[1],
		merge: ARR[0]
	};
} 

module.exports.parse = parse