_print = print
def print(a):
    _print(str(a),end='')
    return str(a)
class Entity: #{
    def __init__(self, a): #{
        (print("class input: ") + print(a) + print("\n"));
    #}
    x = 5;
    y = 3;
    def sum(self): #{
        return (x + y);
    #}
#};
e = None;
# class `Entity`;
e = Entity(10);
(print(e.sum()) + print("\n"));
_print();