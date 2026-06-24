# Quiz for Lesson 1-1: What is React & Why Learn It?

## Question 1 (Multiple Choice)
Which pattern best describes how React manages DOM rendering?
* A) Imperative updates where code specifies every DOM node modification.
* B) A Declarative paradigm comparing Virtual DOM trees using a Diffing/Reconciliation process.
* C) Direct browser compilation of JSX into native web assemblies.
* D) Periodic page reloads connected to client-side routers.

**Correct: B**
* **Why B is correct:** React uses a declarative design: you describe what the UI should look like for a given state, and React manages matching it to the screen via the Virtual DOM reconciliation.
* **Why others are wrong:** 
  * A describes vanilla imperative JavaScript.
  * C is incorrect because browsers cannot execute JSX natively, and it compiles to React.createElement objects, not WebAssembly.
  * D describes server-side multi-page architectures, not React's client-side SPA model.

---

## Question 2 (Multiple Choice)
What is a key security risk when using vanilla DOM manipulation methods like innerHTML?
* A) Cross-Site Scripting (XSS) due to execution of unescaped script fragments.
* B) Clickjacking of frame overlays.
* C) Database connection timeouts.
* D) Loss of browser local storage data.

**Correct: A**
* **Why A is correct:** Directly assigning user input to innerHTML allows execution of malicious `<script>` tags, making it highly vulnerable to Cross-Site Scripting (XSS).
* **Why others are wrong:** 
  * B is mitigated by CSP frame-ancestors headers, not DOM injection.
  * C and D are backend or local data concerns unrelated to client DOM rendering.
