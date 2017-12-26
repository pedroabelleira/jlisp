(define command "")

(defn replw (p)
    (while true
        (begin
            (set! command (read p))
            (if (= command "exit") (break))
            (print (eval (read-string command))))))

(defn replr (p)
    (begin
        (define command (read p))
        (if (!= command "exit") 
            (begin
                (print (eval (read-string command)))
                (replr p)))))

(print "")
(print "Basic Lisp REPL.")
(print "Type Lisp code to be evaluated. To leave type 'exit'")
(print "")
(replr ">> ")
(print "Exiting...")
