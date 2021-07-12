#ifndef RANDOM_H
#define RANDOM_H

#include <string>
#include <vector>
#include <iostream>

using namespace std;

string print(string i       ) { cout << i; return i; }
float  print(float i        ) { cout << i; return i; }
template <class T>
string print(Array<T> i        ) { string r = i.toString(); cout << r; return r; }

string input(string i) { cout << i; string _retstr; getline(cin, _retstr); return _retstr; }

float  _sum(float a , float b ) { return a + b; }
string _sum(string a, float b ) { return to_string(b) + a; }
string _sum(float a , string b) { return to_string(a) + b; }
string _sum(string a, string b) { return a + b; }
template <class T>
Array<T> _sum(Array<T> a, float b) { return a + b; }

float  _sub(float a , float b ) { return a - b; }
template <class T>
Array<T> _sub(Array<T> a, float b) { return a - b; }

float  _mul(float a , float b ) { return a * b; }
string _mul(string a, int b   ) { string r = ""; for (int c = 0; c < b; c++) { r += a; } return r; }
template <class T>
Array<T> _mul(Array<T> a, float b) { return a * b; }

float    _div(float a   , float b) { return a / b; }
template <class T>
Array<T> _div(Array<T> a, float b) { return a / b; }

int _eql(float a , float b ) { return a == b; }
int _eql(string a, string b) { return a == b; }

int _lss(float a , float b ) { return a < b; }
int _lss(string a, string b) { return a.length() < b.length(); }

int _leq(float a , float b ) { return a <= b; }
int _meq(float a , float b ) { return a >= b; }

int _mrr(float a , float b ) { return a > b; }
int _mrr(string a, string b) { return a.length() > b.length(); }

void sleep(int milliseconds) { cout << flush; usleep(milliseconds * 1000); }

;
#endif