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
    def sum(): #{
        return (x + y);
    #}
#};
e = None;
print("Started!\n");
# class `Entity`;
e = Entity(10);
print("Ended.\n");
_print();