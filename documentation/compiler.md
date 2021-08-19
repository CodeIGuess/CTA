
# How everything works!

The horrors I faced while trying to make this compiler work.

CTA has an ongoing theme to it: it can only be as powerful as the weakest language it can compile to.

Does that mean making things completely impractical just because I want to support some other language, like JavaScript?

***Yes.***

# Why doesn't method overloading work?

Method overloading is only a feature in certain languages. So C++ has method overloading, but JavaScript just passes different parameters to the same functions.

CTA needs to cater to _both_ of these languages.

So here's the (slightly impractical) solution: don't allow either of these. Method overloading isn't a thing, variable parameters don't work. This is extremely inconvenient, but just shows off how impractical things have to be when you're compiling to different languages.

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

But this works _wonders_ for the generated code! It lets me put off reworking the way indentation works for a good while.

Yes, eventually I'll need to rework it. This little 'workaround' increases the size of the output file quite a bit.

# Versions

The versioning system was a _treat_ to work with. I desperately needed a way to increment versions since my only mark for changing the version was every time I did a commit. It's just a file that stores a single integer number (as text, nothing fancy) which is incremented every time the compiler is ran. It sounds weird, but it really works.

This uses a pretty simple versioning paradigmn:
```
  (Major) . (Minor) . (Build)
    1.4.40
```

# Inspirations

This language (and most, if not all of its features) is heavily inspired by [Processing](https://processing.org). When I have an idea I want to prototype, I just jump on to the Processing IDE and can get something that just _works_ in a few minutes. 

I admit, Processing isn't the best for many things. It exceeds at image processing, making video filters, and just any general graphics thing. Even while making this language I still come back to Processing for small things I want to test.

My main "issue" with Processing is that it struggles to run on low-end machines. I tried to run a sketch on a Raspberry Pi once and, while it ran at a steady 60 fps on my computer, it ran at a few seconds per frame on the rpi.

It's undeniably slow, but it has just about everything you could need to prototype something quickly, and I love it.
