#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>
#include <vector>
#include <unistd.h>
#include "./headers/utils.h"
#include "./headers/ctasl.h"
using namespace std;

class _DotFns_ {
    public:
        // String
        static int toInt(string a) {
            try {
                return stoi(a);
            } catch (...) {
                return 0;
            }
        }
        static string lower(string a) {
            transform(a.begin(), a.end(), a.begin(), [](unsigned char c){ return tolower(c); });
            return a;
        }
        static string upper(string a) {
            transform(a.begin(), a.end(), a.begin(), [](unsigned char c){ return toupper(c); });
            return a;
        }
        static int len(string a) {
            return a.length();
        }
        static string add(string a, string b) {
            return a + "," + b;
        }

        // Array
        template <class T>
        static inline string toString(vector<T> i) {
            string ret = "[";
            for (int a = 0; a < i.size(); a++) {
                if (a != 0) ret += ", ";
                ret += to_string(i[a]);
            }
            return ret + "]";
        }
        static inline string toString(vector<string> i) {
            string ret = "[\"";
            for (int a = 0; a < i.size(); a++) {
                if (a != 0) ret += "\", \"";
                ret += i[a];
            }
            return ret + "\"]";
        }

        // Extras
};

class Entity {
    public:
        Entity(int a) {
            print(a);
        }
        ;
        int x = 5;
        int y = 3;
};

Entity e;

int main() {
    // class `Entity`;
    e = Entity(10);
    std::cout << '\n';
    return 0;
}
