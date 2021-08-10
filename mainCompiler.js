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
let controlFlow = ["if", "while", "for", "scan"]

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
let vNum = "1.5"
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
if (outputFileType != "--v") console.log(outputFileType)

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
    variables     (ast)
    control       (ast)
    adjacentTokens(ast)
    // console.log("\n" + util.inspect(ast, false, null, true))
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

// Turns a program into a list of tokens
// NOTE: this can 100% be shortened. It's slow and inefficient.
function tokenize(program) {
    let tokens      = [] // Stores all the tokens
    let currentChar = 0  // Stores the current character index in the whole program
    let lineNum     = 0  // Stores the current line number
    let lineChar    = 0  // Stores the character index in the current line
    // Loops through the entire program once
    while (currentChar < program.length) {
        let c = program[currentChar]
        if (c == '\n') {
            lineNum++
            lineChar = 0
        } else if (c == " ") {
            // Do nothing, spaces don't matter :)
        } else if (c == ',') {
            tokens.push({
                type: "sep",
                content: ','
            })
        } else if (c == '#') {
            while (program[currentChar++] != "\n" && currentChar < program.length) {}
            currentChar--
            lineNum++
            lineChar = 0
        } else if ("@&".includes(c)) {
            tokens.push({
                type: "mod",
                content: c,
                posInfo: [lineNum + 1, lineNum + 1, lineChar, lineChar]
            })
        } else if ("=+-*/<>".any(c)) {
            let fullNam = c
            c = program[++currentChar]
            lineChar++
            while ("=+-*/<>".any(c)) {
                fullNam += c
                c = program[++currentChar]
                lineChar++
            }
            currentChar--
            lineChar--
            tokens.push({
                type: "opr",
                content: fullNam,
                posInfo: [lineNum + 1, lineNum + 1, lineChar, lineChar]
            })
        } else if ("()[]{}".any(c)) {
            let types = { '(': "opar", ')': "cpar",
                          '[': "oarr", ']': "carr",
                          '{': "oblk", '}': "cblk" }
            tokens.push({
                type: types[c],
                content: c,
                posInfo: [lineNum + 1, lineNum + 1, lineChar, lineChar]
            })
        } else if ("0123456789.".any(c)) {
            let fullNum = c
            let start = lineChar
            c = program[++currentChar]
            lineChar++
            while ("0123456789.".any(c)) {
                fullNum += c
                c = program[++currentChar]
                lineChar++
            }
            currentChar--
            lineChar--
            if (fullNum == ".") {
                tokens.push({
                    type: "opr",
                    content: ".",
                    posInfo: [lineNum + 1, start, lineChar]
                })
            } else {
                tokens.push({
                    type: "num",
                    content: fullNum,
                    posInfo: [lineNum + 1, lineNum + 1, start, lineChar]
                })
            }
        } else if (c == '"') {
            let fullString = ""
            let start = lineChar
            c = program[++currentChar]
            lineChar++
            while (c != '"') {
                fullString += c
                c = program[++currentChar]
                lineChar++
                if (currentChar >= program.length) {
                    error("String not closed!")
                }
                if (program[currentChar - 1] == '\\') {
                    fullString = fullString.slice(0, -1)
                    if (c == 'n') c = "\\n"
                    fullString += c
                    c = program[++currentChar]
                    lineChar++
                }
            }
            tokens.push({
                type: "str",
                content: fullString,
                posInfo: [lineNum + 1, lineNum + 1, start, lineChar]
            })
        } else if ("qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_".any(c)) {
            let fullNam = c
            let start = lineChar
            c = program[++currentChar]
            lineChar++
            while ("qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789_".any(c)) {
                fullNam += c
                c = program[++currentChar]
                lineChar++
            }
            currentChar--
            lineChar--
            if (varTypes.includes(fullNam)) {
                tokens.push({
                    type: fullNam + "Type",
                    content: fullNam,
                    posInfo: [lineNum + 1, lineNum + 1, start, lineChar]
                })
            } else {
                tokens.push({
                    type: "nam",
                    content: fullNam,
                    posInfo: [lineNum + 1, lineNum + 1, start, lineChar]
                })
            }
        } else {
            error(`Character not recognized: \`${c}\``, {
                posInfo: [lineNum + 1, lineNum + 1, lineChar, lineChar]
            })
        }
        currentChar++
        lineChar++
    }
    return tokens
}

