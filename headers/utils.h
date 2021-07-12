#ifndef CONVERSIONS_H
#define CONVERSIONS_H

#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class String {
    public:
        static inline int toint(string a) {
            try {
                return stoi(a);
            } catch (...) {
                return 0;
            }
        }
        static inline string lower(string a) {
            transform(a.begin(), a.end(), a.begin(), [](unsigned char c){ return tolower(c); });
            return a;
        }
        static inline string upper(string a) {
            transform(a.begin(), a.end(), a.begin(), [](unsigned char c){ return toupper(c); });
            return a;
        }
        static inline int len(string a) {
            return a.length();
        }
        static inline string add(string a, string b) {
            return a + "," + b;
        }
};

template <class Type>
class Array {
    public:
        vector<Type> vec;
        Array(vector<Type> i) {
            this->vec = i;
        }
        Array() {}

        string toString() {
            string ret = "[";
            for (int a = 0; a < this->vec.size(); a++) {
                if (a != 0) ret += ", ";
                ret += to_string(this->vec[a]);
                ret.erase(ret.find_last_not_of('0') + 1, string::npos);
                ret.erase(ret.find_last_not_of('.') + 1, string::npos);
            }
            return ret + "]";
        }

        Type operator[](const int& n) {
            return this->vec[n];
        }
        Array& operator+=(const float& rhs) {
            for (int a = 0; a < this->vec.size(); a++) { this->vec[a] += rhs; }
            return *this;
        }
        Array& operator-=(const float& rhs) {
            for (int a = 0; a < this->vec.size(); a++) { this->vec[a] -= rhs; }
            return *this;
        }
        Array& operator*=(const float& rhs) {
            for (int a = 0; a < this->vec.size(); a++) { this->vec[a] *= rhs; }
            return *this;
        }
        Array& operator/=(const float& rhs) {
            for (int a = 0; a < this->vec.size(); a++) { this->vec[a] /= rhs; }
            return *this;
        }
        Array operator+(const float& rhs) {
            Array<Type> ret(this->vec);
            for (int a = 0; a < this->vec.size(); a++) { ret.vec[a] += rhs; } return ret;
        }
        Array operator-(const float& rhs) {
            Array<Type> ret(this->vec);
            for (int a = 0; a < this->vec.size(); a++) { ret.vec[a] -= rhs; } return ret;
        }
        Array operator*(const float& rhs) {
            Array<Type> ret(this->vec);
            for (int a = 0; a < this->vec.size(); a++) { ret.vec[a] *= rhs; } return ret;
        }
        Array operator/(const float& rhs) {
            Array<Type> ret(this->vec);
            for (int a = 0; a < this->vec.size(); a++) { ret.vec[a] /= rhs; } return ret;
        }

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
        template <class T>
        static inline int len(vector<T> i) {
            return i.size();
        }
};

#endif