# Course: React Basics for Beginners
# Module: Module 1 - Getting Started
# Lesson: State Management with the useState Hook
# Duration: 40 minutes (reading time)

### Learning Objectives
* Define React State and compare it with Component Props.
* Initialize and update component state using the `useState` Hook.
* Handle form inputs using controlled components.

---

### 1. What is State?
In React, **State** represents data that changes over time and determines the interactive behavior of the component. While **Props** are read-only configuration variables passed down from parent components, **State** is private and fully controlled by the component itself.

---

### 2. The useState Hook Syntax
To declare state in a functional component, we import and call the `useState` hook:

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

`useState` returns an array with exactly two values:
1. The current state variable (`count`).
2. A setter function to update that variable (`setCount`).

---

### 3. Updating Objects and Arrays in State
When state contains objects or arrays, you must never mutate them directly. Instead, create a new object or array (usually using the spread operator `...`) and pass it to the state updater:

```jsx
const [user, setUser] = useState({ name: 'Alice', age: 25 });

// Incorrect (direct mutation):
user.age = 26; 

// Correct (creates new object copy):
setUser({ ...user, age: 26 });
```
