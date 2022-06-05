const APP_ROOT = require("app-root-path") + "/";
const FS = require("fs");

async function parseFile(file, vars) {
	return await parse(FS.readFileSync(PATH.normalize(APP_ROOT + file)).toString(), vars);
}

async function parse(content, vars) {
	content = await replaceAsync(content, /<<(.*?)>>\s*(?=<<|$)/sg, async (full, inside) => {
		const FORM = await format(inside, vars);
		return (await parseCommands(FORM[1], FORM[0], vars)).join("");
	});

	content = await replaceAsync(content, /{{\s*ovar\s*:\s*(\w+?)\s*}}/g, (full, arg) => {
		return !vars[arg] ? "" : vars[arg]
	});
	return content;
}

const COMMAND_REGEX = /^(?<type>[A-Z]+):(?<content>.*)/s;

const PARSE_TYPE = async (command, files, vars) => {
	const ARR = COMMAND_REGEX.exec(command);

	if(ARR.groups.type == "FILE") {
		const PARSED = parseInt(ARR.groups.content);
		if(isNaN(PARSED)) return await parseFile(ARR.groups.content, vars);

		const FILE = files[PARSED];
		const VARS = {
			...vars,
			...await parseFileCommands(FILE.ivars, files, vars)
		};
		return await parseFile(FILE.file, VARS);
	}
	else if(ARR.groups.type == "PUT") return await parse(ARR.groups.content, vars);

	return command;
}

async function parseCommands(commands, files, vars) {
	for (let i = 0; i < commands.length; i++) {
		if(!commands[i]) {
			commands[i] = "";
			continue;
		}
		if(commands[i].constructor === Array) {
			commands[i] = await parseCommands(commands[i], files, vars);
			continue;
		}
		commands[i] = await PARSE_TYPE(commands[i], files, vars);
	}

	return commands;
}

async function parseFileCommands(commands, files, vars) {
	for(k in commands) {
		if(!commands[k]) {
			commands[k] = "";
			continue;
		}
		commands[k] = await PARSE_TYPE(commands[k], files, vars);
	}

	return commands;
}

async function format(code, vars, files={}) {
	const TMP_COMMANDS = [];
	let FILES = files;
	const TMP_INDEXES = [];
	const TO_PASS = [];

	code = await replaceAsync(code, /<(#|-).*?-?#>/gs, () => { return "" });

	const RULES = [
		[/IF\s*\((?<condition>.*?)\)\s*:\s*\{(?<code1>.*?)\}!(\s*ELSE\s*\{(?<code2>.*?)\}!)?/gs, "condition"],
		[/((\$(?<id>[0-9]+))\s*=\s*)?INSERT\s+(?<type>ovar|file|block)(\(.*?\))?\s*:\s*(?<value>.+?)\s*;/gs, "insert"],
		[/SET\s+(\$(?<id>[0-9]+)::)?(?<inside_var>.*)\s+BY\s+block(\(.*?\))?:\{(?<content>.*)\}/gs, "reb"],
		[/SET\s+(\$(?<id>[0-9]+)::)?(?<inside_var>.*)\s+BY\s+file:\'(?<file>.*?)\'\s*;/g, "ref"],
		[/SET\s+(\$(?<id>[0-9]+)::)?(?<inside_var>.*)\s+BY\s+ovar:(?<ovar>.*?)\s*;/g, "reo"],
		[/EXECUTE\s*\(\s*(?<type>req|file|id):'(?<type_value>.*?)'\)\s*(?<tpl>\s+WITH\s+(?<tpl_type>file|block(\(.*?\))?):(?<tpl_value>'(.*?)';|\{.*\})|;)/gs, "execute"],
	];

	for (let i = 0; i < RULES.length; i++) {
		let array;
		while((array = RULES[i][0].exec(code)) !== null) {
	    	if(isDuplication(TO_PASS, array.index)) continue;

	    	const INDEX = setIndex(array.index, TMP_INDEXES);
	    	TO_PASS.push({
	    		index: array.index,
	    		size: array[0].length
	    	});

	    	TMP_INDEXES.insert(INDEX, array.index);

	    	const PARSED = await require("./syntax/" + RULES[i][1] + ".js").parse(array, vars, FILES);
	    	if (!FILES[PARSED.id]) FILES[PARSED.id] = {
	    		file: undefined,
	    		ivars: {}
	    	};
	    	if(PARSED.merge) FILES = JSON.merge(FILES, PARSED.merge);
	    	if(PARSED.to) FILES[PARSED.to].ivars[PARSED.key] = PARSED.value;
	    	if(PARSED.file) FILES[PARSED.id].file = PARSED.file;
	    	if(PARSED.ivars.length !== 0) FILES[PARSED.id].ivars = JSON.merge(FILES[PARSED.id].ivars, PARSED.ivars);

	    	TMP_COMMANDS.insert(INDEX, PARSED.result);
		}
	}

	return [FILES, TMP_COMMANDS];
}

function isDuplication(array, index) {
	for (let i = 0; i < array.length; i++) {
		if(index >= array[i].index && index <= array[i].index + array[i].size) return true;
	}
	return false;
}

function setIndex(index, indexes) {
	let i = 0;
	while(i != indexes.length) {
		if(indexes[i + 1]) {
			if(indexes[i] <= index) return i + 1;
			else return i;
		} else if(indexes[i] <= index && indexes[i + 1] >= index) return i + 1;
		i++;
	}
	return i;
}

async function replaceAsync(str, regex, async_callback) {
    const PROMISES = [];
    str.replace(regex, (match, ...args) => {
        const PROMISE = async_callback(match, ...args);
        PROMISES.push(PROMISE);
    });

    const DATA = await Promise.all(PROMISES);
    return str.replace(regex, () => DATA.shift());
}

module.exports.onDBRequest = async () => {};
module.exports.parse = parse;
module.exports.parseFile = parseFile;
module.exports.format = format;
module.exports.APP_ROOT = APP_ROOT;