// resume.js - Extracted logic for AI Resume Generator
window.resumeFeatureApp = {
    init: function() {
        const form = document.getElementById("resumeGeneratorForm");
        if (form) {
            form.removeEventListener("submit", this.handleGenerateResume.bind(this));
            form.addEventListener("submit", this.handleGenerateResume.bind(this));
        }

        // Add initial required fields if empty
        if (document.getElementById("educationList") && document.getElementById("educationList").children.length === 0) {
            window.addEducation();
        }
        if (document.getElementById("skillsList") && document.getElementById("skillsList").children.length === 0) {
            window.addSkill();
        }
    },

    handleGenerateResume: async function(e) {
        e.preventDefault();
        
        const generateBtn = document.getElementById("generateResumeBtn");
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = "Generating Document... <span class='spinner' style='display:inline-block; width: 15px; height: 15px; margin-left:10px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite;'></span>";
        generateBtn.disabled = true;
      
        // Compile Payload
        const payload = {
            personalInfo: {
                name: document.getElementById("resFullName")?.value || "",
                email: document.getElementById("resEmail")?.value || "",
                phone: document.getElementById("resPhone")?.value || "",
                location: document.getElementById("resLocation")?.value || "",
                linkedin: document.getElementById("resLinkedin")?.value || "",
                github: "",
                summary: ""
            },
            customFields: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
            achievements: []
        };

        // Parse Custom Header Fields (Map github/summary automatically)
        document.querySelectorAll("#customHeaderFields .dynamic-item").forEach(item => {
            const key = item.querySelector(".custom-header-key").value.trim();
            const val = item.querySelector(".custom-header-value").value.trim();
            if(!key || !val) return;
            
            const kLow = key.toLowerCase();
            if (kLow.includes("github")) { payload.personalInfo.github = val; }
            else if (kLow.includes("summary") || kLow.includes("objective")) { payload.personalInfo.summary = val; }
            else { payload.customFields.push({ key, value: val }); }
        });

        // Parse Education
        document.querySelectorAll("#educationList .education-item").forEach(item => {
            payload.education.push({
                degree: item.querySelector(".edu-degree").value,
                institution: item.querySelector(".edu-institution").value,
                year: item.querySelector(".edu-year").value,
                grade: item.querySelector(".edu-grade").value
            });
        });

        // Parse Skills
        document.querySelectorAll("#skillsList .skill-item").forEach(item => {
            payload.skills.push({
                category: item.querySelector(".skill-category").value || "Core",
                items: item.querySelector(".skill-items").value
            });
        });

        // Parse Projects
        document.querySelectorAll("#projectsList .project-item").forEach(item => {
            payload.projects.push({
                title: item.querySelector(".proj-title").value,
                url: item.querySelector(".proj-url").value,
                description: item.querySelector(".proj-desc").value
            });
        });

        // Parse Certifications
        document.querySelectorAll("#certsList .cert-item").forEach(item => {
            const val = item.querySelector(".cert-text").value;
            if (val) payload.certifications.push(val);
        });

        // Parse Achievements
        document.querySelectorAll("#achievementsList .achievement-item").forEach(item => {
            const val = item.querySelector(".achieve-text").value;
            if (val) payload.achievements.push(val);
        });

        try {
          let sessionId = localStorage.getItem("sessionId");
          if (!sessionId) {
              sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
              localStorage.setItem("sessionId", sessionId);
          }

          const response = await fetch(`${API_BASE}/resume/generate`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-session-id": sessionId,
              "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
            },
            body: JSON.stringify(payload),
          });
      
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const downloadBtn = document.getElementById("downloadResumeBtn");
            if(downloadBtn) {
                downloadBtn.href = url;
                downloadBtn.download = `${payload.personalInfo.name.replace(/\s+/g, '_')}_Resume.docx`;
                
                generateBtn.classList.add("hidden");
                downloadBtn.classList.remove("hidden");
                downloadBtn.style.display = "inline-flex";
            }
          } else {
            const result = await response.json().catch(() => ({}));
            
            if (result.message && result.message.includes("log in to continue")) {
                alert("Please log in to continue generating elegant resumes.");
                window.showLogin();
            } else {
                alert(result.message || "Failed to generate resume.");
            }
          }
        } catch (error) {
          console.error("Resume generation error:", error);
          alert("Connection failed. Please try again later.");
        } finally {
          generateBtn.innerHTML = originalText;
          generateBtn.disabled = false;
        }
    }
};

// Global DOM manipulation helpers for dynamic fields
window.removeDynamicItem = function(btn) {
    btn.parentElement.remove();
};

window.addCustomHeaderField = function() {
    const template = document.getElementById("tmpl-customHeader");
    const clone = template.content.cloneNode(true);
    document.getElementById("customHeaderFields").appendChild(clone);
};

window.addEducation = function() {
    const template = document.getElementById("tmpl-education");
    const clone = template.content.cloneNode(true);
    document.getElementById("educationList").appendChild(clone);
};

window.addSkill = function() {
    const template = document.getElementById("tmpl-skill");
    const clone = template.content.cloneNode(true);
    document.getElementById("skillsList").appendChild(clone);
};

window.addProject = function() {
    const template = document.getElementById("tmpl-project");
    const clone = template.content.cloneNode(true);
    document.getElementById("projectsList").appendChild(clone);
};

window.addCertification = function() {
    const template = document.getElementById("tmpl-cert");
    const clone = template.content.cloneNode(true);
    document.getElementById("certsList").appendChild(clone);
};

window.addAchievement = function() {
    const template = document.getElementById("tmpl-achievement");
    const clone = template.content.cloneNode(true);
    document.getElementById("achievementsList").appendChild(clone);
};
