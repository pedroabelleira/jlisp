# jlisp
A Lisp intepreter implemented in Typescript

## Why?
This is a project I did just for fun, so don't expect any advance features or worry about performance, etc. This is only a
tool to teach myself how languages work. 

## Getting started
In order to try the code you need to install node and typescript (npm install -g typescript). Once that is done you can compile
the source with 'tsc'. 

Once the compilation finished, go to ./dist/tests and run 'node all_tests.js'. If everything goes well, all the tests should
pass. In order to see what is implemented you can have a look at the test files (./tests).

In ./dist there is a loader program which, by default, reads the file ./program.lisp and tries to interpret it. By default,
the file program.list contains a mini REPL, which is quite broken and useless for the moment. In any case, it could be
used to quickly try some expressions.

## Implementation
The tokenizer and parser are contained in the files ./tokenizer.ts and ./parser.ts. Being Lisp the syntaxless language
that it is, those two components are very trivial.

The interpreter is located in the file ./interpreter. It is very minimalistic. 
It only knows how to load and run macros and intepret existing code. There are no
hardcoded macros of functions inside it, only calls to the macros and functions defined in the ./functions.ts
and ./macros.ts. As such, the interpreter and macro expander is also quite trivial.

The small number of functions already implemented are contained in the file ./functions.ts. There are some
functions implemented as native (Typescript) code and a few more implemented in Lisp itself.

Most of the less trivial code is located in ./macros.ts. There there are the fundamental macros 
'if', 'lambda' (also called 'fn'), 'define', 'defn', 'eval', ... The interpreter simply loads those macros in the
runtime at the start, but they are not special. They can even be replaced by user code by simply defining new
macros with the same names.

The most important macro to implement is the 'defmacro' macro, which would allow macros to be defined in List itself.
That would make possible to reimplement some "native" (Typescript) macros in List and to extend the interpreter
ad infinitum (that's the whole advantage of Lisp).

Note that all the values are strongly typed at runtime. You can check the types of the language in the file ./parser.ts

## What next
If defmacro works, I'd like to implement a simple object system on top of the language. The idea would be to allow
values to have a class and then adding some syntactic shortcuts to make it look more like an object oriented language.

For example

```lisp
(class Person
    "It representa a Person, with a name, a surname and a fullname method"
    (define name "" get set "This property represents the name of the person") ;; Yes, this documentation is redundant
    (define surname "" get "This property represents the surname of the person")
    
    (defconstructor (n s)
        (set! name n)
        (set! surname s))
        
    (defmethod fullname () 
        "Returns the full name of the person, in the form 'name surname'"
        (concat name " " surname)))

(define p (new Person "John" "Smith"))
(print (-> p fullname))  ;; This would print "Bob Smith"
(print (-> p _class)) ;; This would print "Person"
(print (-> p _methods car)) ;; This would print "#Function<xxx>"
(print (-> p _methods car _name)) ;; This would print "(fullname)"
(-> p name set "Bob"))
(print (-> p fullname)) ;; This would print "Bob Smith"
(-> p surname set "Doe")) ;; This would throw an exception
(print (-> p class _doc)) ;; This would print "It representa a Person, with a name, a surname and a fullname method"
(print (-> p fullname _doc)) ;; This would print "Returns the full name of the person, in the form 'name surname'"
```

This is not very Lispy, but it would be usefull to explore the implementation of an object oriented dialect of Lisp
purely implemented in Lisp functions and macros and without any special support by the interpreter itself. As such, it should be possible to load this functionality as an optional package, with something as:

```lisp
(require 'class_system)

;; And now we have classes, etc
```

