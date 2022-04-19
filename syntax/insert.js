
function parse(info, ovars) {
	var result = undefined;
	var id = info.groups.id == undefined ? "main" : info.groups.id;
	var ivars = {};
	var file = undefined;

	switch (info.groups.type) {
		case "ovar":
			if(id != "main") {
				result = "PUT:<b style=\"color: red;\">[IV-1] Cannot insert ovar into identifier '$" + id + "'!</b>";
				break;
			}
			result = "PUT:" + ovars[info.groups.value];
			break;

		case "file":
			file = info.groups.value.replace(/^'/g, "");
			file = file.replace(/'$/g, "");
			result = "FILE:" + id;
			break;
	};

	return {
		file,
		result,
		id,
		ivars
	};
} 

module.exports.parse = parse