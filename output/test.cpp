#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <vector>
#include <unistd.h>
#include "../headers/utils.h"
#include "../headers/ctasl.h"
using namespace std;
class Entity {
    public:
    Entity() {} 
    Entity(int a) {
        (print(string("class input: ")) + print(a));
    }
    int x = 5;
    int y = 3;
    int sum() {
        return (x + y);
    }
};
Entity e;
int main() {
    // class `Entity`;
    e = Entity(0);
    std::cout << '\n';
    return 0;
}