// Turns the 1d stream of tokens into an AST (abstract syntax tree)
function parse(tokens) {
    // The start of the AST, the Program node
    let ast = {
        type: "Program",
        content: []
    }
    let c = 0
    
    // This is a recursive function
    function walk(idx) {
        let token = tokens[c]
        if (["num", "str", "nam", "opr", 
            ...formattedVarTypes].includes(token.type)) {
            c++
            return token
        }
        if (token.type == "oarr") {
            let node = {type: "arr", content: [], posInfo: [
                token.posInfo[0], -1, token.posInfo[2], -1]}
            c++
            token = walk()
            while (token.type != "carr") {
                if (node.content.length == 0) node.content.push([])
                if (token.type != "sep") {
                    node.content[node.content.length - 1].push(token)
                } else {
                    node.content.push([])
                }
                token = walk()
            }
            node.posInfo[1] = token.posInfo[1]
            node.posInfo[3] = token.posInfo[3]
            return node
        }
        if (token.type == "opar") {
            let node = {type: "paren", content: []}
            c++
            token = walk()
            while (token.type != "cpar") {
                if (node.content.length == 0) node.content.push([])
                if (token.type != "sep") {
                    node.content[node.content.length - 1].push(token)
                } else {
                    node.content.push([])
                }
                token = walk()
            }
            return node
        }
        if (token.type == "oblk") {
            let node = {type: "block", content: []}
            c++
            token = walk()
            while (token.type != "cblk") {
                node.content.push(token)
                token = walk()
            }
            return node
        }
        if (["carr", "cpar", "cblk", "sep"].includes(token.type)) {
            c++
            return {type: token.type, posInfo: token.posInfo}
        }
        if (token.type == "mod") {
            c++
            return {
                type: token.type, 
                content: token.content,
                posInfo: token.posInfo
            }
        }
        error(`Unknown token: ${token.type} \`${token.content}\``, token)
    }

    // Call walk recursively on all the tokens in the program
    while (c < tokens.length) {
        ast.content.push(walk(ast.content.length))
    }
    return ast
}

// This modifies the AST and does three things:
//  - Turns a `name` token next to a `parentheses` token into a `call`
//  - Pushes class names into the `varTypes` array to be classified later
//  - Looks through parentheses, arrays, and blocks recursively
function modify(ast) {
    let modified = ast.content
    let c = 0
    while (c < modified.length) {
        let p = modified[c++]
        if (["paren", "arr"].includes(p.type)) {
            p.content = p.content.map(e => modify({content: e}).content)
        } else if (p.type == "block") {
            p = modify(p)
        } else if (p.type == "ctrl") {
            p.arguments = p.arguments.map(e => modify({content: e}).content)
        } else if (p.type == "nam") {
            if (c >= modified.length) continue
            if (modified[c].type == "paren") {
                p.type = "call"
                for (let a = 0; a < modified[c].content.length; a++) {
                    modified[c].content[a] = modify({content: modified[c].content[a]}).content
                }
                p.arguments = modified[c].content
                if (controlFlow.includes(p.content)) {
                    p.type = "ctrl"
                }
                modified.splice(c, 1)
            }
        } else if (p.type == "clsType") {
            if (c + 1 > modified.length) error(`Expected something after \`cls\``, p)
            if (c + 2 > modified.length) error(
                `Expected something after \`${modified[c].content}\``, modified[c])
            let addVarType = modified[c].content

            classNames.push(addVarType)
            varTypes.push(addVarType)
            formattedVarTypes.push(addVarType)

            if (conf.classNamesAsVarTypes !== undefined && conf.classNamesAsVarTypes !== false) {
                ctaTypesToLangTypes[addVarType] = conf.classNamesAsVarTypes
            } else {
                ctaTypesToLangTypes[addVarType] = addVarType
            }
            console.log(ctaTypesToLangTypes)
            modified[c].isMainClassName = true
        }
    }
    return ast
}

