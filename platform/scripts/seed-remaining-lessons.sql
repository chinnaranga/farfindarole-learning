-- =============================================================================
-- SEED LESSONS, QUIZZES, AND QUESTIONS FOR REMAINING COURSES
-- =============================================================================

-- =============================================================================
-- SCHEMA MIGRATION PREPARATION (Learning Redesign Updates)
-- =============================================================================

-- Step 1: Drop UNIQUE constraint on quizzes.lesson_id to allow multiple quizzes per lesson
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_lesson_id_key;

-- Step 2: Extend quizzes to support graded and final assessment states
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL;

-- Step 3: Create Quiz Attempts to track graded metrics
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL, -- email
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score_percent INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  attempt_num   INTEGER NOT NULL DEFAULT 1,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for quiz attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read attempts for owner" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow system insert attempts" ON public.quiz_attempts;
CREATE POLICY "Allow read attempts for owner" ON public.quiz_attempts FOR SELECT USING (user_id = auth.email());
CREATE POLICY "Allow system insert attempts" ON public.quiz_attempts FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Step 4: Create Capstone Projects Table
CREATE TABLE IF NOT EXISTS public.capstone_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID UNIQUE NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL DEFAULT 'Capstone Project',
  description     TEXT NOT NULL, -- markdown description
  guidelines      TEXT DEFAULT '', -- rules / requirements
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create Project Submissions Table
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL, -- email
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  github_url      TEXT NOT NULL,
  demo_url        TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  status          VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  feedback        TEXT DEFAULT '',
  reviewed_by     TEXT DEFAULT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS for Capstone Projects and Submissions
ALTER TABLE public.capstone_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read capstones" ON public.capstone_projects;
DROP POLICY IF EXISTS "Allow read submissions for owner" ON public.project_submissions;
DROP POLICY IF EXISTS "Allow system insert submissions" ON public.project_submissions;

CREATE POLICY "Open read capstones" ON public.capstone_projects FOR SELECT USING (TRUE);
CREATE POLICY "Allow read submissions for owner" ON public.project_submissions FOR SELECT USING (user_id = auth.email());
CREATE POLICY "Allow system insert submissions" ON public.project_submissions FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Step 6: Create Final Assessment Coding Challenges Junction Table
CREATE TABLE IF NOT EXISTS public.final_assessment_challenges (
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, challenge_id)
);

ALTER TABLE public.final_assessment_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open read final challenges" ON public.final_assessment_challenges;
DROP POLICY IF EXISTS "System manage final challenges" ON public.final_assessment_challenges;
CREATE POLICY "Open read final challenges" ON public.final_assessment_challenges FOR SELECT USING (TRUE);
CREATE POLICY "System manage final challenges" ON public.final_assessment_challenges FOR ALL WITH CHECK (TRUE);

-- =============================================================================
-- 1. SEED LESSONS
-- =============================================================================

INSERT INTO lessons (id, course_id, title, content, video_url, duration_minutes, order_num, free_preview) VALUES

-- -----------------------------------------------------------------------------
-- COURSE 1: Advanced SQL & Database Design (22222222-2222-2222-2222-222222222222)
-- -----------------------------------------------------------------------------
('22222222-2222-2222-2222-211111111111',
 '22222222-2222-2222-2222-222222222222',
 'Relational Database Normalization & Schema Design',
 '### Learning Objectives
* Describe First, Second, Third, and Boyce-Codd Normal Forms (1NF, 2NF, 3NF, BCNF).
* Explain how to decompose relations to eliminate redundancy and update anomalies.
* Apply foreign key constraints, check constraints, and indexes to enforce schema integrity.

### Introduction to Normalization
Database normalization is the systematic process of organizing fields and tables of a relational database to minimize redundancy and dependency. The primary goal is to isolate data so that additions, deletions, and modifications can be made in just one table and propagated through the rest of the database using defined relationships.

#### First Normal Form (1NF)
A table is in 1NF if:
1. There are no duplicate rows.
2. Each cell contains only atomic (indivisible) values.
3. There are no repeating groups or arrays of values.

#### Second Normal Form (2NF)
A table is in 2NF if:
1. It is in First Normal Form (1NF).
2. It has no partial dependencies, meaning all non-prime attributes are fully functionally dependent on the entire primary key. This is only relevant for composite primary keys.

#### Third Normal Form (3NF)
A table is in 3NF if:
1. It is in Second Normal Form (2NF).
2. There are no transitive dependencies. A transitive dependency occurs when a non-prime attribute depends on another non-prime attribute, which in turn depends on the primary key.

#### Boyce-Codd Normal Form (BCNF)
BCNF is a slightly stronger version of 3NF. A table is in BCNF if for every non-trivial functional dependency A -> B, A is a superkey. BCNF addresses anomalies that can occur when a table has multiple overlapping composite candidate keys.',
 '', 25, 1, true),

