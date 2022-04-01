# [Online Brainfuck compiler](https://antosser.github.io/brainfuck-compiler-web/)
Brainfuck was designed to be the hardest programming language ever but I made a tool to compile easy-to-read code to brainfuck

## Usage
1. Go to [this link](https://antosser.github.io/brainfuck-compiler-web/)
2. Enter your code in the textarea below "Input"
3. Click the "Build" button
4. Copy the code from the textarea below "Ouput" and paste it into your brainfuck interpreter

## Features
- Your code uses scopes. If a variable goes out of scope it's memory will be cleared
- Start a line with // to mark it as a comment

## Code syntax
The code uses an assembly-like syntax so don't put any ; and the end of any line

### Commands
#### Assignment
- **var** {variable} - Create variable
- **move** {variable1} {variable2} - Move value of variable1 to variable2
- **swtich** {variable1} {variable2} - Switch values of variable1 and variable2
- **copy** {variable1} {variable2} (variable3) ...- Copy value of varaiable1 to variable2 and optioanally var3, var4, ...
- **set** {variable} {number} - Set value to to a variable
- **clear** {variable} - Clear variable

#### Computation
- **add** {variable} {number} - Adds number to variable
- **multiply** {variable} {number} - Multiply variable by number
- **divnum** {variable} {value} {module-output} - Divides value of variable by {value} and stores result into {variable} and {module-output}
- **divvar** {variable} {variable2} {module-output} - Divides value of variable by {variable2} and stores result into {variable} and {module-output}

#### I/O
- **input** {variable} - Set value of variable to the pressed key
- **print** {variable} - Print ASCII character of variable
- **printletter** {character} - Print character
- **printstr** {string} - Print string
- **printl** {string} - Print string ending with \n
- **printdec** {variable} - Print variable as decimal integer
- **newl** - End line

#### Scoping
- **#if** {variable1} var {variable2} - Execute code if variable1 == variable2
- **#if** {variable1} num {number} - Execute code if variable1 == number
- **#while** {variable} - Execute code code while variable is not 0
- **#end** - End scope / while / if / ect
- **#scope** - Open a scope
- **#pause** - Pause code
- **#iftrue** {variable} - Execute code if variable is non zero
- **#iffalse** {variable} - Execute code if variable is zero

#### Enums
- **enumtype** {typename} {value1} {value2} ... - Creates enum type
- **createenum** {varname} {enumtype} - Create enum variable storing a value
- **setenum** {enum} {value} - Set value of enum to value
- **#ifenum** {enum} {value} - Same as #if but with enums
- **#ifnenum** {enum} {value} - Opposite of #ifenum

## Example
```cfg
// Simple comment

// Create variable a and b
var a
var b

// Assign 69 to a
set a 69

// Move a to b (A will be 0, b will be 69)
move a b

// Switch values of a and b (A will be 69, b will be 0)
switch a b

// Copy a to b (Now both a and b will be 69)
copy a b

// Clear / Reset both variables
clear a
clear b
```