// Similarly to the `modify` step, this also modifies the ast.
// This time, it takes the arguments on either side of
// an operator and groups them into a single node.
function operations(ast) {
    let modified = ast.content
    let c = 0
    while (c < modified.length) {
        let p = modified[c++]
        if (["paren", "arr"].includes(p.type)) {
            p.content = p.content.map(e => operations({content: e}).content)
        } else if (p.type == "block") {
            p = operations(p)
        } else if (p.type == "call") {
            p.arguments = p.arguments.map(e => operations({content: e}).content)
        } else if (p.type == "ctrl") {
            p.arguments = p.arguments.map(e => operations({content: e}).content)
        } else if (p.type == "opr" && p.content == '=') {
            if (c == 1) error(`Unexpected \`=\``, p)
            if (modified[c - 2].type == "opr") {
                modified[c - 2].content += '='
                modified.splice(c - 1, 1)
            }
        } else if (p.type == "opr" && ["++", "--"].includes(p.content)) {
            if (c == 1) error(`Expected something before \`${p.content}\``, p)
            if (modified[c - 2].type != "nam")
                error(`Unexpected ${fullTokenNames[modified[c - 2].type]
                    } before \`${p.content}\``, 
                modified[c - 2])
            modified[c - 1].content = p.content[0] + "="
            modified.splice(c, 0, {type: "num", content: '1'})
        } else if (p.type == "opr") {
            if (p.name != undefined) continue
            if (c == 1) error(`Expected something before \`${p.content}\``, p)
            if (c == modified.length)
                error(`Expected something after \`${p.content}\``, p)
            if (["++", "--", "+=", "-=", "*=", "/="].includes(p.content)) continue
            if (modified[c - 2].type.includes("Type"))
                error(`\`${modified[c - 2].content }\` isn't a value`, modified[c - 2])
            if (modified[c].type.includes("Type")) error(`\`${modified[c].content
                }\` isn't a value`, modified[c])
            if (["paren", "arr"].includes(modified[c].type)) {
                modified[c].content = modified[c].content.map(e =>
                    operations({content: e}).content)
            } else {
                modified[c] = operations(modified[c])
            }
            modified.splice(c - 2, 0, {
                type: "opr",
                name: p.content,
                arguments: [
                    modified[c - 2],
                    modified[c]
                ]
            })
            modified.splice(--c, 3)
        } else if (p.type == "nam"
            && varTypes.includes(p.content)
            && !p.isMainClassName) {
            p.type = p.content
        }
    }
    return ast
}

// Again, similar to the `modify` step
// This turns a `name` next to an `equals` sign into a variable declaration.
// It also deals with commas? (why does it do that??)
function variables(ast) {
    let declaredVars = ast.content
    let c = 0
    while (c < declaredVars.length) {
        let p = declaredVars[c++]
        if (["paren", "arr"].includes(p.type)) {
            p.content = p.content.map(e => variables({
                content: e, type: p.type}).content)
        } else if (p.type == "block") {
            p = variables(p)
        } else if (p.type == "call") {
            p.arguments = p.arguments.map(e => variables({content: e}).content)
        } else if (p.type == "ctrl") {
            p.arguments = p.arguments.map(e => variables({content: e}).content)
        } else if (formattedVarTypes.includes(p.type)) {
            if (["paren", "arr"].includes(ast.type))
                error(`Declaration inside of a container`)
            if (c >= declaredVars.length)
                error(`Expected something after \`${p.type.replace("Type","")}\``, p)
            if (declaredVars[c].type == "call") {
                p.content = {
                    type: p.type,
                    name: declaredVars[c].content,
                    arguments: declaredVars[c].arguments.map(e => 
                        variables({content: e}).content)
                }
                checkVarName(p.content.name, "function", declaredVars[c])
                p.type = "function"
                declaredVars.splice(c, 1)
                continue
            } else if (declaredVars[c].type == "mod") {
                p.array = true
                declaredVars.splice(c, 1)
            } else if (declaredVars[c].type != "nam") {
                error(`Expected variable name after \`${p.content}\`, got \`${
                    declaredVars[c].type}\``)
            }
            // Declaration
            if (c >= declaredVars.length) error(`Expected variable name after \`${
                p.content}\``)
            if (c > declaredVars.length - 2 || declaredVars[c + 1].content != '=') {
                p.content = {
                    type: p.type,
                    name: declaredVars[c].content,
                    // content: [ defaultContent[p.type.replace("Type",'')] ]
                }
                p.type = "declare"
                declaredVars.splice(c, 1)
            } else {
                p.content = {
                    type: p.type,
                    name: declaredVars[c].content,
                    content: [ declaredVars[c + 2] ]
                }
                p.type = "declare"
                declaredVars.splice(c, 3)
            }
            checkVarName(p.content.name, "variable")
        } else if (p.type == "nam") {
            if (c >= declaredVars.length) continue
            if (declaredVars[c].type == "sep")
                error(`Misplaced separator, the comma doesn't do anything here.`)
            if (declaredVars[c].type.includes("Type"))
                error(`No idea what this means. Try swapping \`${
                p.content}\` and \`${declaredVars[c].type.replace("Type","")}\``)
            if (declaredVars[c].type != "opr")
                error(`No idea what this means.`, declaredVars[c])
            if (c >= declaredVars.length - 1)
                error(`Expected something after \`${declaredVars[c].content}\``)
            checkVarName(p.content, "variable", p)
            p.content = {
                type: declaredVars[c].content,
                name: p.content,
                content: [ declaredVars[c + 1] ]
            }
            p.type = "modify"
            declaredVars.splice(c, 2)
        }
    }
    return ast
}

