let _innerConsoleLog = ''
function print(a) {
    a = a.toString().split('\n')
    a[0] = _innerConsoleLog + a[0]
    while (a.length > 1) console.log(a.shift())
    _innerConsoleLog = a[0]
}
class Entity {
    constructor(a) {
        (print("class input: ") + print(a) + print("\n"));
    }
    x = 5;
    y = 3;
    sum() {
        return (x + y);
    }
};
let e;
// class `Entity`;
e = new Entity(10);
(print(e.sum()) + print("\n"));
console.log(_innerConsoleLog);