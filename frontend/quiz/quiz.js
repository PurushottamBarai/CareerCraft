const TOPIC_MAP = {
  "Java": ["OOP", "Collection Framework", "Multithreading and Concurrency", "Exception Handling", "JVM Internals and Memory Management", "File Handling"],
  "C Language": ["Pointers", "Memory Management", "File I/O", "Data Types & Operators", "Control Structures"],
  "C++": ["OOP in C++", "STL", "Memory Management", "Templates", "Exception Handling"],
  "JavaScript": ["Closures & Scopes", "Async/Await & Promises", "DOM Manipulation", "ES6+ Features", "Event Loop"],
  "Spring Boot": ["Annotations", "Dependency Injection", "Spring Data JPA", "Spring Security", "REST APIs"],
  "Hibernate": ["Session Management", "HQL", "Caching", "Entity Mapping", "Transactions"],
  "Data Structures and Algorithms": ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching"],
  "Computers": ["Basics of Computers", "Hardware", "Generations", "Input/Output Devices"],
  "Operating Systems": ["Process Management", "Memory Management", "Deadlocks", "File Systems", "Concurrency"],
  "DBMS": ["SQL Queries", "Normalization", "Transactions (ACID)", "Indexing", "Relational Algebra"],
  "Computer Networks": ["OSI Model", "TCP/IP Protocol Suite", "Routing Algorithms", "Network Security", "Application Layer Protocols"],
  "Software Engineering": ["SDLC", "Agile Methodologies", "Testing", "Requirements Engineering", "Software Architecture"],
  "English Language": ["Grammar", "Vocabulary", "Reading Comprehension", "Verbal Reasoning", "Synonyms & Antonyms"]
};

