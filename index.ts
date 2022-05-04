var usedmemory: number[];
var position: number;
var result: string;
var scopes: Scope[];
var enumtypes: Map<string, BfEnum>;
var enums: Map<string, string>;
var line: number;
var positions: number[] = [];
var optimize = false;
let lengthcouldbe = 0;

function deepcopy(variable: any) {
    return JSON.parse(JSON.stringify({variable})).variable;
}

var preprocessor: ((data: string) => string)[] = [
    // Trim each line
    input => {
        let result = input.split('\n')
        for (let i = 0; i < result.length; i++) {
            result[i] = result[i].trim();
        }
        return result.join('\n');
    },

    // Remove comments
    input => {
        let textsplit = input.split('\n')
        let result = "";
        for (let i = 0; i < textsplit.length; i++) {
            if (!textsplit[i].startsWith('//')) {
                result += textsplit[i] + '\n';
            }
        }
        return result;
    },

    // Remove empty lines
    input => input.split('\n').filter(n => n).join('\n'),
];

var postprocessor: ((data: string) => string)[] = [
    // Move
    input => {
        let frequencies_key: [number, number][] = [];
        let frequencies_value: number[] = [];

        for (let i = 0; i < positions.length - 1; i++) {
            let key: [number, number] = positions.slice(i, i + 2).sort((a, b) => a - b) as [number, number];

            // Check if array is already in the array
            let index = frequencies_key.findIndex(x => x[0] === key[0] && x[1] === key[1]);
            if (index == -1) {
                frequencies_key.push(key);
                frequencies_value.push(1);
            }
            else {
                frequencies_value[index]++;
            }
        }

        // Remove frequency keys and values whose both values are the same
        let frequencies_key_filtered: [number, number][] = [];
        let frequencies_value_filtered: number[] = [];
        for (let i = 0; i < frequencies_key.length; i++) {
            if (frequencies_value[i][0] === frequencies_value[i][1]) {
                frequencies_key_filtered.push(frequencies_key[i]);
                frequencies_value_filtered.push(frequencies_value[i]);
            }
        }
        frequencies_key = frequencies_key_filtered;
        frequencies_value = frequencies_value_filtered;

        // Sort frequencies by value into array of keys without modifying the original array
        let sorted_frequencies_key: [number, number][] = frequencies_key.sort((a, b) => frequencies_value[frequencies_key.indexOf(a)] - frequencies_value[frequencies_key.indexOf(b)]);
        sorted_frequencies_key.reverse();
        console.log(JSON.parse(JSON.stringify({sorted_frequencies_key})));

        let possibilities: number[][] = [];

        for (let i = 0; i < sorted_frequencies_key.length; i++) {
            // Find index of possibility that includes the first element of key
            let index_first = possibilities.findIndex(x => x.includes(sorted_frequencies_key[i][0]));
            // Find index of possibility that includes the second element of key
            let index_second = possibilities.findIndex(x => x.includes(sorted_frequencies_key[i][1]));

            if (index_first == -1 && index_second == -1) {
                possibilities.push(deepcopy(sorted_frequencies_key)[i]);
                continue;
            }

            if (index_first == -1) {
                // Swap first and second
                let temp = deepcopy(sorted_frequencies_key)[i][0];
                sorted_frequencies_key[i][0] = deepcopy(sorted_frequencies_key)[i][1];
                sorted_frequencies_key[i][1] = temp;
                index_first = possibilities.findIndex(x => x.includes(sorted_frequencies_key[i][0]));
                index_second = possibilities.findIndex(x => x.includes(sorted_frequencies_key[i][1]));
            }

            if (index_second == -1) {

                // Get the index of the first possibility with the first element of key
                let index_first_possibility = possibilities[index_first].indexOf(sorted_frequencies_key[i][0]);

                // Check if possibilities[index_first] is on the left side
                let left_first = (index_first_possibility < possibilities[index_first].length / 2);

                // Put the second element of key to the side of possibility
                if (left_first) {
                    possibilities[index_first].unshift(sorted_frequencies_key[i][1]);
                }
                else {
                    possibilities[index_first].push(sorted_frequencies_key[i][1]);
                }
            
            }
            else if (index_first !== index_second) {
                // Check if possibilities[index_first] is on the left side
                let left_first = (possibilities[index_first].indexOf(sorted_frequencies_key[i][0]) < possibilities[index_first].length / 2);

                // Reverse if true
                if (left_first) {
                    possibilities[index_first].reverse();
                }

                // Check if possibilities[index_second] is on the left side
                let left_second = (possibilities[index_second].indexOf(sorted_frequencies_key[i][1]) < possibilities[index_second].length / 2);

                // Reverse if false
                if (!left_second) {
                    possibilities[index_second].reverse();
                }

                // Pop second into first
                possibilities[index_first].push(possibilities[index_second].pop());
            }
        }

        // log possibilities
        console.log({possibilities});
        
        // Replace every element of positions with the index of the firstpossibility
        let newPositions = [];
        for (let i = 0; i < positions.length; i++) {
            newPositions.push(possibilities[0].indexOf(positions[i]));
        }
        console.log({positions});
        console.log({newPositions});

        position = 0;

        for (let i = 0; i < (optimize ? newPositions : positions).length; i++) {
            let dif = (optimize ? newPositions : positions)[i] - position;

            if (dif < 0) {
                input = input.replace('*', '<'.repeat(Math.abs(dif)));
            }
            else if (dif > 0) {
                input = input.replace('*', '>'.repeat(Math.abs(dif)));
            }
            else {
                input = input.replace('*', '');
            }

            position += dif;
        }

        // Get the sum of the differences between the old positions
        let sum = 0;
        for (let i = 0; i < positions.length; i++) {
            if (i === positions.length - 1) break;
            sum += Math.abs(positions[i] - positions[i + 1]);
        }

        // Get the sum of the differences between the new positions
        let newSum = 0;
        for (let i = 0; i < newPositions.length; i++) {
            if (i === newPositions.length - 1) break;
            newSum += Math.abs(newPositions[i] - newPositions[i + 1]);
        }

        console.log(`Reduced from ${sum} to ${newSum} (by ${sum - newSum})`);

        lengthcouldbe = result.match(/[^\*]/g).length + sum;

        return input;
    },

    // \n every 50 characters
    input => {
        let postprocessed = '';

        for (let i = 0; i < input.length; i++) {
            postprocessed += input[i];
            if ((i + 1) % 100 == 0) {
                postprocessed += '\n';
            }
        }

        return postprocessed;
    },
];