// ... `modify` ...
// This uses the `controlFlow` array and groups all of the matching nodes.
// It also deals with classes on a really basic level.
function control(ast) {
    let modified = ast.content
    let c = 0
    while (c < modified.length) {
        let p = modified[c++]
        if (["paren", "arr"].includes(p.type)) {
            p.content = p.content.map(e => control({content: e}).content)
        } else if (p.type == "block") {
            p.isClassChild = true
            p = control(p)
        } else if (p.type == "call") {
            if (ast.isClassChild) {
                p.type = "function"
                p.content = {
                    type: "ccf",
                    name: p.content,
                    arguments: p.arguments
                }
                c -= 1
                //console.log(p)
            } else {
                p.arguments = p.arguments.map(e => control({content: e}).content)
            }
        } else if (p.type == "declare") {
            if (p.content.type == "clsType") {
                let type = modified[c].type
                if (type == "block") {
                    modified[c].isClassChild = true
                    control(modified[c])
                    p.content.content = modified[c].content
                    modified.splice(c, 1)
                } else {
                    error(`Found ${fullTokenNames[type]} after class declaration.`, 
                        modified[c])
                }
                p.name = p.content.name
                p.type = "class"
                p.content = p.content.content
                //console.log(p)
            } else if (p.content.content) {
                p.content.content = p.content.content.map(e => control({
                    content: e
                        }).content)
            }
        } else if (p.type == "ctrl") {
            p.arguments = p.arguments.map(e => control({content: e}).content)
            p.name = p.content
            if (modified[c].type == "block") {
                p.content = control(modified[c]).content
            } else {
                p.content = [ modified[c] ]
            }
            modified.splice(c, 1)
        } else if (p.type == "function") {
            //console.log(p)
            let type = modified[c].type
            if (type == "block") {
                control(modified[c])
                p.content.content = modified[c].content
                modified.splice(c, 1)
            } else if (type == "call") {
                p.content.content = [ modified[c] ]
                modified.splice(c, 1)
            } else {
                // Missing `opr` type
                error(`Unknown branch type \`${type}\``)
            }
        } else if (formattedVarTypes.includes(p.type)) {
            p.type = "nam"
        }
    }
    return ast
}

