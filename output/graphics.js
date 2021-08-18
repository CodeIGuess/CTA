if (typeof window === 'undefined') { window = global }
let _innerConsoleLog = ''
function print(a) {
    if (a == undefined) a = ''
    a = a.toString().split('\n')
    a[0] = _innerConsoleLog + a[0]
    while (a.length > 1) console.log(a.shift())
    _innerConsoleLog = a[0]
}
async function main() {
    import graphics;
}
(async function() { 
    await main()
    console.log(_innerConsoleLog);
})()