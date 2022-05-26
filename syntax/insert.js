const FACTORY = require("../index.js");
const FS = require("fs");
const PATH = require("path");

async function parse(info, ovars) {
	let result;
	let id = !info.groups.id ? "main" : info.groups.id;
	let ivars = {};
	let file;

	switch (info.groups.type) {
		case "ovar":
			if(id != "main") {
				result = "PUT:<b style=\"color: red;\">[IV-1] Cannot insert ovar into identifier '$" + id + "'!</b>";
				break;
			}
			result = "PUT:" + ovars[info.groups.value];
			break;

		case "block":
			info.groups.value = info.groups.value.replace(/^\{/g, "");
			info.groups.value = info.groups.value.replace(/\}$/g, "");
			result = "PUT:" + info.groups.value;
			break;

		case "file":
			file = info.groups.value.replace(/^'/g, "");
			file = file.replace(/'$/g, "");

			if(id == "main") result = "PUT:" + await FACTORY.parseFile(file, ovars);
			else result = "FILE:" + id;
			
			break;
	};

	return {
		file,
		result,
		id,
		ivars
	};
} 

module.exports.parse = parse;