('22222222-2222-2222-2222-211111111112',
 '22222222-2222-2222-2222-222222222222',
 'Indexing Strategies & Query Tuning (B-Tree, Hash)',
 '### Learning Objectives
* Compare B-Tree, Hash, and GIN/GiST index structures in PostgreSQL.
* Identify which query patterns benefit from specific index types.
* Analyze query execution plans using the `EXPLAIN ANALYZE` command to identify performance bottlenecks.

### How Indexes Work
Indexes are specialized data structures that store a subset of table data in an ordered format, allowing the database engine to locate matching rows in logarithmic time (O(log N)) rather than scanning the entire table (O(N)).

#### B-Tree Indexes
The default and most commonly used index in PostgreSQL is the B-Tree (Balanced Tree). B-Trees are highly efficient for:
* Equality queries (`=`)
* Range queries (`>`, `<`, `>=`, `<=`)
* Ordering queries (`ORDER BY`)

#### Hash Indexes
Hash indexes store a 32-bit hash value generated from the indexed column. They are optimized exclusively for simple equality comparisons (`=`). They do not support range queries or ordering.

#### Query Analysis with EXPLAIN
To optimize a slow query, you must inspect how the database plans to execute it. Prepend your query with `EXPLAIN (ANALYZE, BUFFERS)` to run the query and view the execution tree, including:
* **Seq Scan**: A full table scan. If this occurs on a large table, an index is likely missing.
* **Index Scan**: Scanning the index and then fetching the corresponding rows from the table heap.
* **Index Only Scan**: Fetching data directly from the index without accessing the table heap, which is extremely fast.',
 '', 30, 2, false),