// This makes sure you can't write `"hello" "world"` without
// a separator, an operator, or some other token in-between.
// It throws an error for adjacent nodes (not tokens) that
// shouldn't be adjacent to one another.
function adjacentTokens(ast) {
    let check = ast.content
    let c = 0
    while (c < check.length) {
        let p = check[c++]
        if (["paren", "arr"].includes(p.type)) {
            if (p.type == "paren" && p.content.length > 1) error(
                `Misplaced separator, the comma doesn't do anything here`)
            p.content.map(e => adjacentTokens({content: e}).content)
        } else if (p.type == "block") {
            adjacentTokens(p)
        } else if (p.type == "call") {
            p.arguments.map(e => adjacentTokens({content: e}).content)
        } else if (p.type == "declare") {
            if (p.content.content)
                adjacentTokens({content: p.content.content})
        } else if (p.type == "modify") {
            adjacentTokens({content: p.content.content})
        } else if (p.type == "ctrl") {
            p.arguments.map(e => adjacentTokens({
                    type: "paren", content: e
                }).content)
            adjacentTokens(p)
        } else if (p.type == "opr") {
            adjacentTokens({type: "opr", content: p.arguments})
        } else if (p.type == "function") {
            adjacentTokens({type: "function", content: p.content.content})
        }
        
        if (c <= check.length - 1) {
            let goodTypes = [
                "declare",
                "call",
                "modify",
                "ctrl"
            ]
            let doErr = false
            if (["opr", "function", "block", "Program"].includes(ast.type)) {
                continue
            } else {
                if (!goodTypes.includes(p.type)) doErr = true
                if (!goodTypes.includes(check[c].type)) doErr = true
            }
            if (!doErr) {
                if (goodTypes.includes(p.type)) continue
                if (goodTypes.includes(check[c].type)) continue
                if (p.type == check[c].type) error(`Two ${fullTokenNames[p.type]
                    }s can't be next to each other here.`)
            }
            error(`Found \`${fullTokenNames[p.type]}\` next to \`${
                fullTokenNames[check[c].type]
                }\`. Try moving one of them somewhere else.`)
        }
    }
    return ast
}

// This gives every node a `path` property, which is used for variable type checking.
function pathGen(ast, path="") {
    for (let b in ast) {
        if (typeof ast[b] != "string") {
            if (!Array.isArray(ast[b])) ast[b].path = path + "." + b
            pathGen(ast[b], path + "." + b)
        }
    }
    return ast
}

