var variables = new Map();
var usedmemory = [];
var position = 0;
var result = '';
var scopes = [];

var preprocessor = [
    // Trim each line
    text => {
        let result = text.split('\n')
        for (let i = 0; i < result.length; i++) {
            result[i] = result[i].trim();
        }
        return result.join('\n');
    },

    // Remove comments
    text => {
        let textsplit = text.split('\n')
        let result = '';
        for (let i = 0; i < textsplit.length; i++) {
            if (!textsplit[i].startsWith('//')) {
                result += textsplit[i] + '\n';
            }
        }
        return result;
    },

    // Remove empty lines
    text => text.split('\n').filter(n => n).join('\n'),
];

var postprocessor = [
    // \n every 50 characters
    text => {
        let postprocessed = '';

        for (let i = 0; i < text.length; i++) {
            postprocessed += text[i];
            if ((i + 1) % 50 == 0) {
                postprocessed += '\n';
            }
        }

        return postprocessed;
    },
]

class Scope {
    constructor(type, variable) {
        this.type = type;
        this.variables = [];
        this.variable = variable;
    }
}

var testArgs = (name, args, len) => {
    if (args.length != len) {
        $('#output').val(`Error: ${name} accepts ${len} arguments but ${args.length} were given.`)
        throw new Error("Code error");
    }
};
var testMoreArgs = (name, args, len) => {
    if (args.length < len) {
        $('#output').val(`Error: ${name} accepts ${len} or more arguments but ${args.length} were given.`)
        throw new Error("Code error");
    }
};

var varExists = varname => {
    if (!variables.has(varname)) {
        $('#output').val(`Error: Variable ${varname} does not exist.`)
        throw new Error("Code error");
    }
};

var bestMultiplication = n => {
    n = parseInt(n);

    let facs = [];
    let currentbest = [0, 0];
    let bestsum = 9999;
    for (let i = -5; i < 6; i++) {
        for (let j = 1; j < n + i + 1; j++) {
            if ((n + i) % j == 0) {
                facs.push([j, parseInt((n + i) / j)]);
                if (j + (n + i) / j + Math.abs(i) < bestsum) {
                    bestsum = j + (n + 1) / j + Math.abs(i);
                    currentbest = [j, parseInt((n + i) / j)];
                }
            }
        }
    }

    return currentbest
}

var move = varname => {
	let dif = variables.get(varname) - position;

	for (let i = 0; i < Math.abs(dif); i++) {
		if (dif < 0) {
			result += '<';
        }
		else if (dif > 0) {
			result += '>';
        }
    }
    position += dif;
}