('22222222-2222-2222-2222-211111111113',
 '22222222-2222-2222-2222-222222222222',
 'Row Level Security (RLS) & Access Policies',
 '### Learning Objectives
* Understand the security model of Row Level Security (RLS) in PostgreSQL.
* Write SELECT, INSERT, UPDATE, and DELETE policies to restrict data access.
* Integrate RLS with external auth systems like Supabase using session variables and helper functions.

### What is Row Level Security?
Row Level Security (RLS) is a database security feature that allows you to define policies to control which rows of data a user can see, insert, update, or delete. RLS is critical for multi-tenant applications where users must only access their own data.

#### Enabling RLS
By default, RLS is disabled. To enable it on a table, run:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

#### Writing Access Policies
Policies are SQL expressions that act as implicit `WHERE` clauses appended to all queries executed by non-superuser roles.
```sql
-- Allow users to read only their own documents
CREATE POLICY "Allow users to read own documents" ON documents
  FOR SELECT
  USING (user_id = auth.uid());
```
In this policy, `auth.uid()` is a helper function that retrieves the ID of the authenticated user from the request session.',
 '', 20, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 2: Python Data Science Handbook (33333333-3333-3333-3333-333333333333)
-- -----------------------------------------------------------------------------
('33333333-3333-3333-3333-211111111111',
 '33333333-3333-3333-3333-333333333333',
 'Vectorized Array Operations with NumPy',
 '### Learning Objectives
* Differentiate between standard Python lists and NumPy ndarrays.
* Understand the performance benefits of vectorized operations.
* Apply broadcasting rules to perform operations on arrays of different shapes.

### Introduction to NumPy
NumPy (Numerical Python) is the foundational library for scientific computing in Python. It provides a highly efficient multidimensional array object called `ndarray` and a suite of routines for fast operations on arrays, including mathematical, logical, shape manipulation, and sorting.

#### NumPy ndarray vs. Python Lists
* **Memory Contiguity**: NumPy arrays are stored in contiguous blocks of memory, which allows for extremely fast CPU cache access. Python lists are arrays of pointers to scattered objects.
* **Static Typing**: All elements in a NumPy array must be of the same data type (e.g., float64, int32), removing runtime type checking overhead.
* **Vectorization**: Operations are executed in compiled C code rather than Python loops.

#### Broadcasting Rules
Broadcasting allows mathematical operations to be performed on arrays of different shapes. The execution follows three rules:
1. If the arrays do not have the same rank, prepend 1s to the shape of the lower-rank array.
2. If the shape of the arrays does not match in any dimension, the array with a shape of 1 in that dimension is stretched to match the other shape.
3. If in any dimension the sizes disagree and neither is equal to 1, an error is raised.',
 '', 20, 1, true),

('33333333-3333-3333-3333-211111111112',
 '33333333-3333-3333-3333-333333333333',
 'Data Cleaning & Manipulation with Pandas',
 '### Learning Objectives
* Work with Series and DataFrame objects in Pandas.
* Detect, filter, and fill missing values (NaNs).
* Perform aggregation and grouping operations to summarize datasets.

### Data Manipulation with Pandas
Pandas is a high-level library built on top of NumPy, designed for working with labeled and relational data. Its two primary data structures are the `Series` (1D) and the `DataFrame` (2D).

#### Handling Missing Data
Real-world data is rarely clean. Pandas represents missing data as `NaN` (Not a Number). Important methods for handling NaNs include:
* `isnull()` and `notnull()`: Returns boolean masks identifying missing values.
* `dropna()`: Filters out rows or columns with missing values.
* `fillna(value)`: Replaces missing values with a specified default or computed statistic (like the mean or median).

#### GroupBy and Aggregation
The GroupBy operation follows the "split-apply-combine" pattern:
1. **Split**: Break the dataset into groups based on some key.
2. **Apply**: Compute an aggregate function (such as sum, mean, or count) on each group.
3. **Combine**: Merge the results into a new DataFrame.
```python
# Example GroupBy
df.groupby(''department'')[''salary''].mean()
```',
 '', 25, 2, false),

('33333333-3333-3333-3333-211111111113',
 '33333333-3333-3333-3333-333333333333',
 'Exploratory Data Visualization with Matplotlib & Seaborn',
 '### Learning Objectives
* Create standard scientific plots using the Matplotlib object-oriented API.
* Style and customize charts (labels, legends, grids, colors).
* Build advanced statistical visualizations (heatmaps, pairplots) with Seaborn.

### Introduction to Data Visualization
Data visualization is an essential step in exploratory data analysis. It allows researchers to spot patterns, outliers, and correlations that might go unnoticed in raw tabular data.

#### Matplotlib Object-Oriented API
While Matplotlib offers a simple state-based interface (`plt.plot`), the object-oriented API is preferred for complex layouts. It explicitly creates `Figure` and `Axes` objects:
```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(x, y, label=''Trend Line'', color=''#4A90E2'')
ax.set_title(''Sales Over Time'')
ax.set_xlabel(''Month'')
ax.set_ylabel(''Revenue'')
ax.legend()
plt.show()
```

#### Statistical Plotting with Seaborn
Seaborn is built on top of Matplotlib and integrates closely with Pandas DataFrames, offering beautiful default styles and high-level statistical chart types:
* `sns.scatterplot()`: Renders scatter plots with automatic semantic mapping.
* `sns.heatmap()`: Visualizes 2D matrices, ideal for correlation coefficients.
* `sns.pairplot()`: Generates pairwise relationship grids across all numeric variables.',
 '', 20, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 3: Frontend Systems & Web Performance (55555555-5555-5555-5555-555555555555)
-- -----------------------------------------------------------------------------
('55555555-5555-5555-5555-211111111111',
 '55555555-5555-5555-5555-555555555555',
 'Core Web Vitals & Loading Cycles (LCP, FID/INP, CLS)',
 '### Learning Objectives
* Define Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS).
* Analyze page loading performance using Chrome DevTools Performance Panel.
* Understand the thresholds and criteria for a "Good" performance rating.

### What are Core Web Vitals?
Core Web Vitals are a set of three user-centered performance metrics established by Google to measure the real-world user experience of a web page. They focus on loading speed, interactivity, and visual stability.

#### 1. Largest Contentful Paint (LCP)
LCP measures *loading performance*. It reports the time it takes to render the largest image or text block visible within the viewport.
* **Good**: Under 2.5 seconds.
* **Needs Improvement**: Between 2.5 and 4.0 seconds.
* **Poor**: Over 4.0 seconds.

#### 2. Interaction to Next Paint (INP)
INP measures *interactivity and responsiveness*. It assesses the latency of all user interactions (clicks, taps, keypresses) on a page and reports a single representative value.
* **Good**: Under 200 milliseconds.
* **Poor**: Over 500 milliseconds.

#### 3. Cumulative Layout Shift (CLS)
CLS measures *visual stability*. It quantifies how much elements unexpectedly shift on the page during the loading phase.
* **Good**: Score under 0.1.
* **Poor**: Score over 0.25.',
 '', 20, 1, true),

('55555555-5555-5555-5555-211111111112',
 '55555555-5555-5555-5555-555555555555',
 'Optimizing Largest Contentful Paint (LCP) & Asset Delivery',
 '### Learning Objectives
* Apply the Fetch Priority API to prioritize critical resource downloads.
* Implement modern image optimization practices (avif/webp formats, srcsets).
* Eliminate render-blocking stylesheets and scripts.

### Optimizing LCP
Since Largest Contentful Paint is heavily influenced by image assets and critical render trees, optimizing asset delivery is the most effective way to improve this metric.

#### Fetch Priority API
You can instruct the browser to download a high-value asset immediately using the `fetchpriority="high"` attribute. This is particularly useful for above-the-fold hero images:
```html
<img src="hero.webp" fetchpriority="high" alt="Featured Course Banner">
```

#### Next-Gen Image Formats
Always compress and convert images to modern formats:
* **AVIF**: Offers up to 50% smaller file sizes than JPEG at comparable quality.
* **WebP**: Highly compatible next-gen format with superior compression.
* Implement responsive images using `srcset` to avoid sending desktop-sized images to mobile viewports.',
 '', 25, 2, false),

('55555555-5555-5555-5555-211111111113',
 '55555555-5555-5555-5555-555555555555',
 'Code Splitting & Advanced Caching Strategies',
 '### Learning Objectives
* Implement dynamic imports in JavaScript to reduce initial bundle sizes.
* Configure Service Workers to enable offline caching and instant load.
* Optimize HTTP response caching headers (Cache-Control, ETags).

### Code Splitting
By default, compilers bundle all JavaScript into a single large file. Code splitting allows you to break your bundle into smaller chunks that are loaded on-demand, reducing the initial loading latency.

#### Dynamic Imports
Use dynamic `import()` statements to load modules only when they are needed:
```javascript
// Load expensive graphing library only on click
button.addEventListener(''click'', async () => {
  const { renderChart } = await import(''./charts.js'');
  renderChart();
});
```

#### HTTP Caching Headers
Leverage browser caches by configuring appropriate headers on your web server:
* `Cache-Control: public, max-age=31536000, immutable`: For versioned static assets (hashes in filename) that never change.
* `Cache-Control: no-cache`: Instructs the browser to validate with the server via ETags before using cached copies.',
 '', 25, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 4: System Design & Distributed Architectures (66666666-6666-6666-6666-666666666666)
-- -----------------------------------------------------------------------------
('66666666-6666-6666-6666-211111111111',
 '66666666-6666-6666-6666-666666666666',
 'Horizontal Scaling & Load Balancing Mechanics',
 '### Learning Objectives
* Compare vertical scaling with horizontal scaling.
* Explain the differences between Layer 4 (TCP) and Layer 7 (HTTP) load balancing.
* Apply consistent hashing algorithms for distributed routing.

### Scaling Strategies
As application traffic grows, systems must scale to handle the increased load without degrading performance or availability.

#### Vertical vs. Horizontal Scaling
* **Vertical Scaling (Scaling Up)**: Adding more resources (CPU, RAM) to a single physical or virtual server. Limited by physical hardware boundaries and represents a single point of failure.
* **Horizontal Scaling (Scaling Out)**: Adding more server nodes to the pool. Highly resilient and virtually limitless, but introduces distributed systems complexity.

#### Load Balancing
A load balancer distributes incoming network traffic across a cluster of backend servers.
* **Layer 4 Load Balancing (TCP/UDP)**: Routes traffic based on network packet information (IP address and port) without inspecting the message payload. Fast and lightweight.
* **Layer 7 Load Balancing (HTTP/HTTPS)**: Routes traffic based on application data (HTTP headers, cookies, URL paths). Enables features like SSL termination and session affinity.',
 '', 25, 1, true),

('66666666-6666-6666-6666-211111111112',
 '66666666-6666-6666-6666-666666666666',
 'Distributed Caching & Caching Patterns',
 '### Learning Objectives
* Design cache-aside, write-through, and write-behind caching strategies.
* Implement cache eviction algorithms (LRU, LFU).
* Mitigate common caching issues such as Cache Avalanche and Cache Stampede.

### Distributed Caching
A cache is a high-speed data storage layer that stores a subset of data, typically in transient memory (RAM), so that future requests for that data are served faster.

#### Caching Patterns
1. **Cache-Aside**: The application queries the cache first. If a cache miss occurs, it queries the database, writes the result to the cache, and returns it.
2. **Write-Through**: The application writes updates to the cache, and the cache synchronously writes them to the database before completing.
3. **Write-Behind (Write-Back)**: The application writes updates to the cache, which acknowledges immediately. The cache then asynchronously flushes the updates to the database.

#### Eviction Policies
When the cache reaches its memory capacity, it must evict old items:
* **Least Recently Used (LRU)**: Evicts the item that has not been accessed for the longest duration.
* **Least Frequently Used (LFU)**: Evicts the item with the lowest access count.',
 '', 25, 2, false),

('66666666-6666-6666-6666-211111111113',
 '66666666-6666-6666-6666-666666666666',
 'Event-Driven Messaging & Rate Limiting',
 '### Learning Objectives
* Contrast message queues (RabbitMQ) with distributed event streaming (Kafka).
* Design robust rate-limiting systems using token bucket and sliding window algorithms.
* Implement message consumer groups for scalable processing.

### Event-Driven Architectures
In distributed systems, services must communicate asynchronously to remain decoupled and resilient.

#### Message Queues vs. Event Streams
* **Message Queues (e.g., RabbitMQ)**: Messages are directed to queues, processed by consumers, and deleted upon successful acknowledgement. Optimized for discrete task distribution.
* **Event Streams (e.g., Apache Kafka)**: Events are appended to a continuous, immutable, partitioned commit log. Consumers maintain their own offsets, allowing multiple consumers to replay the stream.

#### Rate Limiting Algorithms
Rate limiters prevent resource exhaustion and protect APIs from abuse.
* **Token Bucket**: A bucket is filled with tokens at a constant rate. Each request consumes a token. If the bucket is empty, the request is rejected. Handles bursty traffic.
* **Leaky Bucket**: Requests enter a queue and are processed at a steady, uniform rate. Smooths out traffic spikes but adds latency.',
 '', 30, 3, false)

ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  video_url = EXCLUDED.video_url,
  duration_minutes = EXCLUDED.duration_minutes,
  order_num = EXCLUDED.order_num,
  free_preview = EXCLUDED.free_preview;


-- =============================================================================
-- 2. SEED QUIZZES (1 graded quiz per course, attached to Lesson 1)
-- =============================================================================

INSERT INTO quizzes (id, lesson_id, title, time_limit_minutes, passing_score_percent, is_graded, max_attempts) VALUES

-- Advanced SQL (Quiz attached to Lesson 1)
('22222222-2222-2222-2222-311111111111', '22222222-2222-2222-2222-211111111111', 'SQL Normalization & Schema Check', 5, 70, true, 3),

-- Python Data Science (Quiz attached to Lesson 1)
('33333333-3333-3333-3333-311111111111', '33333333-3333-3333-3333-211111111111', 'NumPy Vectorization Check', 5, 70, true, 3),

-- Frontend Systems (Quiz attached to Lesson 1)
('55555555-5555-5555-5555-311111111111', '55555555-5555-5555-5555-211111111111', 'Core Web Vitals Check', 5, 70, true, 3),

-- System Design (Quiz attached to Lesson 1)
('66666666-6666-6666-6666-311111111111', '66666666-6666-6666-6666-211111111111', 'Load Balancing & Scaling Check', 5, 70, true, 3)

ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  title = EXCLUDED.title,
  time_limit_minutes = EXCLUDED.time_limit_minutes,
  passing_score_percent = EXCLUDED.passing_score_percent,
  is_graded = EXCLUDED.is_graded,
  max_attempts = EXCLUDED.max_attempts;


-- =============================================================================
-- 3. SEED QUIZ QUESTIONS (3 multiple choice questions per quiz)
-- =============================================================================

INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer_index, explanation) VALUES

-- Course 1: Advanced SQL Quiz Questions
('22222222-2222-2222-2222-411111111111',
 '22222222-2222-2222-2222-311111111111',
 'Which normal form is violated if a table has a composite primary key (A, B) and a non-key attribute C that is dependent only on A?',
 ARRAY['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
 1,
 'Second Normal Form (2NF) requires that all non-key attributes be fully dependent on the entire primary key. A dependency on only a part of a composite key is a partial dependency, violating 2NF.'),

('22222222-2222-2222-2222-411111111112',
 '22222222-2222-2222-2222-311111111111',
 'What is a transitive dependency in database normalization?',
 ARRAY['A dependency between columns in different tables', 'A dependency of a non-key column on another non-key column which then depends on the primary key', 'A dependency that spans multiple database instances', 'A circular reference between foreign keys'],
 1,
 'A transitive dependency occurs when a non-prime attribute depends on another non-prime attribute (X -> Y), which in turn depends on the primary key (PK -> X). Eliminating transitive dependencies is the core requirement of 3NF.'),

('22222222-2222-2222-2222-411111111113',
 '22222222-2222-2222-2222-311111111111',
 'Which of the following describes Boyce-Codd Normal Form (BCNF)?',
 ARRAY['Every cell must contain atomic values', 'All partial dependencies must be removed', 'For every non-trivial functional dependency A -> B, A must be a superkey', 'There can be no foreign key relationships in the table'],
 2,
 'BCNF is a stricter version of 3NF. It requires that for every non-trivial functional dependency A -> B, the determinant A must be a candidate key (or superkey).'),


-- Course 2: Python Data Science Quiz Questions
('33333333-3333-3333-3333-411111111111',
 '33333333-3333-3333-3333-311111111111',
 'Why are NumPy array operations significantly faster than standard Python list loops?',
 ARRAY['They are written in assembler code', 'They store data in contiguous C-arrays, avoiding type-checking and pointer overhead', 'They automatically run on multiple GPU threads', 'They compress the data before running calculations'],
 1,
 'NumPy ndarrays store homogeneous elements in contiguous blocks of memory and perform operations in compiled C loops, eliminating Python''s dynamic type-checking and pointer-indirection overhead.'),

('33333333-3333-3333-3333-411111111112',
 '33333333-3333-3333-3333-311111111111',
 'According to NumPy broadcasting rules, what happens when operating on two arrays of shapes (3, 1) and (3, 5)?',
 ARRAY['An error is thrown immediately due to shape mismatch', 'The first array is stretched along the second dimension to shape (3, 5) to match the second array', 'The second array is sliced down to shape (3, 1)', 'Both arrays are flattened to 1D arrays of size 15'],
 1,
 'Since the first array has a size of 1 in the second dimension, NumPy stretches (broadcasts) it along that dimension to match the size of 5 in the second array, resulting in successful element-wise operations.'),

('33333333-3333-3333-3333-411111111113',
 '33333333-3333-3333-3333-311111111111',
 'Which NumPy function is used to change the shape of an array without changing its data?',
 ARRAY['np.resize()', 'np.transpose()', 'np.reshape()', 'np.flatten()'],
 2,
 'np.reshape() changes the dimensions (shape) of an array while sharing the same underlying data buffer, making it a fast O(1) operation.'),


-- Course 3: Frontend Systems Quiz Questions
('55555555-5555-5555-5555-411111111111',
 '55555555-5555-5555-5555-311111111111',
 'Which Core Web Vital measures the visual stability of a page during the loading cycle?',
 ARRAY['Largest Contentful Paint (LCP)', 'Interaction to Next Paint (INP)', 'First Contentful Paint (FCP)', 'Cumulative Layout Shift (CLS)'],
 3,
 'Cumulative Layout Shift (CLS) measures visual stability by tracking unexpected element movement and layout shifts in the viewport during page render.'),

('55555555-5555-5555-5555-411111111112',
 '55555555-5555-5555-5555-311111111111',
 'What is the target threshold for a "Good" Largest Contentful Paint (LCP) score?',
 ARRAY['Under 1.0 seconds', 'Under 2.5 seconds', 'Under 4.0 seconds', 'Under 100 milliseconds'],
 1,
 'A Core Web Vitals LCP score is classified as "Good" if the largest image or text element in the viewport renders in 2.5 seconds or less from when the page first starts loading.'),

('55555555-5555-5555-5555-411111111113',
 '55555555-5555-5555-5555-311111111111',
 'What does Interaction to Next Paint (INP) measure?',
 ARRAY['The total time it takes for a page''s scripts to compile', 'The visual load time of input forms', 'The latency of all user interactions on a page, reporting the worst-case responsiveness', 'The rate of frame drops during scrolling animations'],
 2,
 'INP measures page responsiveness by tracking the time elapsed between a user interaction (like clicking a button) and when the browser paints the next visual frame.'),


-- Course 4: System Design Quiz Questions
('66666666-6666-6666-6666-411111111111',
 '66666666-6666-6666-6666-311111111111',
 'What is a primary distinction between Layer 4 and Layer 7 load balancers?',
 ARRAY['Layer 4 load balancers can decrypt TLS traffic whereas Layer 7 cannot', 'Layer 4 routes traffic based on IP/Port packets; Layer 7 inspects application headers and URLs', 'Layer 4 load balancers only support UDP; Layer 7 only supports TCP', 'Layer 4 is software-based; Layer 7 is strictly hardware-based'],
 1,
 'Layer 4 load balancers operate at the transport layer (TCP/UDP) routing packets without looking at the payload. Layer 7 load balancers operate at the application layer, allowing routing based on HTTP headers, cookies, and URI paths.'),

('66666666-6666-6666-6666-411111111112',
 '66666666-6666-6666-6666-311111111111',
 'Which scaling strategy involves adding more hardware resources (like RAM or CPU cores) to a single machine?',
 ARRAY['Horizontal Scaling (Scaling Out)', 'Vertical Scaling (Scaling Up)', 'Database Sharding', 'Load Balancing'],
 1,
 'Vertical scaling (scaling up) means increasing the capacity of a single machine by adding resources like faster CPUs, more RAM, or larger SSDs.'),

('66666666-6666-6666-6666-411111111113',
 '66666666-6666-6666-6666-311111111111',
 'How does consistent hashing benefit distributed cache routing compared to simple modulo hashing (N % nodes)?',
 ARRAY['It guarantees 100% cache hit rates', 'It encrypts the cache keys before routing them', 'It minimizes cache key remapping and redistribution when a node is added or removed from the cluster', 'It automatically backs up keys across all database systems'],
 2,
 'With modulo hashing, adding or removing a node changes the hash mapping for almost all keys, causing a massive cache miss spike. Consistent hashing ensures that only a small fraction of keys (K/N) need to be remapped when the cluster size changes.')

ON CONFLICT (id) DO UPDATE SET
  quiz_id = EXCLUDED.quiz_id,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_answer_index = EXCLUDED.correct_answer_index,
  explanation = EXCLUDED.explanation;
