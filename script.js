const jobList = document.getElementById("jobList");
const savedJobsDiv = document.getElementById("savedJobs");
const jobCount = document.getElementById("jobCount");

let savedJobs = JSON.parse(localStorage.getItem("jobs")) || [];

/* ENTER KEY SEARCH */
document.getElementById("search").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchJobs();
});

/* SEARCH FUNCTION */
async function searchJobs() {
  const query = document.getElementById("search").value.trim();
  const type = document.getElementById("typeFilter").value;

  if (!query) {
    jobList.innerHTML = "⚠️ Enter a search term";
    return;
  }

  jobList.innerHTML = "🔍 Loading jobs...";

  const url = `https://jsearch.p.rapidapi.com/search?query=${query} jobs in India&num_pages=1`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "cab831f3d3msh0cd04bd65cd9c8bp14d508jsn42455667b54d",
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    const data = await res.json();
    let jobs = data.data || [];

    /* ✅ ROBUST FILTER FIX */
    if (type) {
      jobs = jobs.filter(j => {
        if (!j.job_employment_type) return false;

        const apiType = j.job_employment_type
          .toUpperCase()
          .replace(/[\s-_]/g, "");

        return apiType.includes(type.toUpperCase());
      });
    }

    displayJobs(jobs);

  } catch (error) {
    console.error(error);
    jobList.innerHTML = "❌ Error fetching jobs";
  }
}

/* DISPLAY JOBS */
function displayJobs(jobs) {
  jobList.innerHTML = "";

  if (!jobs.length) {
    jobList.innerHTML = "😔 No jobs match your search";
    jobCount.innerText = "";
    return;
  }

  jobCount.innerText = `${jobs.length} jobs found`;

  jobs.forEach((job, index) => {
    const div = document.createElement("div");
    div.className = "job-card";

    div.innerHTML = `
      <div>
        <div class="job-title">${job.job_title}</div>
        <div class="company">${job.employer_name}</div>
        <div>📍 ${job.job_city || "Remote"}</div>
      </div>

      <div class="actions">
        <button class="apply" data-link="${job.job_apply_link}">Apply</button>
        <button class="save" data-index="${index}">❤️</button>
      </div>
    `;

    jobList.appendChild(div);
  });

  attachButtons(jobs);
}

/* BUTTON EVENTS */
function attachButtons(jobs) {
  document.querySelectorAll(".apply").forEach(btn => {
    btn.onclick = () => window.open(btn.dataset.link);
  });

  document.querySelectorAll(".save").forEach(btn => {
    btn.onclick = () => {
      const job = jobs[btn.dataset.index];
      saveJob(job);
    };
  });
}

/* SAVE JOB */
function saveJob(job) {
  const exists = savedJobs.find(j => j.job_id === job.job_id);

  if (!exists) {
    savedJobs.push(job);
    localStorage.setItem("jobs", JSON.stringify(savedJobs));
    displaySavedJobs();
  }
}

/* REMOVE JOB */
function removeJob(id) {
  savedJobs = savedJobs.filter(j => j.job_id !== id);
  localStorage.setItem("jobs", JSON.stringify(savedJobs));
  displaySavedJobs();
}

/* DISPLAY SAVED JOBS */
function displaySavedJobs() {
  savedJobsDiv.innerHTML = "";

  if (!savedJobs.length) {
    savedJobsDiv.innerHTML = "<p>No saved jobs yet</p>";
    return;
  }

  savedJobs.forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";

    div.innerHTML = `
      <div>
        <div class="job-title">${job.job_title}</div>
        <div class="company">${job.employer_name}</div>
      </div>

      <div class="actions">
        <button class="apply" data-link="${job.job_apply_link}">Apply</button>
        <button class="remove" data-id="${job.job_id}">❌</button>
      </div>
    `;

    savedJobsDiv.appendChild(div);
  });

  document.querySelectorAll(".remove").forEach(btn => {
    btn.onclick = () => removeJob(btn.dataset.id);
  });

  document.querySelectorAll(".apply").forEach(btn => {
    btn.onclick = () => window.open(btn.dataset.link);
  });
}

/* LOAD SAVED ON PAGE LOAD */
displaySavedJobs();