const FACTORY = require("../index.js");
const FS = require("fs");

async function parse(info, ovars) {
	let result = "PUT:";

	switch(info.groups.type) {
		case "id":
			var DATA = await FACTORY.onDBRequest({
				id: info.groups.type_value
			});

			var TPL = await template(info, DATA, ovars);
			result += !TPL ? "<pre>" + JSON.stringify(DATA, null, "\t") + "</pre>" : TPL;
			
			break;

		case "req":
			var DATA = await FACTORY.onDBRequest({
				req: info.groups.type_value
			});

			var TPL = await template(info, DATA, ovars);
			result += !TPL ? "<pre>" + JSON.stringify(DATA, null, "\t") + "</pre>" : TPL;
			
			break;

		case "file":
			var REQ = FS.readFileSync(info.groups.type_value).toString();

			var DATA = await FACTORY.onDBRequest({
				req: REQ
			});

			var TPL = await template(info, DATA, ovars);
			result += !TPL ? "<pre>" + JSON.stringify(DATA, null, "\t") + "</pre>" : TPL;
			
			break;
	}

	return {
		result,
		id: "main",
		ivars: {}
	};
}

async function template(info, data, ovars) {
	let result;

	if(info.groups.tpl != ";" && !Array.isArray(data))
		result = "<b style=\"[EAT-01]\">Result of " + info.groups.type_value + " should be an array.</b>";

	if(info.groups.tpl == ";") return;

	result = ""
	info.groups.tpl_type = info.groups.tpl_type.replace(/\(.*?\)/gs, "");
	for (let i = 0; i < data.length; i++) {

		if(info.groups.tpl_type == "file") {
			const FILE = info.groups.tpl_value.replace(/^'/, "").replace(/';$/, "");

			result += await FACTORY.parseFile(FILE, {
				...ovars,
				...data[i]
			});
		} else if(info.groups.tpl_type == "block") {
			const CONTENT = info.groups.tpl_value.replace(/^\{/gs, "").replace(/\}$/gs, "");

			result += await FACTORY.parse(CONTENT, {
				...ovars,
				...data[i]
			});
		}
	}


	return result;
}

module.exports.parse = parse;