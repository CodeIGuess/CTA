#ifndef CONVERSIONS_H
#define CONVERSIONS_H

#include <string>
#include <vector>
#include <algorithm>

using namespace std;

template <class Type>
class Array {
    public:
        vector<Type> vec;
        Array(vector<Type> i) {
            this->vec = i;
        }
        Array() {}

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
        // template <class T>
        // static inline int len(vector<T> i) {
        //     return i.size();
        // }
};

#endif