var functions = {
    createVariable(args) {
        testArgs('var', args, 1)
        if (!variables.has(args[0])) {
            nextSpace = 0;
            for (let i = 0; true; i++) {
                if (!usedmemory.includes(i)) {
                    nextSpace = i;
                    break;
                }
            }
            variables.set(args[0], nextSpace);
            usedmemory.push(nextSpace);
            scopes[scopes.length - 1].variables.push(nextSpace);
        }
    },
    add(args) {
        let num = parseInt(args[1]);

        testArgs('add', args, 2);
        varExists(args[0]);
        let fac = bestMultiplication(Math.abs(num));
        if (fac[0] + fac[1] + 5 > Math.abs(num)) {
            move(args[0]);
            for (let i = 0; i < Math.abs(num); i++) {
                if (num > 0) {
                    result += '+';
                }
                if (num < 0) {
                    result += '-';
                }
            }
        }
        else {
            move('temp');
            for (let i = 0; i < parseInt(fac[0]); i++) {
                result += '+';
            }
            result += '[';
            move(args[0]);
            for (let i = 0; i < parseInt(fac[1]); i++) {
                if (num > 0) {
                    result += '+';
                }
                if (num < 0) {
                    result += '-';
                }
            }
            move('temp');
            result += '-]';
            let mo = 1
            if (num < 0) {
                mo *= -1
            }
            move(args[0]);
            let dif = num - parseInt(fac[0]) * parseInt(fac[1] * mo)
            for (let i = 0; i < Math.abs(parseInt(dif)); i++) {
                if (parseInt(dif) > 0) {
                    result += '+';
                }
                if (parseInt(dif) < 0) {
                    result += '-';
                }
            }
        }
    },
    clear(args) {
        testArgs('clear', args, 1);
        varExists(args[0]);
        move(args[0]);
        result += '[-]';
    },
    set(args) {
        testArgs('set', args, 2);
        varExists(args[0]);
        functions.clear([args[0]]);
        functions.add([args[0], args[1]]);
    },
    move(args) {
        testArgs('move', args, 2);
        varExists(args[0]);
        varExists(args[1]);
        move(args[0]);
        result += '[-';
        move(args[1]);
        result += '+';
        move(args[0]);
        result += ']'
    },
    copy(args) {
        testMoreArgs('copy', args, 2);

        let copyTo = args.slice(1);
        let copies = copyTo.length;

        for (let i = 0; i < copies; i++) {
            varExists(copyTo[i]);
        }
        functions.move([args[0], 'temp']);
        move('temp');
        result += '[-';
        for (let i = 0; i < args.length; i++) {
            move(args[i]);
            result += '+';
        }
        move('temp');
        result += ']';
    },
    multiply(args) {
        testArgs('multiply', args, 2);
        varExists(args[0]);
        functions.move([args[0], 'temp']);
        move('temp');
        result += '[-';
        move(args[0]);
        result += '+'.repeat(parseInt(args[1]));
        move('temp');
        result += ']';
    },
    pause(args) {
        testArgs('pause', args, 0);
        move('temp');
        result += '[]-[]';
    },
    while(args) {
        testArgs('#while', args, 1);
        varExists(args[0]);
        move(args[0]);
        result += '[';
        scopes.push(new Scope('while', args[0]));
    },
    end(args) {
        testArgs('end', args, 0);
        let popped = scopes.pop();
        
        // variables[args[0]] = nextSpace;
        for (let k of variables.keys()) {
            if (popped.variables.includes(variables.get(k))) {
                variables.delete(k);
            }
        }
        // usedmemory.push(nextSpace);
        usedmemory = usedmemory.filter(e => !popped.variables.includes(e));

        if (popped.type == 'while') {
            move(popped.variable);
            result += ']';
        }
    },
    scope(args) {
        testArgs('#scope', args, 0);
        scopes.push(new Scope('scope'));
    },
    input(args) {
        testArgs('input', args, 1);
        varExists(args[0]);
        move(args[0]);
        result += ',';
    },
    print(args) {
        testArgs('print', args, 1);
        varExists(args[0]);
        move(args[0]);
        result += '.';
    },
    printletter(args) {
        testArgs('printletter', args, 1);
        functions.set(['temp2', args[0].charCodeAt(0)]);
        move('temp2');
        result += '.';
        functions.clear(['temp2']);
    },
    if(args) {
        testArgs('#if', args, 3);
        varExists(args[0]);
        functions.createVariable(['temp3']);
    
        if (args[1] == 'var') {
            varExists(args[2]);

            // functions.copy([args[0], 'temp']);
            // functions.copy([args[2], 'temp3']);
            functions.move([args[0], 'temp2'])
            functions.while(['temp2']);
            functions.add([args[0], 1]);
            functions.add(['temp', 1]);
            functions.add(['temp2', -1]);
            functions.end([]);
            functions.move([args[2], 'temp2'])
            functions.while(['temp2']);
            functions.add([args[2], 1]);
            functions.add(['temp3', 1]);
            functions.add(['temp2', -1]);
            functions.end([]);

            functions.while(['temp']);
            functions.add(['temp', -1]);
            functions.add(['temp3', -1]);
            functions.end([]);
            
            functions.add(['temp2', 1]);
            functions.while(['temp3']);
            functions.clear(['temp3']);
            functions.add(['temp2', -1]);
            functions.end([]);

            functions.while(['temp2']);
            functions.clear(['temp2']);
        }
        else if (args[1] == 'num') {
            functions.copy([args[0], 'temp3']);

            functions.add(['temp2', args[2]]);
            functions.while(['temp3']);
            functions.add(['temp3', -1]);
            functions.add(['temp2', -1]);
            functions.end([]);

            functions.move(['temp2', 'temp'])
            functions.while(['temp']);
            functions.clear(['temp']);
            functions.add(['temp2', 1]);
            functions.end([]);

            functions.add(['temp2', -1]);
            functions.while(['temp2']);
            functions.clear(['temp2']);
        }
    },
    ifn(args) {
        testArgs('#ifn', args, 3);
        
        functions.if(args);
        functions.else([]);
    },
    else(args) {
        functions.set(['temp', -1]);
        functions.end([]);
        functions.add(['temp', 1]);
        functions.while(['temp']);
        functions.clear(['temp']);
    },
    printstr(args) {
        testMoreArgs('printstr', args, 1);

        let value = 0;
        let combinedStrings = args.join(' ');
        for (let i = 0; i < combinedStrings.length; i++) {
            functions.add(['temp2', combinedStrings.charCodeAt(i) - value]);
            value = combinedStrings.charCodeAt(i);
            functions.print(['temp2']);
        }
        functions.clear(['temp2']);
    },
    printl(args) {
        testMoreArgs('printstr', args, 1);

        let value = 0;
        let combinedStrings = args.join(' ');
        for (let i = 0; i < combinedStrings.length; i++) {
            functions.add(['temp2', combinedStrings.charCodeAt(i) - value]);
            value = combinedStrings.charCodeAt(i);
            functions.print(['temp2']);
        }

        functions.add(['temp2', 10 - value]);
        functions.print(['temp2']);

        functions.clear(['temp2']);
    },
    iftrue(args) {
        testArgs('#iftrue', args, 1);
        varExists(args[0]);

        functions.copy([args[0], 'temp2']);
        functions.while(['temp2']);
        functions.clear(['temp2']);
    },
    iffalse(args) {
        testArgs('#iffalse', args, 1);
        varExists(args[0]);

        functions.iftrue([args[0]]);
        functions.add(['temp', 1]);
        functions.end([]);
        functions.add(['temp', -1]);
        functions.while(['temp']);
        functions.clear(['temp']);
    },
    imove(args) {
        testArgs('imove', args, 2);
        varExists(args[0]);
        varExists(args[1]);

        functions.while([args[0]]);
        functions.add([args[0], -1]);
        functions.add([args[1], -1]);
        functions.end([]);
    },
    divnum(args) {
        testArgs('div', args, 3);
        varExists(args[0]);
        varExists(args[2]);
        functions.createVariable(['temp4']);
        let num = parseInt(args[1]);

        functions.move([args[0], 'temp4']);
        functions.while(['temp4']);
        functions.add(['temp4', -1]);
        functions.add([args[2], 1]);
        functions.if([args[2], 'num', num]);
        functions.clear([args[2]]);
        functions.add([args[0], 1]);
        functions.end([]);
        functions.end([]);
    },
    goto(args) {
        testArgs('move', args, 1);
        varExists(args[0]);
        move(args[0]);
    },
    printdec(args) {
        testArgs('printdec', args, 1);
        varExists(args[0]);
        functions.createVariable(['temp4']);
        functions.createVariable(['printdec-one']);
        functions.createVariable(['printdec-ten']);
        functions.createVariable(['printdec-hun']);

        functions.clear(['printdec-one']);
        functions.clear(['printdec-ten']);
        functions.clear(['printdec-hun']);

        functions.copy([args[0], 'printdec-one']);
        functions.divnum(['printdec-one', 10, 'printdec-ten']);
        functions.switch(['printdec-one', 'printdec-ten']);
        functions.divnum(['printdec-ten', 10, 'printdec-hun']);
        functions.switch(['printdec-ten', 'printdec-hun']);

        functions.copy(['printdec-hun', 'temp4']);
        functions.iftrue(['temp4']);
        functions.add(['printdec-hun', 48]);
        functions.print(['printdec-hun']);
        functions.end([]);
        functions.copy(['printdec-ten', 'temp4']);
        functions.iftrue(['temp4']);
        functions.add(['printdec-ten', 48]);
        functions.print(['printdec-ten']);
        functions.end([]);
        functions.clear(['temp4']);
        functions.add(['printdec-one', 48]);
        functions.print(['printdec-one']);
    },
    switch(args) {
        testArgs('switch', args, 2);
        varExists(args[0]);
        varExists(args[1]);

        functions.move([args[0], 'temp']);
        functions.move([args[1], args[0]]);
        functions.move(['temp', args[1]]);
    },
    newl(args) {
        testArgs('newl', args, 0);

        if (variables.has('newl')) {
            functions.print(['newl']);
        }
        else {
            functions.createVariable(['newl']);
            functions.add(['newl', 10])
        }
    },
};