window.quizApp = {
    subject: null,
    topic: null,
    questions: [],
    currentIndex: 0,
    answers: [], // stores selected index per question
    timeLeft: 15 * 60, // 15 mins
    timerInterval: null,

    // Initialize the quiz module when mounted
    init() {
        if(!localStorage.getItem("quizSessionId")) {
            localStorage.setItem("quizSessionId", "SESSION_" + Date.now() + "_" + Math.floor(Math.random()*1000));
        }
        this.resetView();
    },

    resetView() {
        document.getElementById('quiz-setup-view').style.display = 'block';
        document.getElementById('quiz-loading-view').style.display = 'none';
        document.getElementById('quiz-execution-view').style.display = 'none';
        document.getElementById('quiz-result-view').style.display = 'none';
        document.getElementById('quiz-subject').selectedIndex = 0;
        document.getElementById('topic-container').style.display = 'none';
        document.getElementById('quiz-metadata').style.display = 'none';
    },

    updateTopics() {
        const subjectSelect = document.getElementById('quiz-subject');
        this.subject = subjectSelect.value;
        
        const topicSelect = document.getElementById('quiz-topic');
        topicSelect.innerHTML = '<option value="" disabled selected>Select a topic...</option>';
        
        if (TOPIC_MAP[this.subject]) {
            TOPIC_MAP[this.subject].forEach(topic => {
                const opt = document.createElement('option');
                opt.value = topic;
                opt.textContent = topic;
                topicSelect.appendChild(opt);
            });
            document.getElementById('topic-container').style.display = 'flex';
        }
        document.getElementById('quiz-metadata').style.display = 'none';
    },

    showMetadata() {
        this.topic = document.getElementById('quiz-topic').value;
        if (this.topic) {
            document.getElementById('quiz-metadata').style.display = 'block';
        }
    },

    async checkAccessLimit() {
        try {
            const res = await fetch(`${API_BASE}/quiz/status`, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'x-session-id': localStorage.getItem("quizSessionId")
                }
            });
            const data = await res.json();
            return data;
        } catch (e) {
            console.error("Status check failed", e);
            return { allowed: false, reason: "Network Error" };
        }
    },

    async startQuiz() {
        const status = await this.checkAccessLimit();
        if (!status.allowed) {
            // If it's a guest error, show exactly "Please log in to continue."
            if (status.isGuest) {
                document.getElementById("limit-message").textContent = "Please log in to continue.";
                document.getElementById("limit-login-btn").style.display = "inline-block";
            } else {
                document.getElementById("limit-message").textContent = "You have reached your quiz limit. (Resets automatically over time).";
                document.getElementById("limit-login-btn").style.display = "none";
            }

            document.getElementById("quiz-limit-modal").classList.remove("hidden");
            return;
        }

        document.getElementById('quiz-setup-view').style.display = 'none';
        document.getElementById('quiz-loading-view').style.display = 'flex';

        try {
            const res = await fetch(`${API_BASE}/quiz/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'x-session-id': localStorage.getItem("quizSessionId")
                },
                body: JSON.stringify({
                    subject: this.subject,
                    topic: this.topic,
                    sessionId: localStorage.getItem("quizSessionId")
                })
            });

            const data = await res.json();
            if (res.ok && data.questions && data.questions.length > 0) {
                this.questions = data.questions;
                this.answers = new Array(this.questions.length).fill(null);
                this.currentIndex = 0;
                this.timeLeft = 15 * 60; // strictly 15:00
                
                document.getElementById('quiz-loading-view').style.display = 'none';
                document.getElementById('quiz-execution-view').style.display = 'flex';
                document.getElementById('execution-exam-title').textContent = `${this.subject} - ${this.topic} Assessment`;
                
                this.renderQuestion();
                this.startTimer();
            } else {
                alert("Just a second while loading the test.");
                this.resetView();
            }
        } catch (e) {
            alert("Just a second while loading the test.");
            this.resetView();
        }
    },

    startTimer() {
        clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.submitQuiz(true);
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('exam-timer').textContent = `${m}:${s}`;
    },

    renderQuestion() {
        const q = this.questions[this.currentIndex];
        document.getElementById('q-counter-text').textContent = `${this.currentIndex + 1}. `;
        document.getElementById('question-text').textContent = q.question;
        
        const optsContainer = document.getElementById('exam-options');
        optsContainer.innerHTML = '';

        q.options.forEach((opt, idx) => {
            const row = document.createElement('div');
            row.className = 'option-row';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'quiz-option';
            radio.id = `opt-${idx}`;
            radio.value = idx;
            if (this.answers[this.currentIndex] === idx) {
                radio.checked = true;
            }
            radio.onchange = () => { this.answers[this.currentIndex] = idx; };
            
            const label = document.createElement('label');
            label.htmlFor = `opt-${idx}`;
            label.textContent = opt;

            row.appendChild(radio);
            row.appendChild(label);
            optsContainer.appendChild(row);
        });

        document.getElementById('page-indicator').textContent = `${this.currentIndex + 1} of ${this.questions.length} Pages`;
        document.getElementById('btn-prev').disabled = this.currentIndex === 0;
        
        if (this.currentIndex === this.questions.length - 1) {
            document.getElementById('btn-next').style.display = 'none';
        } else {
            document.getElementById('btn-next').style.display = 'inline-block';
        }
    },

    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.renderQuestion();
        }
    },

    prevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderQuestion();
        }
    },

    async submitQuiz(autoSubmit = false) {
        if (!autoSubmit && !confirm("Are you sure you want to submit your test for grading?")) {
            return;
        }
        clearInterval(this.timerInterval);
        
        document.getElementById('quiz-execution-view').style.display = 'none';
        
        // Calculate score
        let score = 0;
        this.questions.forEach((q, idx) => {
            if (this.answers[idx] === q.correctAnswerIndex) {
                score++;
            }
        });

        // Submit to API
        try {
            await fetch(`${API_BASE}/quiz/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'x-session-id': localStorage.getItem("quizSessionId")
                },
                body: JSON.stringify({
                    subject: this.subject,
                    topic: this.topic,
                    score: score,
                    totalQuestions: this.questions.length,
                    sessionId: localStorage.getItem("quizSessionId")
                })
            });
        } catch (e) {
            console.error("Analytics save failed", e);
        }

        this.renderResults(score);
    },

    renderResults(score) {
        document.getElementById('quiz-result-view').style.display = 'block';
        document.getElementById('final-score').textContent = score;

        const list = document.getElementById('explanations-list');
        list.innerHTML = '';

        this.questions.forEach((q, idx) => {
            const card = document.createElement('div');
            const isCorrect = this.answers[idx] === q.correctAnswerIndex;
            card.className = `exp-card ${isCorrect ? 'correct' : 'incorrect'}`;
            
            card.innerHTML = `
                <div class="exp-q">${idx + 1}. ${q.question}</div>
                <div class="exp-your-ans">Your Answer: ${this.answers[idx] !== null ? q.options[this.answers[idx]] : "<em>Skipped</em>"} ${isCorrect ? '✅' : '❌'}</div>
                ${!isCorrect ? `<div class="exp-correct-ans">Correct Answer: ${q.options[q.correctAnswerIndex]}</div>` : ''}
                <div class="exp-text"><strong>Explanation:</strong> ${q.explanation}</div>
            `;
            list.appendChild(card);
        });
    },

    resetQuiz() {
        this.resetView();
    },

    closeLimitModal() {
        document.getElementById('quiz-limit-modal').classList.add('hidden');
    },

    closeModalAndLogin() {
        this.closeLimitModal();
        showLogin();
    }
};