class Scope {
    type: string;
    variables: Map<string, number>;
    variable: string | null;
    arrays: Map<string, [number, number]>;

    constructor(type: string, variable?: string) {
        this.type = type;
        this.variables = new Map();
        this.variable = variable;
        this.arrays = new Map();
    }
}

class BfEnum {
    assignments: Map<string, number>;

    constructor(assignments: string[]) {
        this.assignments = new Map();

        let nextfree = 1;

        assignments.forEach(element => {
            this.assignments.set(element, nextfree);
            nextfree++;
        });
    }
}

function testArgs(name: string, args: string[], len: number) {
    if (args.length != len) {
        $('#output').val(`(Line: ${line}) Error: ${name} accepts ${len} arguments but ${args.length} were given.`)
        throw new Error('Code error');
    }
}
function testMoreArgs(name: string, args: string[], len: number) {
    if (args.length < len) {
        $('#output').val(`(Line: ${line}) Error: ${name} accepts ${len} or more arguments but ${args.length} were given.`)
        throw new Error('Code error');
    }
}
function testSomeArgs(name: string, args: string[], len: number[]) {
    if (len.indexOf(args.length) == -1) {
        $('#output').val(`(Line: ${line}) Error: mulvar accepts ${len.join(' or ')} arguments but ${args.length} were given.`)
        throw new Error('Code error');
    }
}

function getVarIndex(varname: string): number {
    let found: number = -1;

    scopes.forEach(scope => {
        if (scope.variables.has(varname)) {
            found = scope.variables.get(varname);
        }
    });

    return found;
}

function getArrayIndex(arrname: string): number {
    let found: number = -1;

    scopes.forEach(scope => {
        if (scope.arrays.has(arrname)) {
            found = scope.arrays.get(arrname)[0];
        }
    });

    return found;
}

function getArraySize(arrname: string): number {
    let found: number = -1;

    scopes.forEach(scope => {
        if (scope.arrays.has(arrname)) {
            found = scope.arrays.get(arrname)[1];
        }
    });

    return found;
}
function varExists(varname: any) {
    let found = false;

    scopes.forEach(scope => {
        if (scope.variables.has(varname)) {
            found = true;
        }
    });

    return found;
}

