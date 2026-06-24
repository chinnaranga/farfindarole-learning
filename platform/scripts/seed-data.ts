import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_PROJECT')) {
  console.error('Error: Please provide valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables to seed the database.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedCourse() {
  console.log('Starting database seed...')

  // 1. Create a mock instructor user first if needed, or use a default one
  const instructorId = '11111111-1111-1111-1111-111111111111'
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: instructorId,
      email: 'instructor@farfindarole.com',
      name: 'John Instructor',
      role: 'instructor'
    })

  if (userError) {
    console.warn('Note: Could not upsert user. Make sure your users table exists.', userError.message)
  }

  // 2. Insert Course
  const courseData = {
    title: 'React Basics for Beginners',
    description: 'Learn React from scratch. Build interactive and performant web interfaces with confidence.',
    category: 'web-dev',
    difficulty: 'beginner',
    published: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    instructor_id: instructorId
  }

  const { data: insertedCourses, error: courseError } = await supabase
    .from('courses')
    .insert([courseData])
    .select()

  if (courseError) {
    console.error('Error inserting course:', courseError.message)
    process.exit(1)
  }

  const courseId = insertedCourses?.[0]?.id
  console.log(`✓ Course created successfully with ID: ${courseId}`)

  // 3. Insert Lessons
  const lessons = [
    {
      course_id: courseId,
      title: 'What is React & Why Learn It?',
      content: `### Learning Objectives
* Describe the differences between the Imperative and Declarative paradigm.
* Explain the role of the Virtual DOM in UI performance.
* Understand the core value of Component-Driven Development.

---

### 1. Introduction: The Web Interface Challenge
In the early days of the web, building interactive interfaces was incredibly difficult. Every state change required manually targeting elements in the document object model (DOM), querying, clearing nodes, and appending child elements. 

For example, updating a username in a list using vanilla JavaScript required:
\`\`\`javascript
const list = document.getElementById('user-list');
const item = document.createElement('li');
item.textContent = 'Welcome, Alice!';
list.appendChild(item);
\`\`\`

While functional, this approach is **imperative**. You must explain exactly *how* to change the UI step-by-step. As applications grew, this imperativeness led to "spaghetti code" where state updates in one component broke the UI layout of another.

---

### 2. The Declarative Revolution
React introduced a **declarative** model. Instead of telling the browser step-by-step how to change the DOM, you describe what the UI should look like for a given state:

\`\`\`jsx
function UserBanner({ username }) {
  return <h1>Welcome, {username}!</h1>;
}
\`\`\`

Whenever the \`username\` variable changes, React automatically handles the background work to update the screen. 

#### The Restaurant Analogy
* **Imperative:** You walk into the kitchen, grab a pan, chop the onions, heat the butter, sear the chicken, add spices, cook for 20 minutes, plate the dish, and serve it.
* **Declarative:** You sit at the table, look at the menu, and tell the waiter: *"I want the butter chicken."* The kitchen (React) takes care of all the complex steps and serves you the finished dish.

---

### 3. The Virtual DOM Under the Hood
Directly writing changes to the browser's Real DOM is computationally expensive. When the browser DOM updates, it triggers a reflow (calculating layout positions) and a repaint (drawing pixels), which can slow down applications.

React solves this using a **Virtual DOM**:
1. When state changes, React builds a brand new Virtual DOM tree (a lightweight in-memory JSON representation of the elements).
2. It compares this new tree with the previous Virtual DOM tree. This comparison algorithm is called **Reconciliation** or **Diffing**.
3. React calculates the minimum set of changes needed (the "patch").
4. It batch-applies only these specific changes to the Real DOM, avoiding redundant repaints and keeping rendering snappy.

---

### 4. Common Mistakes to Avoid
1. **Directly mutating variables:** React won't trigger a re-render if you modify variables directly (e.g., \`myVar = 'new value'\`). Always update state using state hooks!
2. **Treating components as single pages:** React is designed for reusability. Break down your dashboard layout into cards, tabs, inputs, and wrappers.
`,
      video_url: 'local-video-react-basics',
      duration_minutes: 20,
      order_num: 1,
      free_preview: true
    },
    {
      course_id: courseId,
      title: 'Understanding JSX Syntax and Dynamic Expressions',
      content: `### Learning Objectives
* Understand how JSX differs from normal HTML templates.
* Inject arbitrary JavaScript expressions into markup.
* Style JSX components securely.

---

### 1. What is JSX?
JSX stands for **JavaScript XML**. It allows you to write HTML-like syntax directly inside your JavaScript file. It is not native browser code; instead, compiler tools like Babel or swc translate JSX code into standard JavaScript objects:

\`\`\`jsx
// What you write:
const element = <h1 className="title">Hello World</h1>;

// What it compiles to:
const element = React.createElement('h1', { className: 'title' }, 'Hello World');
\`\`\`

---

### 2. Core Rules of JSX
To write valid JSX, you must follow three essential rules:

#### Rule 1: Return a Single Parent Element
Every component must return a single top-level element. If you have multiple sibling elements, wrap them in a \`div\` or a React Fragment (\`<>\` and \`</>\`):
\`\`\`jsx
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
\`\`\`

#### Rule 2: Close All Tags
In HTML, tags like \`<input>\` or \`<img>\` don't require closing tags. In JSX, every tag must be self-closing: \`<input />\`, \`<img />\`, \`<br />\`.

#### Rule 3: Use camelCase for Attributes
Since JSX translates to JavaScript objects, attribute keys must be valid JS object properties.
* Use \`className\` instead of \`class\`.
* Use \`htmlFor\` instead of \`for\`.
* Use camelCase for event handlers (e.g., \`onClick\`, \`onChange\`).

---

### 3. Dynamic JavaScript in JSX
To insert active data inside your elements, wrap it in curly braces \`{ }\`:

\`\`\`jsx
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
\`\`\`
`,
      video_url: '',
      duration_minutes: 30,
      order_num: 2,
      free_preview: true
    }
  ]

  const { data: insertedLessons, error: lessonError } = await supabase
    .from('lessons')
    .insert(lessons)
    .select()

  if (lessonError) {
    console.error('Error inserting lessons:', lessonError.message)
    process.exit(1)
  }

  console.log(`✓ Installed ${insertedLessons?.length} lessons successfully.`)

  // 4. Insert Quiz for Lesson 1
  const lesson1Id = insertedLessons?.[0]?.id
  if (lesson1Id) {
    const { data: insertedQuizzes, error: quizError } = await supabase
      .from('quizzes')
      .insert([
        {
          lesson_id: lesson1Id,
          title: 'React Fundamentals Quiz',
          time_limit_minutes: 5,
          passing_score_percent: 70
        }
      ])
      .select()

    if (quizError) {
      console.warn('Note: Could not seed quiz details.', quizError.message)
    } else {
      const quizId = insertedQuizzes?.[0]?.id
      
      const quizQuestions = [
        {
          quiz_id: quizId,
          question: 'Which pattern best describes how React manages DOM rendering?',
          options: [
            'Imperative updates where code specifies every DOM node modification.',
            'A Declarative paradigm comparing Virtual DOM trees using a Diffing/Reconciliation process.',
            'Direct browser compilation of JSX into native web assemblies.',
            'Periodic page reloads connected to client-side routers.'
          ],
          correct_answer_index: 1,
          explanation: 'React uses a declarative design: you describe what the UI should look like for a given state, and React manages matching it to the screen via the Virtual DOM.'
        },
        {
          quiz_id: quizId,
          question: 'What is a key security risk when using vanilla DOM manipulation methods like innerHTML?',
          options: [
            'Cross-Site Scripting (XSS) due to execution of unescaped script fragments.',
            'Clickjacking of frame overlays.',
            'Database connection timeouts.',
            'Loss of browser local storage data.'
          ],
          correct_answer_index: 0,
          explanation: 'Directly setting innerHTML allows execution of HTML tags, opening vulnerabilities to script injection if the source data is untrusted.'
        }
      ]

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(quizQuestions)

      if (questionsError) {
        console.warn('Note: Could not seed quiz questions.', questionsError.message)
      } else {
        console.log('✓ Seeded quiz assessment successfully.')
      }
    }
  }

  console.log('Database seeding finished!')
}

seedCourse()
