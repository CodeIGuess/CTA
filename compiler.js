// Can't do `use-strict` because error-handling uses `caller`.

// Idk why this is saved here
// /opt/homebrew/Cellar/glfw/3.3.4

// Use this to copy extension to VSCode
// cp -r extension/cta ~/.vscode/extensions

let vNum = "1.3.999"

let varTypes = ["int", "str", "flt", "dbl", "def", "cls"]
let formattedVarTypes = varTypes.map(e => e + "Type")

let keyWords = ["return", "break", "continue", "class", "this"]

let predefinedVals = {
    "true": { type: 'num', content: '1'},
    "false": { type: 'num', content: '0'}
}

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

let lTypesToCTypes = {
    "int": "int",
    "str": "string",
    "flt": "float",
    "dbl": "double",
    "def": "void",
    "cls": "class",
    "ccf": ""
}

let stats = {
    "print": "print",
    "input": "input"
}

// Currently unused, but should eventually be used.
// C++'s default content depends on the variable type, but 
// other languages (like JavaScript or python) just default
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

let operationFunctions = {
    "+":  "sum",
    "-":  "sub",
    "*":  "mul",
    "/":  "div",
    "==": "eql",
    "!=": "nql",
    "<": "lss",
    ">": "mrr",
    "<=": "leq",
    "=<": "leq",
    ">=": "meq",
    "=>": "meq"
}

let genCodeLib = 
`#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <vector>
#include <unistd.h>
#include "./headers/utils.h"
#include "./headers/ctasl.h"
using namespace std;
`

let classes = ""
let functions = ""
let variableCode = ""

let genCodeStart = "\nint main() {\n"

let genCodeEnd = `
    std::cout << '\\n';
    return 0;
}\n`

let controlFlow = ["if", "while", "for", "scan"]

let noVarNames = [...varTypes, ...controlFlow, ...Object.keys(stats), ...keyWords]

let lastVariableType = ""
let checkedVariableType = ""
let fullAst
let fullProgram = ""

if (process.argv.length == 2) {
    printUsage()
}

if (process.argv.includes("-v")) {
    console.log("Version:", vNum)
    process.exit(0)
}

const fs = require("fs")
const util = require("util")
const { exec } = require("child_process")
fs.readFile(process.argv[2], "utf8", (err, data) => {
    if (data == undefined) {
        error(`File \`${process.argv[2]}\` not found.`)
    }
    fs.readFile("headers/dotfns.cpp", "utf8", (err, dotfnsfile) => {
        if (data == undefined) {
            error(`Dot functions file not found!`)
        }
        save(compile(data, dotfnsfile), process.argv[2])
    })
})

String.prototype.any = function(c) { return this.includes(c) }

function printUsage() {
    console.error("usage: compiler [file name]")
    process.exit(0)
}

function error(message, node) {
    console.log(`\x1b[31mERROR at ${arguments.callee.caller.name}: ${message}`)
    if (node != undefined) {
        console.log("  Line " + node.posInfo[0] + ":", fullProgram.split("\n")[node.posInfo[0] - 1])
        console.log("        ", " ".repeat(node.posInfo[2]) + "^".repeat((node.posInfo[3] - node.posInfo[2]) + 1))
    } else {
        console.log("  ( No node provided!!! )")
    }
    process.exit(1)
}

process.on('uncaughtException', (err) => {
    console.error(`\x1b[31mThere was an uncaught error!\n `, err)
    process.exit(1)
})

function warn(message) {
    console.log(`\x1b[33m${message}\x1b[0m`)
}

function save(code, name) {
    fs.writeFile(name + ".cpp", code, "utf8", function fileWrite(){
        exec(`g++ -std=c++11 ${name}.cpp ${process.argv.splice(3).join(" ")}`, function compile(err) { // -stdlib=libc++
            if (err) {
                error(err)
            }
        })
    })
}

function compile(program, dotfnsfile) {
    fullProgram = program
    let tokens   = tokenize(program)
    let ast      = parse   (tokens)
    modify        (ast)
    operations    (ast)
    variables     (ast)
    control       (ast)
    adjacentTokens(ast)
    console.log("\n" + util.inspect(ast, false, null, true))
    pathGen       (ast)
    fullAst = ast;
    //getVarType(ast, ".content.0.arguments.0.0.arguments.0")
    let code     = generate(ast)
    code      = indent(code, 1)
    classes = indent(classes, 0)
    variableCode = indent(variableCode, 0)
    functions = indent(functions, 0)

    code = genCodeLib + dotfnsfile.split("// start class")[1] + "\n" + classes + "\n" + variableCode + "\n" + functions + genCodeStart + code + genCodeEnd
    return code.replace(/\n\n\n/g, "\n\n")
}

