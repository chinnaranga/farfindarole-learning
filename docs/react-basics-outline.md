# React Basics for Beginners Course Outline

* **Duration:** 20 Hours
* **Target Audience:** College students with core JavaScript knowledge (ES6)
* **Difficulty:** Beginner
* **Goal:** Build modular, interactive, and performant web interfaces with React

---

## Module 1: Getting Started with React (3 Hours)

### Lesson 1.1: What is React & Why Learn It?
* **Duration:** 20 minutes (reading)
* **Key Concepts:**
  * Client-side vs. Server-side rendering paradigms.
  * Virtual DOM vs. Real DOM.
  * Declarative vs. Imperative programming.
  * Component-driven architecture.

### Lesson 1.2: Modern Frontend Build Tools & Setup
* **Duration:** 30 minutes
* **Key Concepts:**
  * Node.js, npm, and package managers.
  * Under the hood: Vite, Webpack, and bundlers.
  * Scaffold a new React app with Vite + TS.
  * Folder structure breakdown of a typical React app.

---

## Module 2: JSX and Components (4 Hours)

### Lesson 2.1: Understanding JSX (JavaScript XML)
* **Duration:** 40 minutes
* **Key Concepts:**
  * JSX syntax rules (single parent, closing tags).
  * JavaScript expressions inside JSX.
  * Inline styles vs CSS modules vs Tailwind.
  * How compilation translates JSX into React.createElement.

### Lesson 2.2: Functional Components & Props
* **Duration:** 50 minutes
* **Key Concepts:**
  * Creating custom functional components.
  * Passing data into components using Props.
  * Destructuring props and TypeScript interfaces.
  * Children props for wrapper components.

---

## Module 3: State & Interactive UIs (5 Hours)

### Lesson 3.1: The useState Hook
* **Duration:** 60 minutes
* **Key Concepts:**
  * What is React State? (State vs Props).
  * The `useState` hook syntax.
  * Updating primitive types and arrays/objects.
  * Controlled vs Uncontrolled form elements.

### Lesson 3.2: Handling User Events
* **Duration:** 40 minutes
* **Key Concepts:**
  * Dynamic event handlers (onClick, onChange, onSubmit).
  * SyntheticEvent wrapper.
  * Passing parameters to handlers.
  * Preventing default browser actions.

---

## Module 4: Rendering Lists & Lifecycle Effects (4 Hours)

### Lesson 4.1: Lists & Keys
* **Duration:** 45 minutes
* **Key Concepts:**
  * Mapping arrays to JSX elements.
  * The importance of the `key` prop (Virtual DOM reconciler).
  * Guidelines for selecting safe keys (avoid array index).
  * Conditional rendering strategies (`&&`, ternary operator).

### Lesson 4.2: Side Effects with useEffect
* **Duration:** 75 minutes
* **Key Concepts:**
  * What is a side effect? (data fetching, intervals, subscriptions).
  * The `useEffect` hook signature.
  * The dependency array (empty, state variables, none).
  * Cleanup functions (preventing memory leaks).

---

## Module 5: Project Building & State Flow (4 Hours)

### Lesson 5.1: Lifting State Up
* **Duration:** 60 minutes
* **Key Concepts:**
  * Unidirectional data flow in React.
  * Identifying when to lift state.
  * Sharing state between sibling components.
  * Passing state update handlers down as props.

### Lesson 5.2: Best Practices & Deployment
* **Duration:** 60 minutes
* **Key Concepts:**
  * React component file organization.
  * Performance optimizations (preventing re-renders).
  * Building for production: `npm run build`.
  * Deploying to Vercel/Netlify.

---

# Final Project: TaskMaster Interactive Board
An interactive Kanban-style task management dashboard.

* **Description:** A single-page task manager allowing students to add tasks, move them between "To-Do", "In-Progress", and "Completed" categories, filter by keyword, and track their daily progress using a visual completion indicator.
* **Must Use:**
  * Components (Board, Column, TaskCard, TaskForm).
  * Dynamic state storage with `useState` for tasks.
  * Side effects using `useEffect` to sync tasks with `localStorage`.
  * Props drilling & lifted state handlers for drag/move operations.
  * TypeScript types/interfaces for task schema validation.
