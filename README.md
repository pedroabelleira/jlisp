# jLisp
A Lisp intepreter implemented in Typescript

- [jLisp](#jlisp)
    - [Why?](#why)
    - [Getting started](#getting-started)
    - [Implementation](#implementation)
    - [What next](#what-next)
        - [Big things](#big-things)
            - [Object System](#object-system)
            - [Debugger](#debugger)
            - ["Compiler"](#compiler)
        - [Small things](#small-things)

## Why?
This is a project I did just for fun, so don't expect any advanced features or worry about performance, etc.
It only exists as a tool to teach myself how languages work. 

## Getting started
Make sure you have npm installed on your machine and you cloned this repository. Then write

```bash
npm run full
```

That will install dependencies, compile the source code, run the tests and, last, run the
REPL.

Of course, you don't want to wait for the installation and compilation each time you change
something, so 'tsc -w' is your friend and then you can use the normal npm commands:

```bash
npm install   # Normally only needed the first time
npm run test  # This runs the tests and is what you execute all the time
npm start     # It runs the REPL
```

You can try whatever short pieces of code in the REPL. By now it should be robust enough to
not die when errors occur. In order to try less trivial pieces of code, you can use the
'jlisp.js' program that you can find in the 'dist' folder in order to load and execute files. You can invoke the program like this:

```bash
node jlisp.js my_program.lisp
```

where 'my_program.lisp' is the program you want to try.

If you want to modify some things inside the interpreter itself, at the end of this README.md file there are some smallish tasks
that would be useful to do.

## Implementation
The tokenizer and parser are contained in the files ./tokenizer.ts and ./parser.ts. Being Lisp the syntaxless language
that it is, those two components are quite trivial. The parser has support for quoting, which makes it slightly
less trivial than it should otherwise.

The interpreter is located in the file ./interpreter. It is very minimalistic. 
It only knows how to load and run macros and intepret existing code. There are no
hardcoded macros of functions inside it, only calls to the macros and functions defined in the ./functions.ts
and ./macros.ts. As such, the interpreter and macro expander is also quite trivial.

The small number of functions already implemented are contained in the file ./functions.ts. There are some
functions implemented as native (Typescript) code and a few more implemented in Lisp itself.

Most of the less simple code is located in ./macros.ts. There there are the fundamental macros 
'if', 'lambda' (also called 'fn'), 'define', 'defn', 'eval', ... The interpreter simply loads those macros in the
runtime at the start, but they are not otherwise special. They can even be replaced by user code by simply defining new
macros with the same names.

Note that all the values are strongly typed at runtime. You can check the types of the language in the file ./parser.ts

## What next
### Big things
#### Object System
Once defmacro works, I'd like to implement a simple object system on top of the language. Nothing as fancy as the
object system in Common Lisp, but something simpler. The goal is to explore how much I can implement in
pure Lisp code, without support from the interpreter 
The idea is to allow values to have a class and then add some syntactic shortcuts to make it look more 
like an object oriented language.

For example:

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

#### Debugger
Implementing a basic debugger should not be hard. The idea is to have a special version of the interpreter, which
controls the execution of any instruction checking it against the 'line' property in every of them.

#### "Compiler"
- Implement a "compiler" to Javascript. I.e. produce a standalone Javascript program which can
be distributed and would work in any decent runtime (Nashrom). 

#### Return
- In order to facilitate a more imperative style of programming, implement a 'return' function that
leaves the current function with a given value. The interpreter and block constructions as begin, while, etc.
need to support. Otherwise, have a look at using continuations.

### Small things
- Add the usual functions for numbers, strings and lists. We can take the RxRS standard from Scheme.
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
- Whatever is in the TODO file