function tokenize(program) {
    let tokens = []
    let currentChar = 0
    let lineNum = 0
    let lineChar = 0
    while (currentChar < program.length) {
        let c = program[currentChar]
        if (c == '\n') {
            lineNum++
            lineChar = 0
        } else if (c == " ") {

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
            let types = {
                '(': "opar",
                ')': "cpar",
                '[': "oarr",
                ']': "carr",
                '{': "oblk",
                '}': "cblk"
            }
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
            error(`Character not recognized: \`${c}\``, {posInfo: [lineNum + 1, lineNum + 1, lineChar, lineChar]})
        }
        currentChar++
        lineChar++
    }
    return tokens
}

function parse(tokens) {
    let ast = {
        type: "Program",
        content: []
    }
    let c = 0
    function walk(idx) {
        let token = tokens[c]
        if (["num", "str", "nam", "opr", ...formattedVarTypes].includes(token.type)) {
            c++
            return token
        }
        if (token.type == "oarr") {
            let node = {type: "arr", content: [], posInfo: [token.posInfo[0], -1, token.posInfo[2], -1]}
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
    while (c < tokens.length) {
        ast.content.push(walk(ast.content.length))
    }
    return ast
}

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
            if (c + 2 > modified.length) error(`Expected something after \`${modified[c].content}\``, modified[c])
            let addVarType = modified[c].content

            varTypes.push(addVarType)
            formattedVarTypes.push(addVarType)

            lTypesToCTypes[addVarType] = addVarType
            modified[c].isMainClassName = true
        }
    }
    return ast
}

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
            if (modified[c - 2].type != "nam") error(`Unexpected ${fullTokenNames[modified[c - 2].type]} before \`${p.content}\``, modified[c - 2])
            modified[c - 1].content = p.content[0] + "="
            modified.splice(c, 0, {type: "num", content: '1'})
        } else if (p.type == "opr") {
            if (p.name != undefined) continue
            if (c == 1) error(`Expected something before \`${p.content}\``, p)
            if (c == modified.length) error(`Expected something after \`${p.content}\``, p)
            if (["++", "--", "+=", "-=", "*=", "/="].includes(p.content)) continue
            if (modified[c - 2].type.includes("Type")) error(`\`${modified[c - 2].content}\` isn't a value`, modified[c - 2])
            if (modified[c].type.includes("Type")) error(`\`${modified[c].content}\` isn't a value`, modified[c])
            if (["paren", "arr"].includes(modified[c].type)) {
                modified[c].content = modified[c].content.map(e => operations({content: e}).content)
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
        } else if (p.type == "nam" && varTypes.includes(p.content) && !p.isMainClassName) {
            p.type = p.content
        }
    }
    return ast
}