// The most important function!
// This generates the C++ code using the provided AST.
// If a new language needs to be implemented, this is
// what's most likely to be changed and/or completely reworked.
function generate(node, parentType="", parentName="") {
    let code = ""

    if (Array.isArray(node))
        return node.map((e) => generate(e, parentType)).join(" ")

    switch (node.type) {
        case "Program":
            return node.content.map(e => generate(e, "Program")).map(addSemicolon)
                .join("\n")
        case "block":
            return conf.separator[0] + "\n" + node.content
                .map(generate)
                .map(addSemicolon)
                .join("\n") + "\n" + conf.separator[1]
        case "call":
            let callName = node.content
            if (callName in stats) callName = stats[callName]
            if (node.content == "print" && node.arguments.length > 1) {
                let ret = node.arguments.map(e => `${callName}(${generate(e)})`)
                return `(${ret.join(` + `)})`
            }
            let callPrefix = ""
            if (classNames.includes(callName) && conf.newClassPrefix) callPrefix = "new "
            return callPrefix + callName + "("
                + node.arguments.map(generate).join(", ")
                + ")"
        case "function":
            //console.log(node.content.arguments[0])
            let args = node.content.arguments
                .map((e) => generate(e, "function")).join(", ")
            if (conf.classFirstArgument && parentType == "class")
                args = conf.classFirstArgument + (args.length != 0 ? ", " : "") + args
            let code = node.content.content.map(generate).map(addSemicolon)
            let type = node.content.type.replace("Type", '')
            if (!["def", "ccf"].includes(type)) {
                if (["ctrl"].includes(node.content.content.slice(-1)[0].type)) {
                    code.push("return;")
                } else {
                    code[code.length - 1] = `return ${code[code.length - 1]}`
                }
            }
            if (type == "ccf") {
                if (conf.constructor != "{name}")
                    node.content.name = conf.constructor
            }
            if (conf.funcType[0] && ctaTypesToLangTypes[type].length != 0)
                type = conf.funcType[1]
            if (conf.constructorFuncName) type = conf.funcType[1]
            let finalFuncCode = `${node.content.name}(${args})${conf.separator[0]}\n`
            finalFuncCode += code.join('\n')
            finalFuncCode += `\n${conf.separator[1]}\n`
            if (conf.useFuncTypeInClass)
                finalFuncCode = ctaTypesToLangTypes[type] + (ctaTypesToLangTypes[type].length == 0 ? "" : " ") + finalFuncCode
            if (parentType == "class") {
                return finalFuncCode
            } else {
                functions += finalFuncCode
                return `${conf.commentType} function \`${node.content.name}\``
            }
        case "class":
            let classCode = node.content
                .map(e => generate(e, "class", node.name))
                .map(addSemicolon)
                .map(e => e.split("\n").join("\n"))
            classes += `class ${node.name}${conf.separator[0]}\n`
                + conf.classCodeStart.replace(/\{name\}/g, node.name) + " \n"
                + classCode.join('\n')
                + `\n${conf.separator[1]};\n`
            return conf.commentType + ` class \`${node.name}\``
        case "ctrl":
            if (node.name == "for") {
                let args = node.arguments.map(generate)
                if (args.length == 1) {
                    error(`Expected at least two arguments for \`for\``)
                } else {
                    let nam = node.arguments[0][0]
                    if (nam.type == "nam") nam = nam.content
                    if (nam.type == "modify") nam = nam.content.name
                    if (nam.type == "declare") nam = nam.content.name
                    if (args.length == 2) {
                        args = [
                            args[0],
                            args[1],
                            nam + " += 1"
                        ]
                    } else if (args.length == 3) {
                        args = [
                            args[0],
                            args[1],
                            nam + " += " + args[2]
                        ]
                    }
                }
                return node.name + " ("
                    + args.join("; ") + ") {\n"
                    + node.content.map(generate).map(addSemicolon).join("\n")
                    + "\n}"
            } else if (node.arguments.length != 1) {
                error(`Didn't expect ${
                    node.arguments.length} arguments for \`${node.name}\``)
            }
            if (node.content == undefined) {
                error("For some reason the if statement didn't get a block? Idk.")
            }
            return node.name + " ("
                + node.arguments.map(generate).join(", ") + ") {\n"
                + node.content.map(generate).map(addSemicolon).join("\n")
                + "\n}"
        case "num":
            return node.content
        case "str":
            if (conf.stringCall.length == 0) {
                return '"' + node.content + '"'
            }
            return conf.stringCall + '("' + node.content + '")'
        case "opr":
            if (node.name == '.') {
                let varName = generate(node.arguments[0])
                let fnCall = generate(node.arguments[1])
                return `${varName}.${fnCall}`
            } else {
                let var1Name = generate(node.arguments[0])
                let var1IsArr = checkedVariableType == "arr"
                let var2Name = generate(node.arguments[1])
                let var2IsArr = checkedVariableType == "arr"
                return `(${var1Name} ${node.name} ${var2Name})`
            }
        case "arr":
            if (!node.content.every( v => v[0].type === node.content[0][0].type)) {
                error(`Found list with different data types.`, node)
            }
            let inferredType = node.content[0][0].type
            if (inferredType == "str" && lastVariableType != "str") {
                error(`Can't assign variable type \`string\` to type \`${
                    formattedVarTypes[lastVariableType]}\``)
            } else if (inferredType == "num" && lastVariableType == "str") {
                error(`Can't assign variable type \`number\` to type \`string\``)
            }
            let castType = ""
            if (lastVariableType == "int") {
                castType = "(int)"
            }
            return `Array<${ctaTypesToLangTypes[lastVariableType]}>(vector<${
                ctaTypesToLangTypes[lastVariableType]}>{` + node.content.map(
                    e => castType + generate(e)).join(", ") + "})"
        case "paren":
            return `(${node.content.map(generate).join(" ")})`
        case "nam":
            if (![...keyWords].includes(node.content)) {
                let varType = getVarType(fullAst, node.path, node.content)
                if (varType == undefined)
                    error(`Variable \`${node.content}\` not declared`)
                if (varType == "pred") return predefinedVals[node.content].content
                checkedVariableType = varType
            }
            return node.content
        case "declare":
            lastVariableType = node.content.type.replace('Type', '')
            let varType = ctaTypesToLangTypes[lastVariableType]
            if ((!conf.useTypeInFunction) && parentType == "function") varType = ""
            if ((!conf.useTypeInClass) && parentType == "class") varType = ""
            // Yikes, this is some C++ code. Very bad.
            if (node.array) varType = `Array<${varType}>`
            let declaration
            let setting
            declaration = `${varType + (varType.length == 0 ?
                "" : " ")}${node.content.name}`
            if (node.content.content == undefined) {
                setting = undefined
            } else {
                setting = generate(node.content.content)
            }
            if (parentType == "Program") {
                if (conf.classDefault) {
                    variableCode += declaration + " = " + conf.classDefault + ";\n"
                } else {
                    variableCode += declaration + ';\n'
                }
                if (setting != undefined) {
                    return node.content.name + " = " + setting
                } else {
                    return `${conf.commentType} variable \`${node.content.name}\``
                }
            } else {
                if (setting != undefined) {
                    return declaration + " = " + setting
                } else {
                    return declaration
                }
            }
        case "modify":
            return `${node.content.name} ${node.content.type
                } ${generate(node.content.content)}`
        case "sep":
            error(`Why is this comma here?`)
        default:
            error(`Node not recognized: \`${node.type}\``)
    }
    return code
}

