;;(defn replw (prompt)
;;    (while true
;;        (begin
;;        (set! command (read prompt))
;;        (if (= command "exit") (break))
;;        (print (eval (read-string command))))))

(defn replr (prompt)
    (begin
    (set! command (read prompt))
    (if (!= command "exit") 
        (begin
        (print (eval (read-string command)))
        (replr prompt)))))

(print "")
(print "Basic Lisp REPL.")
(print "Type Lisp code to be evaluated. To leave type 'exit'")
(print "")
(replr ">> ")
(print "Exiting...")