function variables(ast) {
    let declaredVars = ast.content
    let c = 0
    while (c < declaredVars.length) {
        let p = declaredVars[c++]
        if (["paren", "arr"].includes(p.type)) {
            p.content = p.content.map(e => variables({content: e, type: p.type}).content)
        } else if (p.type == "block") {
            p = variables(p)
        } else if (p.type == "call") {
            p.arguments = p.arguments.map(e => variables({content: e}).content)
        } else if (p.type == "ctrl") {
            p.arguments = p.arguments.map(e => variables({content: e}).content)
        } else if (formattedVarTypes.includes(p.type)) {
            if (["paren", "arr"].includes(ast.type)) error(`Declaration inside of a container`)
            if (c >= declaredVars.length) error(`Expected something after \`${p.type.replace("Type","")}\``, p)
            if (declaredVars[c].type == "call") {
                p.content = {
                    type: p.type,
                    name: declaredVars[c].content,
                    arguments: declaredVars[c].arguments.map(e => variables({content: e}).content)
                }
                checkVarName(p.content.name, "function", declaredVars[c])
                p.type = "function"
                declaredVars.splice(c, 1)
                continue
            } else if (declaredVars[c].type == "mod") {
                p.array = true
                declaredVars.splice(c, 1)
            } else if (declaredVars[c].type != "nam") {
                error(`Expected variable name after \`${p.content}\`, got \`${declaredVars[c].type}\``)
            }
            // Declaration
            if (c >= declaredVars.length) error(`Expected variable name after \`${p.content}\``)
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
            if (declaredVars[c].type == "sep") error(`Misplaced separator, the comma doesn't do anything here.`)
            if (declaredVars[c].type.includes("Type")) error(`No idea what this means. Try swapping \`${p.content}\` and \`${declaredVars[c].type.replace("Type","")}\``)
            if (declaredVars[c].type != "opr") error(`No idea what this means.`, declaredVars[c])
            if (c >= declaredVars.length - 1) error(`Expected something after \`${declaredVars[c].content}\``)
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
                    arguments: []
                }
                c -= 1
                console.log(p)
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
                    error(`Found ${fullTokenNames[type]} after class declaration.`, modified[c])
                }
                p.name = p.content.name
                p.type = "class"
                p.content = p.content.content
                // console.log(p)
            } else if (p.content.content) {
                p.content.content = p.content.content.map(e => control({content: e}).content)
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
            console.log(p)
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

function adjacentTokens(ast) {
    let check = ast.content
    let c = 0;
    while (c < check.length) {
        let p = check[c++]
        if (["paren", "arr"].includes(p.type)) {
            if (p.type == "paren" && p.content.length > 1) error(`Misplaced separator, the comma doesn't do anything here`)
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
            p.arguments.map(e => adjacentTokens({type: "paren", content: e}).content)
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
                if (p.type == check[c].type) error(`Two ${fullTokenNames[p.type]}s can't be next to each other here.`)
            }
            error(`Found \`${fullTokenNames[p.type]}\` next to \`${fullTokenNames[check[c].type]}\`. Try moving one of them somewhere else.`)
        }
    }
    return ast
}

function pathGen(ast, path="") {
    for (let b in ast) {
        if (typeof ast[b] != "string") {
            if (!Array.isArray(ast[b])) ast[b].path = path + "." + b
            pathGen(ast[b], path + "." + b)
        }
    }
    return ast
}

