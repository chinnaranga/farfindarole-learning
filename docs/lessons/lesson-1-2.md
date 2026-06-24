# Course: React Basics for Beginners
# Module: Module 1 - Getting Started
# Lesson: Understanding JSX Syntax and Dynamic Expressions
# Duration: 30 minutes (reading time)

### Learning Objectives
* Understand how JSX differs from normal HTML templates.
* Inject arbitrary JavaScript expressions into markup.
* Style JSX components securely.

---

### 1. What is JSX?
JSX stands for **JavaScript XML**. It allows you to write HTML-like syntax directly inside your JavaScript file. It is not native browser code; instead, compiler tools like Babel or swc translate JSX code into standard JavaScript objects:

```jsx
// What you write:
const element = <h1 className="title">Hello World</h1>;

// What it compiles to:
const element = React.createElement('h1', { className: 'title' }, 'Hello World');
```

---

### 2. Core Rules of JSX
To write valid JSX, you must follow three essential rules:

#### Rule 1: Return a Single Parent Element
Every component must return a single top-level element. If you have multiple sibling elements, wrap them in a `div` or a React Fragment (`<>` and `</>`):
```jsx
// Invalid:
return (
  <h1>Header</h1>
  <p>Paragraph</p>
);

// Valid:
return (
  <>
    <h1>Header</h1>
    <p>Paragraph</p>
  </>
);
```

#### Rule 2: Close All Tags
In HTML, tags like `<input>` or `<img>` don't require closing tags. In JSX, every tag must be self-closing: `<input />`, `<img />`, `<br />`.

#### Rule 3: Use camelCase for Attributes
Since JSX translates to JavaScript objects, attribute keys must be valid JS object properties.
* Use `className` instead of `class`.
* Use `htmlFor` instead of `for`.
* Use camelCase for event handlers (e.g., `onClick`, `onChange`).

---

### 3. Dynamic JavaScript in JSX
To insert active data inside your elements, wrap it in curly braces `{ }`:

```jsx
function UserCard() {
  const name = "Jane Doe";
  const points = 450;
  
  return (
    <div className="card">
      <h3>User: {name}</h3>
      <p>Score: {points * 2} points</p>
      <p>Member Status: {points > 300 ? "Gold" : "Bronze"}</p>
    </div>
  );
}
```
