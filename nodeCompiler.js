#!/usr/local/bin/node

// To run this use:
//   ./mainCompiler.js test.cta -o test.cpp
//   node mainCompiler.js test.cta -o test.cpp

// Can't do `use-strict` because error-handling uses `arguments.callee.caller.name`.

// No idea why this is saved here. It's just the path to the glfw library for C++.
// /opt/homebrew/Cellar/glfw/3.3.4

// Use this to copy extension to VSCode (linux/mac only)
// cp -r extension/cta ~/.vscode/extensions

// Version number for the -v argument.
//let vNum = "1.5.0"

// Import every library needed (read files, output pretty dictionaries, etc.)
const { promises: { readFile, writeFile }, existsSync} = require("fs")
const util = require("util")
const { exec } = require("child_process")

// LANGUAGE THINGS

// Converts CTA types to C types
let ctaTypesToLangTypes = {}

// The start of any compiled C file.
let genCodeLib = ""

// The start of the main function
let genCodeStart = ""

// The end of the main function.
let genCodeEnd = ""

// The command used for compiling the final file
let compileCommand = ""

// Other config
let conf = {}

// All of these are loaded in later from the `/langs` folder

// This is where different classes, functions, and variables will be defined outside of `int main()`
let classes = ""
let functions = ""
let variableCode = ""

// CTA THINGS

// Different variable types
// `def` is the void type, which can't be used in a variable
// `cls` is the class type
let varTypes = ["int", "str", "flt", "dbl", "def", "cls"]
let formattedVarTypes = varTypes.map(e => e + "Type")

// Keywords are things that can't be used as variables, but are just normal language things
let keyWords = ["return", "break", "continue", "class", "this"]

// Variables with predefined values
let predefinedVals = {
    "true": { type: 'num', content: '1'},
    "false": { type: 'num', content: '0'}
}

// Converts CTA types to user-readable format.
let fullTokenNames = {
    "nam": "name",
    "num": "number",
    "opr": "operation",
    "str": "string",
    "declare": "variable declaration",
    "intType": "integer",
    "strType": "string",
    "fltType": "float",
    "dblType": "double",
    "def": "function"
}

// Stores the names of functions from CTA to the target language
let stats = {}

// Currently unused, but should eventually be used.
// C++'s default content depends on the variable type, but 
// other languages (like JavaScript or Python) just default
// it to something like `null`, `undefined`, or `None`.
// This is a big problem. This dict is staying as a reminder.
let defaultContent = {
    "int": { type: "num", content: "0" },
    "str": { type: "str", content: "" },
    "flt": { type: "num", content: "0.0" },
    "dbl": { type: "num", content: "0.0" },
    "arr": { type: "???" },
    "fn":  { type: "???" },
    "var": { type: "???" }
}

// Every operator in CTA is compiled to a function. These are the function names.
let operationFunctions = {
    "+" : "sum", "-" : "sub",
    "*" : "mul", "/" : "div",
    "==": "eql", "!=": "nql",
    "<" : "lss", ">" : "mrr",
    "<=": "leq", "=<": "leq",
    ">=": "meq", "=>": "meq"
}

// Just like the `keyWords` thing, but CTA has some custom behavior for the inputs of these.
let controlFlow = ["if", "elif", "else", "while", "for", "scan"]

// Things that can't be used as variable names.
let noVarNames = [...varTypes, ...controlFlow, ...Object.keys(stats), ...keyWords]

// Stores all the new class names
let classNames = []

// These hold values for variable checking.
// Eventually, these should *never* be used, but it's a good enough workaround for now.
let lastVariableType = ""
let checkedVariableType = ""
let fullAst
let fullProgram = ""

// DEAL WITH ARGUMENTS

let inputArguments = process.argv.slice(2)

// Check if no arguments have been given, and print the usage of the compiler.
if (inputArguments.length == 0) {
    console.log("usage: compiler [input file name] [output file name]")
    console.log(`Arguments:
    --v : gets the compiler's version
    --p : passes the output file through the target language's compiler`)
    process.exit(0)
}

