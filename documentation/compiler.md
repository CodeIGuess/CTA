
# How everything works!

The horrors I faced while trying to make this compiler work.

# Why not object oriented?

Classes are at the center of object oriented programming. This is good in a way that if you know how to program in one object-oriented language, that should translate to others.

This is somewhat correct.

However, every language has a slightly different implementation of classes. With all the different implementations, it's very hard to make code compile to (for example) C++ and _also_ JavaScript classes.

I'm trying to do everything I can to make the language have classes, but if everything goes wrong, it'll still have structures (which are similar to classes).

## Python Indentation?

First off, what is a code block? In C++, A code block is any chunk of code wrapped in curly brackets (`{}`). This is the same across C, JavaScript, C#, Java, C++, Go, and most other _normal_ languages. _But for some reason,_ code blocks in Python are defined by their indentation. This means that instead of writing code like this:

```py
if (var == true) {
    print("The condition is true!")
}
```
Python prefers code written like _this_:
```py
if var == true:
    print("The condition is true!")
```
This makes things a pain, mostly because (as it works right now) CTA indents the code _after_ it's been generated, using curly brackets, parentheses, and square brackets. I was thinking I'd have to rework the intentation system soon!

But with a little research, I found [this](https://www.python.org/doc/humor/#python-block-delimited-notation-parsing-explained) article of Python humor. It describes how nobody noticed that Python added curly brackets as an alternate way to delimit code blocks!

Here is the code they provided...
```py
if var == true: # {
    print("The condition is true!")
# }
```
Yes, it's bad practice to do this, you (the programmer) should just get used to how Python syntax works.

But this works _wonders_ with my code! It lets me put off reworking the way indentation works for a good while :)

Yes, eventually I'll need to rework it. This little 'workaround' increases the size of the output file quite a bit.
