const FACTORY = require("../index.js");

async function parse(info, ovars) {
	var result;
	var to = !info.groups.id ? "main" : info.groups.id;
	var id = "main";
	var file;
	var ivars = {};
	var key = info.groups.inside_var;

	var value = "PUT:" + await FACTORY.parse(info.groups.content, ovars);

	return {
		file,
		result,
		to,
		id,
		key,
		value,
		ivars
	};
} 

module.exports.parse = parse