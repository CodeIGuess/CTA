#include <string>
#include <vector>
#include <algorithm>
#include "./headers/utils.h"
using namespace std;

// start class
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

/*

This is a really bad workaround.

It makes custom classes (you know, normal `class` classes
that normal people use in object-oriented programming?)
basically impossible to implement.

The only reason this exists in the first place is because
it's easier to sideload type-checking to G++ instead of
doing it myself in the compiler.

For classes to work properly I need to get rid of this
file and get real, compile-time, CTA type-checking working.

*/