// Print the compiler version and get/change build number
let vNum = "1.6"
readFile("version", "utf8").then(function(e){
    e = parseInt(e)
    if (existsSync("debug")) e += 1
    vNum += "." + e

    writeFile("version", e.toString()).then(function(err){
        if (err != undefined) error(err)

        if (inputArguments.includes("--v")) {
            console.log("CTA Language Compiler v" + vNum)
            process.exit(0)
        }

        readFile(inputFileName, "utf8").then(data => {
            readFile("langs/" + outputFileType + ".json", "utf8").then(lcs => {
                lcs = JSON.parse(lcs)
                if ("typeConversions" in lcs) ctaTypesToLangTypes = lcs.typeConversions
                if ("fileStart"       in lcs) genCodeLib          = lcs.fileStart
                if ("mainStart"       in lcs) genCodeStart        = lcs.mainStart
                if ("mainEnd"         in lcs) genCodeEnd          = lcs.mainEnd
                if ("compilerCommand" in lcs) compileCommand      = lcs.compilerCommand
        
                if ("conf" in lcs) conf = lcs.conf
        
                if (typeof genCodeLib   != "string") genCodeLib   = genCodeLib.join("\n")
                if (typeof genCodeStart != "string") genCodeStart = genCodeStart.join("\n")
                if (typeof genCodeEnd   != "string") genCodeEnd   = genCodeEnd.join("\n")
        
                stats = conf.stats
        
                if (conf.funcType[0]) ctaTypesToLangTypes[conf.funcType[1]] = conf.funcType[1]
        
                writeFile(outputFileName, compile(data), "utf8").then(() => {
                    if (inputArguments.includes("--p")) {
                        compileCommand = compileCommand.replace(/\{name\}/g,
                            outputFileName)
                        compileCommand = compileCommand.replace(/\{nameNoExt\}/g,
                            outputFileName.split(".").slice(0, -1).join("."))
                        exec(compileCommand, function compileCode(err) {
                            if (err) {
                                error(err)
                            }
                        })
                    }
                })
            })
            // readFile("headers/dotfns.cpp", "utf8").then((dotfnsfile) => {
            // }).catch(e => {
            //     console.log(e)
            //     error(`Dot functions file not found!`)
            // })
        }).catch(e => {
            error(e)
            error(`File \`${inputFileName}\` not found.`)
        })

    })
})

//console.log(fs.readFile("langs/c++.cta", "utf8"))
//fs.promises.readFile("langs/cpp.cta", "utf8")

let inputFileName = inputArguments[0]
let outputFileName = inputFileName
if (inputArguments.includes("-o"))
    outputFileName = inputArguments[inputArguments.indexOf("-o") + 1]
let outputFileType = outputFileName.split(".").slice(-1)[0]

String.prototype.any = function(c) { return this.includes(c) }

// This is called when a compiler error is thrown.
// It's the sole reason why `"use strict"` can't be used >:(
function error(message, node) {
    console.log(`\x1b[31mERROR at ${arguments.callee.caller.name}: ${message}`)
    if (node != undefined) {
        console.log("  Line " + node.posInfo[0] + ":", fullProgram.split("\n")[node.posInfo[0] - 1])
        console.log(
            "        ", 
            " ".repeat(node.posInfo[2])
            + "^".repeat((node.posInfo[3] - node.posInfo[2]) + 1))
    } else {
        console.log("  ( No node provided!!! )")
    }
    process.exit(1)
}

// This is called when any unhandled exception happens.
// During normal operation, this sould never be called, but it's useful for debugging.
process.on('uncaughtException', (err) => {
    console.error(`\x1b[31mThere was an uncaught error!\n `, err)
    process.exit(1)
})

// Used to warn about something which isn't a fatal error.
function warn(message) {
    console.log(`\x1b[33m${message}\x1b[0m`)
}

// Compiles a program
function compile(program) {
    fullProgram = program
    let tokens   = tokenize(program)
    let ast      = parse   (tokens)
    modify        (ast)
    operations    (ast)
    console.log("\n" + util.inspect(ast, false, null, true))
    variables     (ast)
    control       (ast)
    adjacentTokens(ast)
    pathGen       (ast)
    fullAst = ast
    let code     = genCodeStart + generate(ast) + genCodeEnd
        code     = indent(code, 0)
    
    classes      = indent(classes, 0)
    variableCode = indent(variableCode, 0)
    functions    = indent(functions, 0)

    code = genCodeLib 
        + "\n"+ classes
        + "\n" + variableCode +
        "\n" + functions
        + code
    code = code.replace(/\n\s*;\n/g, "\n\n")
    while (code.match(/\n\s*\n/)) code = code.replace(/\n\s*\n/, "\n")
    while ([" ", "\n"].includes(code[0])) code = code.substr(1)
    while ([" ", "\n"].includes(code[code.length - 1])) code = code.slice(0, -1)
    return code
}