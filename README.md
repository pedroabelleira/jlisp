# jLisp
A Lisp intepreter implemented in Typescript

- [jLisp](#jlisp)
    - [Why?](#why)
    - [Getting started](#getting-started)
    - [Implementation](#implementation)
    - [What next](#what-next)
        - [Big things](#big-things)
            - [Defmacro](#defmacro)
            - [Object System](#object-system)
        - [Small things](#small-things)

## Why?
This is a project I did just for fun, so don't expect any advanced features or worry about performance, etc.
This is only a tool to teach myself how languages work. 

## Getting started
Make sure you have npm installed on your machine. Then write

```bash
npm run full
```

That will install dependencies, compile the source code, run the tests and, last, run the
(not yet working) REPL.

Of course, you don't want to wait for the installation and compilation each time you change
something, so 'tsc -w' is your friend and then you can use the normal npm commands:

```bash
npm install   # Normally not needed
npm run test  # This runs the tests and is what you execute all the time
npm start     # It runs the REPL, but that doesn't really work yet
```

If you want to also have some fun, at the end of this README.md file, there are some smallish tasks
that would be useful to do.

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
### Big things
#### Defmacro
That's the most important addition: being able to define macros in Lisp itself. It shouldn't be too
hard, but these things are tricky to implement. 

#### Object System
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

This is not very Lispy, but it would be useful to explore the implementation of an object oriented dialect of Lisp
purely implemented in Lisp functions and macros and without any special support by the interpreter itself. As such, it should be possible to load this functionality as an optional package, with something as:

```lisp
(require 'class_system)

;; And now we have classes, etc
```

### Small things
- Add lots of functions for numbers, strings and lists. We need to decide what standard to follow.
One obvious possibility is to take Common Lisp, but change the naming conventions to be more
modern: use '!' and not 'q' as suffix to indicate mutability, use '?' and not 'p' to indicate
boolean functions, use x->y to indicate a function which transforms from x to y in a 
canonical way, etc.
- Add standard List macros, natively if needed and later in Lisp (if defmacro finally works)
- Implement a "compiler" to Javascript. I.e. produce a standalone Javascript program which can
be distributed and would work in any decent runtime (Nashrom). 
- Implement a non trivial Lisp program which runs on the interpreter
- Implement a 'scheme' macro (to be used as (require 'scheme)) which renames the existing
functions and variables to look more like scheme. The objective is to be able to try
scheme snippets without too much change. Of course, since the semantics won't be the same and
most usual functions are missing, this would not help running any non trivial piece of code, but
at least it would allow to copy and paste code from books without too much trouble
- Alternatively, make a macro which renames function and macro calls in the code to
conform to this interpreter names. That would allow the same effect, with less trouble in the
runtime. Of course, ugly things could happen, so this would be a little bit less robust.
- Add &rest support to 'lambda' macro.