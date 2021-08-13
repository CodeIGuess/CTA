let _innerConsoleLog = ''
function print(a) {
    a = a.toString().split('\n')
    a[0] = _innerConsoleLog + a[0]
    while (a.length > 1) console.log(a.shift())
    _innerConsoleLog = a[0]
}
if (1) {
    print("If!");
}
else if (1) {
    print("Else if!");
}
else {
    print("Else!");
}
console.log(_innerConsoleLog);