function arrExists(varname: any) {
    let found = false;

    scopes.forEach(scope => {
        if (scope.arrays.has(varname)) {
            found = true;
        }
    });

    return found;
}

function checkVar(varname: string) {
    if (getVarIndex(varname) == -1) {
        $('#output').val(`(Line: ${line}) Error: Variable ${varname} does not exist.`)
        throw new Error('Code error');
    }
}

function checkArr(varname: string) {
    if (!arrExists(varname)) {
        $('#output').val(`(Line: ${line}) Error: Array ${varname} does not exist.`)
        throw new Error('Code error');
    }
}

function getAvailablePosition() {
    if (usedmemory.length == 0) {
        return 0;
    }

    for (let i = 0; i < Math.max(...usedmemory); i++) {
        if (usedmemory.indexOf(i) == -1) {
            return i;
        }
    }

    return Math.max(...usedmemory) + 1;
}

function bestMultiplication(n: number) {
    let facs: number[][] = [];
    let currentbest = [0, 0];
    let bestsum = 9999;
    for (let i = -5; i < 6; i++) {
        for (let j = 1; j < n + i + 1; j++) {
            if ((n + i) % j == 0) {
                facs.push([j, Math.floor((n + i) / j)]);
                if (j + (n + i) / j + Math.abs(i) < bestsum) {
                    bestsum = j + (n + 1) / j + Math.abs(i);
                    currentbest = [j, Math.floor((n + i) / j)];
                }
            }
        }
    }

    return currentbest
}

function move(varname: string) {
    let dif = getVarIndex(varname) - position;

    position += dif;
    result += '*';
    positions.push(position);
}

function moveRaw(pos: number) {
    let dif = pos - position;

    position += dif;
    result += '*';
    positions.push(position);
}    