var commands = {
    "var": functions.createVariable,
    "add": functions.add,
    "clear": functions.clear,
    "set": functions.set,
    "move": functions.move,
    "imove": functions.imove,
    "copy": functions.copy,
    "multiply": functions.multiply,
    "#pause": functions.pause,
    "#while": functions.while,
    "#end": functions.end,
    "#scope": functions.scope,
    "input": functions.input,
    "print": functions.print,
    "printletter": functions.printletter,
    "printstr": functions.printstr,
    "printl": functions.printl,
    "divnum": functions.divnum,
    "#if": functions.if,
    "#iftrue": functions.iftrue,
    "#iffalse": functions.iffalse,
    "#else": functions.else,
    "goto": functions.goto,
    "printdec": functions.printdec,
    "switch": functions.switch,
    "newl": functions.newl,
};

$('#build').click(() => {
    variables = new Map();
    variables.set('temp2', 0);
    variables.set('temp', 1);
    usedmemory = [0, 1];
    position = 0;
    result = '';
    scopes = [new Scope('scope')];

    let text = $('#input').val();
    for (let i = 0; i < preprocessor.length; i++) {
        text = preprocessor[i](text);
    }

    args = text.split('\n');
    for (let i = 0; i < args.length; i++) {
        args[i] = args[i].split(' ');
        if (commands.hasOwnProperty(args[i][0])) {
            commands[args[i][0]](args[i].slice(1));
        }
        else {
            $('#output').val(`Error: Command ${args[i][0]} does not exist.`);
            throw new Error("Error");
        }
    }

    for (let i = 0; i < postprocessor.length; i++) {
        result = postprocessor[i](result);
    }
    
    $('#output').val(result);
    console.log(variables);
});

// Localstorage
if (localStorage.getItem('bfc-text') === null) {
    localStorage.setItem('bfc-text', '');
}
else {
    $('#input').val(localStorage.getItem('bfc-text'));
}

$('#input').on('input', () => {
    localStorage.setItem('bfc-text', $('#input').val());
});

$('#rmLocalStorage').click(() => {
    $('#input').val('');
    $('#output').val('');
    localStorage.setItem('bfc-text', '');
});