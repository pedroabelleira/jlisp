(defn replr (prompt)
    (begin
    (set! command (read prompt))
    (if (!= command "exit") 
        (begin
        (try 
            (print (eval (read-string command)))
            (print (concat "Error evaluating expression => '" __exception__ "'"))
        )
        (replr prompt)))))

(print "")
(print "Basic Lisp REPL.")
(print "Type Lisp code to be evaluated. To leave type 'exit'")
(print "")
(replr ">> ")
(print "Exiting...")
