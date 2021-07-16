#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <vector>
#include <unistd.h>
#include "./headers/utils.h"
#include "./headers/ctasl.h"
using namespace std;

int a;

int main() {
    a = 0;
    a += 1;
    print(a);
    std::cout << '\n';
    return 0;
}