var functions = {
    createVariable(args: any[]) {
        testSomeArgs('var', args, [1, 2]);

        // if (scopes[scopes.length - 1].variables.has(args[0])) {
        //     $('#output').val(`(Line: ${line}) Error: Variable ${args[0]} already exists in this scope.`)
        //     throw new Error('Code error');
        // }
    
        scopes[scopes.length - 1].variables.set(args[0], getAvailablePosition());
        usedmemory.push(getAvailablePosition());

        if (args.length == 2) {
            functions.set([args[0], args[1]]);
        }
    },
    add(args: any[]) {
        let num = parseInt(args[1]);

        testArgs('add', args, 2);
        checkVar(args[0]);
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
            for (let i = 0; i < Math.floor(fac[0]); i++) {
                result += '+';
            }
            result += '[';
            move(args[0]);
            for (let i = 0; i < Math.floor(fac[1]); i++) {
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
            let dif = num - Math.floor(fac[0]) * Math.floor(fac[1] * mo)
            for (let i = 0; i < Math.abs(Math.floor(dif)); i++) {
                if (Math.floor(dif) > 0) {
                    result += '+';
                }
                if (Math.floor(dif) < 0) {
                    result += '-';
                }
            }
        }
    },
    addRaw(args: any[]) {
        let num = parseInt(args[1]);

        testArgs('add', args, 2);
        // checkVar(args[0]);
        let fac = bestMultiplication(Math.abs(num));
        if (fac[0] + fac[1] + 5 > Math.abs(num)) {
            moveRaw(args[0]);
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
            for (let i = 0; i < Math.floor(fac[0]); i++) {
                result += '+';
            }
            result += '[';
            moveRaw(args[0]);
            for (let i = 0; i < Math.floor(fac[1]); i++) {
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
            moveRaw(args[0]);
            let dif = num - Math.floor(fac[0]) * Math.floor(fac[1] * mo)
            for (let i = 0; i < Math.abs(Math.floor(dif)); i++) {
                if (Math.floor(dif) > 0) {
                    result += '+';
                }
                if (Math.floor(dif) < 0) {
                    result += '-';
                }
            }
        }
    },
    clear(args: any[]) {
        testArgs('clear', args, 1);
        checkVar(args[0]);
        move(args[0]);
        result += '[-]';
    },
    clearRaw(args: any[]) {
        testArgs('clear', args, 1);

        moveRaw(args[0]);
        result += '[-]';
    },
    set(args: any[]) {
        testArgs('set', args, 2);
        checkVar(args[0]);
        functions.clear([args[0]]);
        functions.add([args[0], args[1]]);
    },
    setRaw(args: any[]) {
        testArgs('set', args, 2);

        functions.clearRaw([args[0]]);
        functions.addRaw([args[0], args[1]]);
    },

    move(args: any[]) {
        testArgs('move', args, 2);
        checkVar(args[0]);
        checkVar(args[1]);
        move(args[0]);
        result += '[-';
        move(args[1]);
        result += '+';
        move(args[0]);
        result += ']'
    },
    copy(args: any[]) {
        testMoreArgs('copy', args, 2);

        let copyTo = args.slice(1);
        let copies = copyTo.length;

        for (let i = 0; i < copies; i++) {
            checkVar(copyTo[i]);
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
    icopy(args: any[]) {
        testMoreArgs('copy', args, 2);

        let copyTo = args.slice(1);
        let copies = copyTo.length;

        for (let i = 0; i < copies; i++) {
            checkVar(copyTo[i]);
        }
        functions.move([args[0], 'temp']);
        move('temp');
        result += '[-';
        for (let i = 0; i < args.length; i++) {
            move(args[i]);
            result += '-';
        }
        move('temp');
        result += ']';
    },
    mulnum(args: any[]) {
        testSomeArgs('mulnum', args, [2, 3]);
        checkVar(args[0]);
        if (args.length == 3) {
            checkVar(args[2]);
        }

        let num = parseInt(args[1]);
        functions.copy([args[0], 'temp2']);
        if (args.length == 2) {
            functions.clear([args[0]]);
        }

        functions.while(['temp2']);
        functions.add([args.length == 2 ? args[0]: args[2], num]);
        functions.add(['temp2', -1])
        functions.end([]);
    },
    mulvar(args: any[]) {
        testSomeArgs('mulvar', args, [2, 3]);
        checkVar(args[0]);
        checkVar(args[1]);
        if (args.length == 3) {
            checkVar(args[2]);
        }
        functions.createVariable(['temp3']);

        functions.copy([args[0], 'temp2']);
        functions.copy([args[1], 'temp3']);
        if (args.length == 2) {
            functions.clear([args[0]]);
        }

        functions.while(['temp2']);
        functions.add(['temp2', -1]);
        functions.copy(['temp3', args.length == 2 ? args[0]: args[2]]);
        functions.end([]);

        functions.clear(['temp3']);
    },
    pause(args: any[]) {
        testArgs('pause', args, 0);
        move('temp');
        result += '[]-[]';
    },
    while(args) {
        testArgs('#while', args, 1);
        checkVar(args[0]);
        move(args[0]);
        result += '[';
        scopes.push(new Scope('while', args[0]));
    },
    end(args: any[]) {
        testArgs('end', args, 0);
        let popped = scopes.pop();
        
        for (let i = 0; i < popped.variables.size; i++) {
            usedmemory.pop();
        }

        if (popped.type == 'while') {
            move(popped.variable);
            result += ']';
        }
    },
    scope(args: any[]) {
        testArgs('#scope', args, 0);
        scopes.push(new Scope('scope'));
    },
    input(args: any[]) {
        testArgs('input', args, 1);
        checkVar(args[0]);
        move(args[0]);
        result += ',';
    },
    print(args: any[]) {
        testArgs('print', args, 1);
        checkVar(args[0]);
        move(args[0]);
        result += '.';
    },
    printletter(args: any[]) {
        testArgs('printletter', args, 1);
        functions.set(['temp2', args[0].charCodeAt(0)]);
        move('temp2');
        result += '.';
        functions.clear(['temp2']);
    },
    addletter(args: any[]) {
        testArgs('addletter', args, 2);
        checkVar(args[0]);

        functions.add([args[0], args[1].charCodeAt(0)]);
    },
    setletter(args: any[]) {
        testArgs('setletter', args, 2);
        checkVar(args[0]);

        functions.set([args[0], args[1].charCodeAt(0)]);
    },
    if(args: any[]) {
        testArgs('#if', args, 3);
        checkVar(args[0]);
        functions.createVariable(['temp3']);
    
        if (args[1] == 'var') {
            checkVar(args[2]);

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
        else if (args[1] == 'num' || args[1] == 'letter') {
            if (args[1] == 'letter') {
                args[2] = args[2].charCodeAt(0);
            }
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
    ifn(args: any[]) {
        testArgs('#ifn', args, 3);
        
        functions.if(args);
        functions.else([]);
    },
    else(args: any[]) {
        functions.set(['temp', -1]);
        functions.end([]);
        functions.add(['temp', 1]);
        functions.while(['temp']);
        functions.clear(['temp']);
    },
    printstr(args: any[]) {
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
    printl(args: any[]) {
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
    iftrue(args: any[]) {
        testArgs('#iftrue', args, 1);
        checkVar(args[0]);

        functions.copy([args[0], 'temp2']);
        functions.while(['temp2']);
        functions.clear(['temp2']);
    },
    iffalse(args: any[]) {
        testArgs('#iffalse', args, 1);
        checkVar(args[0]);

        functions.iftrue([args[0]]);
        functions.add(['temp', 1]);
        functions.end([]);
        functions.add(['temp', -1]);
        functions.while(['temp']);
        functions.clear(['temp']);
    },
    ifinrange(args: any[]) {
        testArgs('#ifinrange', args, 3);
        let low = parseInt(args[1]);
        checkVar(args[0]);
        let high = parseInt(args[2]);
        functions.createVariable(['temp3']);
        functions.createVariable(['temp4']);
        functions.createVariable(['temp5']);

        functions.while([args[0]]);
        functions.add(['temp', 1]);
        functions.add(['temp2', -1]);
        functions.add([args[0], -1]);
        functions.end([]);
        functions.while(['temp']);
        functions.add([args[0], 1]);
        functions.add(['temp', -1]);
        functions.end([]);

        functions.add(['temp2', low]);
        functions.set(['temp3', high - low + 1]);

        functions.while(['temp3']);
        functions.copy(['temp2', 'temp4']);
        functions.set(['temp', 1]);

        functions.while(['temp4']);
        functions.clear(['temp4']);
        functions.add(['temp', -1]);
        functions.end([]);

        functions.while(['temp']);
        functions.clear(['temp']);
        functions.set(['temp5', 1]);
        functions.end([]);
        
        functions.add(['temp3', -1]);
        functions.add(['temp2', 1]);
        functions.end([]);

        functions.clear(['temp2'])
        functions.iftrue(['temp5']);
        functions.clear(['temp5']);
    },
    ifletterinrange(args: any[]) {
        testArgs('#ifletterinrange', args, 3);

        let low = args[1].charCodeAt(0);
        checkVar(args[0]);
        let high = args[2].charCodeAt(0);
        
        functions.ifinrange([args[0], low, high]);
    },
    imove(args: any[]) {
        testArgs('imove', args, 2);
        checkVar(args[0]);
        checkVar(args[1]);

        functions.while([args[0]]);
        functions.add([args[0], -1]);
        functions.add([args[1], -1]);
        functions.end([]);
    },
    divnum(args: any[]) {
        testArgs('div', args, 3);
        checkVar(args[0]);
        checkVar(args[2]);
        functions.createVariable(['temp4']);
        functions.clear(['temp4']);
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
    divvar(args: any[]) {
        testArgs('div', args, 3);
        checkVar(args[0]);
        checkVar(args[1]);
        checkVar(args[2]);
        functions.createVariable(['temp4']);
        functions.clear(['temp4']);

        functions.move([args[0], 'temp4']);
        functions.while(['temp4']);
        functions.add(['temp4', -1]);
        functions.add([args[2], 1]);
        functions.if([args[2], 'var', args[1]]);
        functions.clear([args[2]]);
        functions.add([args[0], 1]);
        functions.end([]);
        functions.end([]);
    },
    goto(args: any[]) {
        testArgs('move', args, 1);
        checkVar(args[0]);
        move(args[0]);
    },
    printdec(args: any[]) {
        testArgs('printdec', args, 1);
        checkVar(args[0]);
        functions.createVariable(['temp4']);
        functions.createVariable(['printdec-one']);
        functions.createVariable(['printdec-ten']);
        functions.createVariable(['printdec-hun']);

        functions.clear(['temp4'])
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
    switch(args: any[]) {
        testArgs('switch', args, 2);
        checkVar(args[0]);
        checkVar(args[1]);

        functions.move([args[0], 'temp']);
        functions.move([args[1], args[0]]);
        functions.move(['temp', args[1]]);
    },
    for(args: any[]) {
        testArgs('#for', args, 1);
        checkVar(args[0]);

        functions.while([args[0]]);
        functions.add([args[0], -1]);
    },
    enumtype(args: any[]) {
        testMoreArgs('enumtype', args, 2);

        enumtypes.set(args[0], new BfEnum(args.splice(1)));
    },
    createenum(args: any[]) {
        testArgs('createeum', args, 2);
        
        if (!enumtypes.has(args[1])) {
            $('#output').val(`(Line: ${line}) No enum type ${args[1]} exists`);
            throw new Error('Code error');
        }
        enums.set(args[0], args[1]);
        functions.createVariable([args[0]]);
    },
    setenum(args: any[]) {
        testMoreArgs('setenum', args, 2);

        if (!enums.has(args[0])) {
            $('#output').val(`(Line: ${line}) No enum ${args[0]} exists`);
            throw new Error('Code error');
        }
        if (!enumtypes.get(enums.get(args[0])).assignments.has(args[1])) {
            $('#output').val(`(Line: ${line}) Enum type ${enums.get(args[0])} does not have a property: ${args[1]}`);
            throw new Error('Code error');
        }

        functions.set([args[0], enumtypes.get(enums.get(args[0])).assignments.get(args[1])]);
    },
    ifenum(args: any[]) {
        testMoreArgs('#ifenum', args, 2);

        if (!enums.has(args[0])) {
            $('#output').val(`(Line: ${line}) No enum ${args[0]} exists`);
            throw new Error('Code error');
        }
        if (!enumtypes.get(enums.get(args[0])).assignments.has(args[1])) {
            $('#output').val(`(Line: ${line}) Enum type ${enums.get(args[0])} does not have a property: ${args[1]}`);
            throw new Error('Code error');
        }

        functions.if([args[0], 'num', enumtypes.get(enums.get(args[0])).assignments.get(args[1])]);
    },
    ifnenum(args: any[]) {
        testMoreArgs('#ifenum', args, 2);

        functions.ifenum(args);
        functions.else([]);
    },
    arr(args: any[]) {
        testArgs('arr', args, 2);
        args[1] = parseInt(args[1]);
        
        // First agrs[1] memory is the array data and the second args[1] memory are the indexes
        // Find consecutive free memory of size args[1]
        let pos = 0;
        {
            let length = 0;
            
            for (let i = 0; true; i++) {
                if (!usedmemory.includes(i)) {
                    length++;
                    if (length === args[1]*2) {
                        pos = i - length + 1;
                        break;
                    }
                } else {
                    length = 0;
                }
            }
        }

        // Create array
        for (let i = pos; i < pos + args[1]*2; i++) {
            usedmemory.push(i);
        }
        scopes[scopes.length - 1].arrays.set(args[0], [pos, args[1]]);

        // Set the indexes
        for (let i = 0; i < args[1]; i++) {
            functions.setRaw([pos + args[1] + i, i]);
        }
    },
    arradd(args: any[]) {
        testArgs('arraddnum', args, 3);
        checkArr(args[0]);
        args[1] = parseInt(args[1]);
        args[2] = parseInt(args[2]);

        functions.addRaw([getArrayIndex(args[0]) + args[1], args[2]]);
    },
};

var commands = {
    "var": functions.createVariable,
    "add": functions.add,
    "addletter": functions.addletter,
    "setletter": functions.setletter,
    "clear": functions.clear,
    "set": functions.set,
    "move": functions.move,
    "imove": functions.imove,
    "icopy": functions.icopy,
    "copy": functions.copy,
    "mulnum": functions.mulnum,
    "mulvar": functions.mulvar,
    "#pause": functions.pause,
    "#for": functions.for,
    "#while": functions.while,
    "#end": functions.end,
    "#scope": functions.scope,
    "input": functions.input,
    "print": functions.print,
    "printletter": functions.printletter,
    "printstr": functions.printstr,
    "printl": functions.printl,
    "divnum": functions.divnum,
    "divvar": functions.divvar,
    "#if": functions.if,
    "#iftrue": functions.iftrue,
    "#iffalse": functions.iffalse,
    "#else": functions.else,
    "goto": functions.goto,
    "printdec": functions.printdec,
    "switch": functions.switch,
    "enumtype": functions.enumtype,
    "createenum": functions.createenum,
    "setenum": functions.setenum,
    "#ifenum": functions.ifenum,
    "#ifnenum": functions.ifnenum,
    "#ifinrange": functions.ifinrange,
    "#ifletterinrange": functions.ifletterinrange,
    //"m": arr => move(arr[0]),
    "arr": functions.arr,
    "arradd": functions.arradd,
};

function compile(text: string, opti: boolean) {
    optimize = opti;
    usedmemory = [];
    position = 0;
    positions = [];
    scopes = [new Scope('scope')];
    functions.createVariable(['temp2']);
    functions.createVariable(['temp']);
    result = '';
    enumtypes = new Map();
    enums = new Map();
    line = 0;

    for (let i = 0; i < preprocessor.length; i++) {
        text = preprocessor[i](text);
    }

    let args: string[] = text.split('\n');
    let argsSplit: string[][] = Array(args.length).fill(null);
    for (let i = 0; i < args.length; i++) {
        line++;
        argsSplit[i] = args[i].split(' ');
        if (commands.hasOwnProperty(argsSplit[i][0])) {
            commands[argsSplit[i][0]](argsSplit[i].slice(1));
        }
        else {
            $('#output').val(`(Line: ${line}) Error: Command ${argsSplit[i][0]} does not exist.`);
            throw new Error("Error");
        }
    }

    for (let i = 0; i < postprocessor.length; i++) {
        result = postprocessor[i](result);
    }
    
    return result;
}

$('#build').on('click', () => {
    let compiled = compile($('#input').val() as string, $('#optimizecheck').is(':checked'));

    $('#output').val(compiled + `\n\nLength: ${compiled.match(/[+\-<>\.,\[\]]/g).length}`);
});

function decopmpile(input: string) {
    let position: number = 0;
    let result = '';
    let add = 0;
    let intendation = 0;
    let inuse: number[] = [];
    
    for (let char of input) {
        if (char === '>') {
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            position++;
        }
        else if (char === '<') {
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            position--;
        }
        else if (char === '+') {
            inuse.push(position);
            add++;
        }
        else if (char === '-') {
            inuse.push(position);
            add--;
        }
        else if (char === '.') {
            inuse.push(position);
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            result += `${'  '.repeat(intendation)}print v${position}\n`;
        }
        else if (char === ',') {
            inuse.push(position);
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            result += `${'  '.repeat(intendation)}input v${position}\n`;
        }
        else if (char === '[') {
            inuse.push(position);
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            result += `${'  '.repeat(intendation)}#while v${position}\n`;
            intendation++;
        }
        else if (char === ']') {
            inuse.push(position);
            if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}
            intendation--;
            result += `${'  '.repeat(intendation)}#end\n`;
        }
    }
    if(add!==0){result+=`${'  '.repeat(intendation)}add v${position} ${add}\n`;add=0}

    // Detete repeating values in inuse
    let inuse2: number[] = [];
    for (let i = 0; i < inuse.length; i++) {
        if (inuse2.indexOf(inuse[i]) === -1) {
            inuse2.push(inuse[i]);
        }
    }

    // Sort inuse2
    inuse2.sort((a, b) => a - b);
    
    // Reverse
    inuse2.reverse();

    inuse2.forEach(e => {
        result = `var v${e}\n${result}`;
    });

    return result;
}

$('#decompile').on('click', () => {
    $('#output').val(decopmpile($('#output').val() as string));
});

$('#optimize').on('click', () => {
    let len = ($('#output').val() as string).match(/[+\-<>\.,\[\]]/g).length;
    let compiled = compile(decopmpile($('#output').val() as string), true);

    $('#output').val(compiled + `\n\nLength: ${compiled.match(/[+\-<>\.,\[\]]/g).length}\nBefore: ${len}`);
});

// Localstorage
if (localStorage.getItem('bfc-text') === null) {
    localStorage.setItem('bfc-text', '');
}
else {
    $('#input').val(localStorage.getItem('bfc-text'));
}

if (localStorage.getItem('bfc-optimize') === null) {
    localStorage.setItem('bfc-optimize', '0');
}
else {
    $('#optimizecheck').prop('checked', localStorage.getItem('bfc-optimize') === '1');
}

$('#optimizecheck').on('change', () => {
    localStorage.setItem('bfc-optimize', $('#optimizecheck').is(':checked') ? '1' : '0');
});


$('#input').on('input', () => {
    localStorage.setItem('bfc-text', $('#input').val() as string);
});

$('#rmLocalStorage').click(() => {
    $('#input').val('');
    $('#output').val('');
    localStorage.setItem('bfc-text', '');
});