function generate(node, parentType="") {
    let code = ""

    if (Array.isArray(node)) {
        return node.map(generate).join(" ")
    }

    switch (node.type) {
        case "Program":
            return node.content.map(e => generate(e, "Program")).map(addSemicolon)
                .join("\n")
        case "block":
            return "{\n" + node.content.map(generate).map(addSemicolon).join("\n") + "\n}"
        case "call":
            if (node.content == stats["print"] && node.arguments.length > 1) {
                let ret = node.arguments.map(e => `${stats["print"]}(${generate(e)})`)
                return ret.join(`; `)
            }
            return node.content + "("
                + node.arguments.map(generate).join(", ")
                + ")"
        case "function":
            let args = node.content.arguments.map(generate).join(", ")
            let code = node.content.content.map(generate).map(addSemicolon)
            let type = node.content.type.replace("Type", '')
            if (!["def", "ccf"].includes(type))
                code[code.length - 1] = `return ${code[code.length - 1]}`
            let finalFuncCode = `${lTypesToCTypes[type] + (lTypesToCTypes[type].length == 0 ? "" : " ")}${node.content.name}(${args}) {\n`
                + code.join('\n')
                + "\n}\n"
            if (parentType == "class") {
                return finalFuncCode
            } else {
                functions += finalFuncCode
                return `// function \`${node.content.name}\``
            }
        case "class":
            let classCode = node.content.map(e => generate(e, "class")).map(addSemicolon)
                .map(e => e.split("\n").join("\n    "))
            classes += `class ${node.name} {\n`
                + "public:\n    "
                + classCode.join('\n    ')
                + "\n};\n"
            return `// class \`${node.name}\``
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
                            nam + "++"
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
                error(`Didn't expect ${node.arguments.length} arguments for \`${node.name}\``)
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
            return 'string("' + node.content + '")'
        case "opr":
            if (node.name == '.') {
                let varName = generate(node.arguments[0])
                let fnCall = generate(node.arguments[1]).split("(")
                return `_DotFns_::${fnCall[0]}(${varName}${fnCall.slice(1).join("(").length > 1 ? ", " : ""}${fnCall.slice(1).join("(")}`
            } else {
                let var1Name = generate(node.arguments[0])
                let var1IsArr = checkedVariableType == "arr"
                let var2Name = generate(node.arguments[1])
                let var2IsArr = checkedVariableType == "arr"
                if (operationFunctions[node.name] == undefined) error(`Unknown operation \`${node.name}\``, node)
                if (var1IsArr || var2IsArr) {
                    return `(${var1Name} ${node.name} ${var2Name})`
                } else {
                    return `_${operationFunctions[node.name]}(${var1Name}, ${var2Name})`
                }
            }
        case "arr": // Needs code here!
            if (!node.content.every( v => v[0].type === node.content[0][0].type)) {
                error(`Found list with different data types.`, node)
            }
            let inferredType = node.content[0][0].type
            if (inferredType == "str" && lastVariableType != "str") {
                error(`Can't assign variable type \`string\` to type \`${formattedVarTypes[lastVariableType]}\``)
            } else if (inferredType == "num" && lastVariableType == "str") {
                error(`Can't assign variable type \`number\` to type \`string\``)
            }
            let castType = ""
            if (lastVariableType == "int") {
                castType = "(int)"
            }
            return `Array<${lTypesToCTypes[lastVariableType]}>(vector<${lTypesToCTypes[lastVariableType]}>{` + node.content.map(e => castType + generate(e)).join(", ") + "})"
        case "paren":
            return `(${node.content.map(generate).join(" ")})`
        case "nam":
            if (![...keyWords].includes(node.content)) {
                let varType = getVarType(fullAst, node.path, node.content)
                if (varType == undefined) error(`Variable \`${node.content}\` not declared`)
                if (varType == "pred") return predefinedVals[node.content].content
                checkedVariableType = varType
            }
            return node.content
        case "declare":
            lastVariableType = node.content.type.replace('Type', '')
            let varType = lTypesToCTypes[lastVariableType]
            if (node.array) {
                varType = `Array<${varType}>`
            }
            let declaration
            let setting
            if (node.content.content == undefined) {
                declaration = `${varType} ${node.content.name}`
                setting = undefined
            } else {
                declaration = `${varType} ${node.content.name}`
                setting = generate(node.content.content)
            }
            if (parentType == "Program") {
                variableCode += declaration + ';\n'
                if (setting != undefined) {
                    return node.content.name + " = " + setting
                } else {
                    return `// variable \`${node.content.name}\``
                }
            } else {
                if (setting != undefined) {
                    return declaration + " = " + setting
                } else {
                    return declaration
                }
            }
        case "modify":
            return `${node.content.name} ${node.content.type} ${generate(node.content.content)}`
        case "sep":
            error(`Why is this comma here?`)
        default:
            error(`Node not recognized: \`${node.type}\``)
    }
    return code
}

function checkVarName(name, t="variable", node) {
    if (noVarNames.includes(name)) {
        error(`\`${name}\` can't be used as a ${t} name`, node)
    }
}

function addSemicolon(s) {
    let b = s
    return (b[b.length - 1] == "}" ? s : s + ';')
}

function indent(code, i) {
    code = code.split("\n")
    for (let a = 0; a < code.length; a++) {
        if (code[a][code[a].length - 1] == ';' ? "}".includes(code[a][code[a].length - 2]) : ")]}".includes(code[a][code[a].length - 1])) i--
        code[a] = "    ".repeat(i) + code[a]
        if (code[a][code[a].length - 1] == ';' ? "([{".includes(code[a][code[a].length - 2]) : "([{".includes(code[a][code[a].length - 1])) i++
    }
    return code.join("\n")
}

function getPath(ast, path) {
    path = path.split(".")
    path = path.slice(1)
    path = path.map(e => `["${e}"]`).join("")
    return eval("ast" + path, ast)
}

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
            if (path[path.length - 1] == "arguments" && getPath(ast, path.join("."))[0].length != undefined) {
                finalPath = path.join(".") + "." + last + ".0"
            }
            let node = getPath(ast, finalPath)
            if (node.type == "declare" && node.content.name == nam) {
                return node
            } else if (((node.type == "ctrl" && ["for"].includes(node.name)) || node.type == "function") && checkedForPath != node.path) {
                if (node.type == "function" && node.content.arguments.length == 0) {
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

function getVarType(ast, path, nam) {
    if (Object.keys(predefinedVals).includes(nam)) return "pred"
    let node = getVar(ast, path, getPath(ast, path).content)
    if (node == undefined) return undefined
    if (node.array) return "arr"
    return node.content.type
}

function getAnyType(val) {
    
}
