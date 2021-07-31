let _innerConsoleLog = ''
function print(a) {
    a = a.toString().split('\n')
    a[0] = _innerConsoleLog + a[0]
    while (a.length > 1) console.log(a.shift())
    _innerConsoleLog = a[0]
}

function fib(number) {
    let n1 = 0;
    let n2 = 1;
    let nextTerm;
    print("\nFibonacci: \n");
    for (let a = 0; (a < number); a += 1) {
        (print(n1) + print(" "));
        nextTerm = (n1 + n2);
        n1 = n2;
        n2 = nextTerm;
    }
    return;
}
// function `fib`;
fib(10);
console.log(_innerConsoleLog);