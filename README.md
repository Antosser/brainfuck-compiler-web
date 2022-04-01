# [Online Brainfuck compiler](https://antosser.github.io/brainfuck-compiler-web/)
Brainfuck was designed to be the hardest programming language ever, but I made a tool to compile easy-to-read code to brainfuck.

## Usage
1. Go to [this link.](https://antosser.github.io/brainfuck-compiler-web/)
2. Enter your code in the text area below "Input".
3. Click the "Build" button.
4. Copy the code from the text area below "Ouput" and paste it into your brainfuck interpreter.

## Features
- Your code uses scopes. If a variable goes out of scope it's memory will be cleared
- Start a line with // to mark it as a comment

## Code syntax
Don't put ; at the end of any line.

### Commands
#### Assignment
- **var** {variable} - Create variable
- **move** {variable1} {variable2} - Move value of variable1 to variable2
- **swtich** {variable1} {variable2} - Switch values of variable1 and variable2
- **copy** {variable1} {variable2} (variable3) ...- Copy value of varaiable1 to variable2 and optioanally var3, var4, ...
- **set** {variable} {number} - Set value to to a variable
- **clear** {variable} - Set variable's value to 0

#### Computation
- **add** {variable} {number} - Add number to variable
- **multiply** {variable} {number} - Multiply variable by number
- **divnum** {variable} {value} {module-output} - Divide value of variable by {value} and store result into {variable} and {module-output}
- **divvar** {variable} {variable2} {module-output} - Divide value of variable by {variable2} and store result into {variable} and {module-output}

#### I/O (Inout / Output)
- **input** {variable} - Set value of variable to the pressed key
- **print** {variable} - Print ASCII character of variable
- **printletter** {character} - Print character
- **printstr** {string} - Print string
- **printl** {string} - Print string ending with \n
- **printdec** {variable} - Print variable as decimal integer
- **newl** - End line
- **space** - Print space

#### Scoping
- **#if** {variable1} var {variable2} - Execute code if variable1 == variable2
- **#if** {variable1} num {number} - Execute code if variable1 == number
- **#if** {variable1} letter {letter} - Execute code if variable1 == ASCII code of letter
- **#while** {variable} - Execute code while variable is not 0
- **#iftrue** {variable} - Execute code if variable is non-0
- **#iffalse** {variable} - Execute code if variable is 0
- **#scope** - Open a scope
- **#end** - End scope / while / if / etc.
- **#pause** - Pause code

#### Enums
- **enumtype** {typename} {value1} {value2} ... - Creates enum type
- **createenum** {varname} {enumtype} - Create enum variable storing a value
- **setenum** {enum} {value} - Set enum to value
- **#ifenum** {enum} {value} - Same as #if but with enums
- **#ifnenum** {enum} {value} - Opposite of #ifenum

## Example
### Assignment
```
// Simple comment

// Create variable a and b
var a
var b

// Set a to 69
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

### Computation
```
// Create variable a and set it to 20
var a
set a 20

// Add 3 to a (a will be 23)
add a 3

// Multiply a with 3 (a will be 69)
multiply a 3

// Now divide a by 3 ( a will be 23 again)
// First we need to create a variable for the module
var mo
divnum a 3 mo
```

### I/O (Inout / Output)
```
// Create a variable for input
var input

// Set input to the ASCII code of the inputted character
input input

// Print the inputted character
print input

// Print a capital A
printletter A

// Print "Hello World!" (with line ending)
printl Hello World!

// Print "Hello World!" (without line ending)
printstr Hello World!

// End the line
newl

// Create variable num and set it to 123
var num
set num 123

// Print the number
printdec num
```
Output:
```
AHello World!
Hello World!
123
```

### Scoping
```
// Create variable a and set it to 12
var a
set a 12

// Create variable b and set it to 13
var b
set b 13

// Compare a and b
#if a var b
  // Print true if a and b are equal
  printl true
#else
  // Print false if a and b are not equal
  printl false
#end

// Compare a and 12
#if a num 12
  // Print true if a is 12
  printl true
#else
  // Print false if a is not 12
  printl false
#end

// Input a character
var input
input input

// Check if input is the capital letter A
#if input letter A
printl true
#else
printl false
#end

// Create variable i and set it to 10
var i
set I 10

// Loop 10 times
#while i
  printl lol
  add i -1
#end

// Create scope
#scope
  var mylocalvariable
#end

// Set already existing variable a to 0
clear a

// Check if a is non-zero
#iftrue a
  // Won't run
#end

// Check if a is 0
#iffalse a
  // Will run
#end
```

### Enums
```
// Create enum type imageextensions
enumtype imageextensions jpg png gif

// Create variable that contains one of: jpg, png, gif
createenum myextension imageextensions

// Set it to png
setenum myextension gif

// Check if extension is png
#ifenum myextension png
  printl It is png!
#end
#ifenum myextension gif
  printl It is gif!
#end
#ifenum myextension jpg
  printl It is jpg!
#end
```
Output:
```
It is gif!
```