// Checks variable names to see if they're valid.
function checkVarName(name, t="variable", node) {
    if (noVarNames.includes(name)) {
        error(`\`${name}\` can't be used as a ${t} name`, node)
    }
}

// Adds a semicolon to a line (but only if it needs it)
function addSemicolon(s) {
    let b = s
    return (b[b.length - 1] == "}" ? s : s + ';')
}

// Indents the resulting code
function indent(code, i) {
    code = code.split("\n")
    for (let a = 0; a < code.length; a++) {
        if (code[a][code[a].length - 1] == ';' ? 
            "}".includes(code[a][code[a].length - 2]) : 
            ")]}".includes(code[a][code[a].length - 1])) i--
        code[a] = "    ".repeat(i) + code[a]
        if (code[a][code[a].length - 1] == ';' ?
            "([{".includes(code[a][code[a].length - 2]) :
            "([{".includes(code[a][code[a].length - 1])) i++
    }
    return code.join("\n")
}

// Gets the path for any AST node.
function getPath(ast, path) {
    path = path.split(".")
    path = path.slice(1)
    path = path.map(e => `["${e}"]`).join("")
    return eval("ast" + path, ast)
}

// Gets a variable by name starting from a path and
// working up the AST. If no variable is found, (which
// happens when a variable wasn't declared, or is out
// of scope) this function returns `undefined`.
function getVar(ast, path, nam) {
    path = path.split(".")
    let checkedForPath = "..."
    let last = path.pop()
    let isNum = !isNaN(parseFloat(last))
    last = isNum ? parseInt(last) : last
    while (path.length > 0) {
        if (last < 0 || !isNum) {
            last = path.pop()
            isNum = !isNaN(parseFloat(last))
        } else {
            let finalPath = path.join(".") + "." + last
            if (path[path.length - 1] == "arguments"
                && getPath(ast, path.join("."))[0].length != undefined) {
                finalPath = path.join(".") + "." + last + ".0"
            }
            let node = getPath(ast, finalPath)
            if (node.type == "declare" && node.content.name == nam) {
                return node
            } else if (((node.type == "ctrl" && ["for"].includes(node.name))
                || node.type == "function") && checkedForPath != node.path) {
                if (node.type == "function" 
                    && node.content.arguments.length == 0) {
                    last--
                    continue
                }
                path.push(last)
                if (node.type == "function") {
                    path.push("content")
                    path.push("arguments")
                    path.push("0")
                    last = node.content.arguments[0].length
                } else {
                    path.push("arguments")
                    path.push("0")
                    last = node.arguments[0].length
                }
                isNum = true
                checkedForPath = node.path
            }
            last--
        }
    }
    return undefined
}

// Gets a variable type (not the node!) from a path and a name.
function getVarType(ast, path, nam) {
    if (Object.keys(predefinedVals).includes(nam)) return "pred"
    let node = getVar(ast, path, getPath(ast, path).content)
    if (node == undefined) return undefined
    if (node.array) return "arr"
    return node.content.type
}

// Checks if a variable is in a class to add the "this." (or
// whatever is in `conf.classVariableReference`) as a prefix.
// This one should stay after `getVarType` gets reworked, as
// it's completely separate to getting the actual variable.
// NOTE: This means `getVar` also needs to stay.
function inClass(ast, path, nam) {
    let node = getVar(ast, path, getPath(ast, path).content)
    if (node == undefined) return undefined
    console.log()
    // unfinished
}

// This should be the actual function used instead of getVarType,
// but since it's not completely necessary I'm leaving it for later. 
// It is really important if I want arrays to work well though.
function getAnyType(val) {
    // yikes 😬
}
