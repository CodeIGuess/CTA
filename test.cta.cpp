#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <vector>
#include <unistd.h>
#include "./headers/utils.h"
#include "./headers/ctasl.h"
using namespace std;

Array<float> a;

int main() {
    a = _div(Array<float>(vector<float>{0, 1, 2}), 2);
    print(a);
    std::cout << '\n';
    return 0;
}
