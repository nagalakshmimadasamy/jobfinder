const jobList = document.getElementById("jobList");
const savedJobsDiv = document.getElementById("savedJobs");
const jobCount = document.getElementById("jobCount");

let savedJobs = JSON.parse(localStorage.getItem("jobs")) || [];
let allJobs = []; /* store all fetched jobs for client-side filtering */

/* ENTER KEY SEARCH */
document.getElementById("search").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchJobs();
});

/* FILTER DROPDOWN — re-filters without new API call */
document.getElementById("typeFilter").addEventListener("change", () => {
  if (allJobs.length > 0) applyFilter();
});

/* SEARCH FUNCTION */
async function searchJobs() {
  const query = document.getElementById("search").value.trim();

  if (!query) {
    jobList.innerHTML = `<p class="placeholder">⚠️ Please enter a search term</p>`;
    return;
  }

  jobList.innerHTML = `<p class="placeholder">🔍 Loading jobs...</p>`;
  jobCount.innerText = "";

  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)} jobs in India&num_pages=2&results_per_page=20`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "YOUR_API_KEY_HERE",
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });

    const data = await res.json();
    allJobs = data.data || [];

    applyFilter();

  } catch (error) {
    console.error(error);
    jobList.innerHTML = `<p class="placeholder">❌ Error fetching jobs. Please try again.</p>`;
  }
}

/* APPLY FILTER — runs on search and on dropdown change */
function applyFilter() {
  const type = document.getElementById("typeFilter").value;

  let filtered = allJobs;

  if (type) {
    filtered = allJobs.filter(j => {
      if (!j.job_employment_type) return false;
      const apiType = j.job_employment_type
        .toUpperCase()
        .replace(/[\s\-_]/g, "");
      /* handles FULLTIME, FULL-TIME, CONTRACTOR, CONTRACT etc */
      return apiType.includes(type.replace(/[\s\-_]/g, "").toUpperCase());
    });
  }

  displayJobs(filtered);
}

/* DISPLAY JOBS */
function displayJobs(jobs) {
  jobList.innerHTML = "";

  if (!jobs.length) {
    jobList.innerHTML = `<p class="placeholder">😔 No jobs found. Try a different search or filter.</p>`;
    jobCount.innerText = "";
    return;
  }

  jobCount.innerText = `${jobs.length} jobs found`;

  jobs.forEach((job, index) => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.style.animationDelay = `${index * 0.04}s`;

    const city = job.job_city || job.job_country || "Remote";
    const type = formatType(job.job_employment_type);
    const posted = job.job_posted_at_datetime_utc
      ? timeAgo(job.job_posted_at_datetime_utc)
      : "";

    div.innerHTML = `
      <div>
        <div class="job-title">${job.job_title}</div>
        <div class="company">${job.employer_name}</div>
        <div class="job-meta-row">
          <span>📍 ${city}</span>
          ${type ? `<span class="badge type">${type}</span>` : ""}
          ${posted ? `<span class="badge posted">${posted}</span>` : ""}
        </div>
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

/* FORMAT EMPLOYMENT TYPE */
function formatType(type) {
  if (!type) return "";
  const key = type.toUpperCase().replace(/[\s\-_]/g, "");
  const map = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    CONTRACT: "Contract",
    CONTRACTOR: "Contract",
    INTERN: "Internship",
    INTERNSHIP: "Internship",
  };
  return map[key] || type;
}

/* TIME AGO */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
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
      btn.textContent = "✅";
      btn.disabled = true;
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
    savedJobsDiv.innerHTML = "<p class='empty'>No saved jobs yet</p>";
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
