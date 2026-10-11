const API = `${location.protocol === "file:" ? "http://localhost:5000" : location.origin}/api`;
const DEMO_SPRINTS = [
  { order: 1, title: "Accept TCP Connections", goal: "Create a server capable of accepting TCP connections from clients.", definitionOfDone: ["Server starts successfully", "Client can establish a TCP connection", "Server receives PING and responds with PONG"], hints: ["What Node.js module provides low-level TCP networking?", "Look into Node's net module.", "A TCP server needs to listen for incoming connections."] },
  { order: 2, title: "Understand HTTP Requests", goal: "Read the incoming request and identify its method, path, and HTTP version.", definitionOfDone: ["Detect the request method", "Extract the request path", "Identify the HTTP version"], hints: ["Start by inspecting the first line of the request.", "The first line is split into three parts separated by spaces.", "Try logging the method, path, and version after parsing."] },
  { order: 3, title: "Build HTTP Responses", goal: "Construct valid HTTP responses manually.", definitionOfDone: ["Return a status code", "Include response headers", "Send a response body"], hints: ["HTTP responses start with a status line.", "Separate the headers and body with a blank line.", "Remember to include Content-Length or close the connection."] },
  { order: 4, title: "Implement Routing", goal: "Allow different URLs to produce different responses.", definitionOfDone: ["Support multiple paths", "Return different responses for different paths", "Handle unknown routes"], hints: ["You already have the requested path.", "What data structure could map a path to a handler?", "Think about a routing table."] },
  { order: 5, title: "Handle Multiple Requests", goal: "Make the server capable of handling multiple clients and requests.", definitionOfDone: ["Handle multiple connections", "Handle multiple requests", "Keep the server alive after malformed input"], hints: ["Node.js networking is event-driven.", "Think about what happens when multiple connections arrive.", "Separate connection handling from request parsing."] }
];
const STARTER_CODE = `const net = require('net');

const server = net.createServer((socket) => {
  // TODO: read the request and identify method, path, version
  socket.on('data', (data) => {
    console.log(data.toString());
  });
});`;

const $ = (id) => document.getElementById(id);
const state = { projects: [], project: null, sprints: DEMO_SPRINTS, current: 1, completed: new Set([0]), hints: 1, token: localStorage.getItem("artifice-token"), userId: null, signup: false, preview: true, latestResults: null, view: "community", posts: [], openPostAfterAuth: false, editingPostId: null, projectQuery: "" };

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function api(path, options = {}) {
  const { body, ...requestOptions } = options;
  const response = await fetch(`${API}${path}`, {
    ...requestOptions,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...requestOptions.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.message || `Request failed (${response.status})`), { status: response.status, result });
  return result;
}

function fallbackProject() {
  return { title: "Build an HTTP Server", description: "Learn networking by building from the ground up.", language: "javascript", difficulty: "intermediate", slug: "build-http-server", _id: "demo" };
}

async function loadWorkspace() {
  try {
    const result = await api("/projects");
    state.projects = result.data || [];
  } catch {
    state.projects = [];
  }
  if (state.token) {
    try {
      const me = await api("/auth/me");
      state.userId = String(me.data?._id || "");
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("artifice-token");
        state.token = null;
        state.userId = null;
      }
      state.userId = null;
    }
  } else state.userId = null;
  state.project = state.projects.find((project) => project.slug === "build-http-server") || state.projects[0] || fallbackProject();
  renderProjectChoices();
  renderProjectCatalog();
  updateAccount();
  renderCommunity();
  loadPosts();
}

async function selectProject(projectId) {
  state.project = state.projects.find((project) => String(project._id) === String(projectId)) || fallbackProject();
  state.view = "projects";
  state.sprints = DEMO_SPRINTS;
  state.current = 0;
  state.completed = new Set();
  state.latestResults = null;
  delete $("codeEditor").dataset.dirty;
  setView("projects");
  renderProjectChoices();

  if (state.project._id !== "demo") {
    try {
      const sprintResult = await api(`/sprints/project/${state.project._id}`);
      state.sprints = sprintResult.data?.length ? sprintResult.data : DEMO_SPRINTS;
      if (!state.token) {
        state.preview = true;
        state.current = Math.min(1, state.sprints.length - 1);
      } else {
        const progress = (await api(`/progress/${state.project._id}`)).data;
      state.completed = new Set((progress.completedSprints || []).map((id) => state.sprints.findIndex((s) => String(s._id) === String(id?._id || id))).filter((i) => i >= 0));
      const currentId = progress.currentSprint?._id || progress.currentSprint;
      state.current = currentId ? Math.max(0, state.sprints.findIndex((s) => String(s._id) === String(currentId))) : Math.max(0, state.sprints.length - 1);
      state.preview = false;
      }
    } catch (error) {
      state.current = 0;
      state.completed = new Set();
      state.preview = !state.token;
      if (error.status === 401) {
        localStorage.removeItem("artifice-token");
        state.token = null;
        state.preview = true;
        updateAccount();
      }
    }
  }
  render();
}

function setView(view) {
  state.view = view;
  $("communityView").hidden = view !== "community";
  $("projectCatalog").hidden = view !== "catalog";
  $("projectView").hidden = view !== "projects";
  $("sprintNavigation").hidden = view !== "projects";
  const activeNav = view === "catalog" ? "projects" : view;
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === activeNav));
  if (view === "community") renderCommunity();
  if (view === "catalog") renderProjectCatalog();
}

function renderProjectChoices() {
  const choices = matchingProjects();
  $("projectChoices").innerHTML = choices.length ? choices.map((project) => `
    <button class="project-choice ${state.view === "projects" && String(project._id) === String(state.project?._id) ? "selected" : ""}" data-project="${escapeHtml(project._id)}">
      <span class="project-list-icon">▤</span><span class="project-choice-copy"><b>${escapeHtml(project.title || "Untitled project")}</b><small>${escapeHtml(project.difficulty || "Project")}${project.language ? ` · ${escapeHtml(project.language)}` : ""}</small></span><span class="side-arrow">›</span>
    </button>`).join("") : '<p class="project-search-empty">No projects match your search.</p>';
  $("projectChoices").querySelectorAll("[data-project]").forEach((button) => button.addEventListener("click", () => selectProject(button.dataset.project)));
}

function matchingProjects() {
  const projects = state.projects.length ? state.projects : [fallbackProject()];
  const query = state.projectQuery.trim().toLocaleLowerCase();
  if (!query) return projects;
  return projects.filter((project) => [project.title, project.description, project.language, project.difficulty]
    .some((value) => String(value || "").toLocaleLowerCase().includes(query)));
}

function renderProjectCatalog() {
  const projects = matchingProjects();
  $("catalogGrid").innerHTML = projects.length ? projects.map((project) => `
    <article class="catalog-card">
      <div class="catalog-card-art" aria-hidden="true"><span>▤</span><i>✳</i></div>
      <div class="catalog-card-content">
        <div class="catalog-card-meta"><span>${escapeHtml(project.difficulty || "Project")}</span><span>${escapeHtml(project.language || "Self-paced")}</span></div>
        <h2>${escapeHtml(project.title || "Untitled project")}</h2>
        <p>${escapeHtml(project.description || "A hands-on project to build your skills step by step.")}</p>
        <div class="catalog-card-footer"><span>${project.estimatedHours ? `${escapeHtml(project.estimatedHours)} hour${Number(project.estimatedHours) === 1 ? "" : "s"}` : "Learn at your own pace"}</span><button class="run-button" data-open-project="${escapeHtml(project._id)}">Choose project <span>›</span></button></div>
      </div>
    </article>`).join("") : '<p class="catalog-empty">No projects match your search. Try another title, language, or skill level.</p>';
  $("catalogGrid").querySelectorAll("[data-open-project]").forEach((button) => button.addEventListener("click", () => selectProject(button.dataset.openProject)));
}

function render() {
  if (!state.project) return;
  const sprint = state.sprints[state.current] || DEMO_SPRINTS[state.current] || DEMO_SPRINTS[0];
  const projectTitle = state.project.title || "Build an HTTP Server";
  $("projectTitle").textContent = projectTitle;
  $("projectDescription").textContent = state.project.description || "Learn networking by building from the ground up.";
  $("projectDifficulty").textContent = `PROJECT  /  ${(state.project.language || "javascript").toUpperCase()}`;
  $("sprintNumber").textContent = `SPRINT ${String(sprint.order || state.current + 1).padStart(2, "0")}`;
  $("sprintCategory").textContent = state.current < 2 ? "NETWORKING BASICS" : "SERVER BUILDING";
  $("sprintTitle").textContent = sprint.title;
  $("sprintGoal").textContent = sprint.goal || "Build and test this part of your project.";
  renderSprints();
  renderDefinition(sprint);
  renderHints(sprint);
  renderTests(sprint);
  renderProjectChoices();

  const codeKey = getCodeKey(sprint);
  if (!$("codeEditor").dataset.dirty) {
    $("codeEditor").value = localStorage.getItem(codeKey) || starterFor(sprint);
  }
  syncLines();
}

function postDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function renderCommunity() {
  const posts = state.posts || [];
  $("feedCount").textContent = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;
  $("communityFeed").innerHTML = posts.length ? posts.map((post) => {
    const author = post.authorId?.name || "Artifice member";
    const isOwner = state.token && state.userId && String(post.authorId?._id) === state.userId;
    const initials = author.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";
    return `<article class="community-post">
      <div class="post-author"><span class="post-avatar" aria-hidden="true">${escapeHtml(initials)}</span><div><b>${escapeHtml(author)}</b><time datetime="${escapeHtml(post.createdAt || "")}">${escapeHtml(postDate(post.createdAt))}${post.updatedAt && post.updatedAt !== post.createdAt ? " · edited" : ""}</time></div><span class="post-topic">${escapeHtml(post.topic || "Tech")}</span>${isOwner ? `<div class="post-owner-actions"><button type="button" data-edit-post="${escapeHtml(post._id)}">Edit</button><button type="button" class="delete-post-button" data-delete-post="${escapeHtml(post._id)}">Delete</button></div>` : ""}</div>
      <h2>${escapeHtml(post.title)}</h2><p class="post-copy">${escapeHtml(post.body)}</p>
    </article>`;
  }).join("") : `<section class="feed-empty"><span class="empty-sparkle">✳</span><h2>It’s quiet here—for now.</h2><p>The community is just getting started. Share a tech idea, a question, or something you learned and start the first conversation.</p><button class="run-button" id="emptyWritePost"><span>＋</span> Write the first post</button></section>`;
  $("emptyWritePost")?.addEventListener("click", openPostComposer);
  $("communityFeed").querySelectorAll("[data-edit-post]").forEach((button) => button.addEventListener("click", () => editPost(button.dataset.editPost)));
  $("communityFeed").querySelectorAll("[data-delete-post]").forEach((button) => button.addEventListener("click", () => removePost(button.dataset.deletePost)));
}

async function loadPosts() {
  $("communityFeed").innerHTML = '<p class="feed-loading">Loading the community…</p>';
  try {
    const result = await api("/posts");
    state.posts = result.data || [];
    renderCommunity();
  } catch (error) {
    $("communityFeed").innerHTML = `<p class="feed-error">${escapeHtml(error.message || "Could not load posts. Please refresh to try again.")}</p>`;
  }
}

function openPostComposer() {
  if (!state.token) {
    state.openPostAfterAuth = true;
    openAuth();
    return;
  }
  state.editingPostId = null;
  $("postForm").reset();
  $("postDialogTitle").textContent = "Write a tech post";
  $("postSubmit").textContent = "Publish post";
  $("postError").textContent = "";
  $("postDialog").showModal();
}

function editPost(postId) {
  const post = state.posts.find((item) => String(item._id) === String(postId));
  if (!post) return;
  state.editingPostId = String(postId);
  $("postTitle").value = post.title || "";
  $("postTopic").value = post.topic || "";
  $("postBody").value = post.body || "";
  $("postDialogTitle").textContent = "Edit your post";
  $("postSubmit").textContent = "Save changes";
  $("postError").textContent = "";
  $("postDialog").showModal();
}

async function removePost(postId) {
  if (!window.confirm("Delete this post? This can’t be undone.")) return;
  try {
    await api(`/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
    state.posts = state.posts.filter((post) => String(post._id) !== String(postId));
    renderCommunity();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("artifice-token");
      state.token = null;
      state.userId = null;
      updateAccount();
      renderCommunity();
      openAuth();
      return;
    }
    window.alert(error.message || "Could not delete the post.");
  }
}

async function publishPost(event) {
  event.preventDefault();
  const button = $("postSubmit");
  button.disabled = true;
  button.textContent = "Publishing…";
  $("postError").textContent = "";
  try {
    const result = await api(state.editingPostId ? `/posts/${encodeURIComponent(state.editingPostId)}` : "/posts", {
      method: state.editingPostId ? "PATCH" : "POST",
      body: {
        title: $("postTitle").value,
        topic: $("postTopic").value,
        body: $("postBody").value
      }
    });
    state.posts = state.editingPostId
      ? state.posts.map((post) => String(post._id) === state.editingPostId ? result.data : post)
      : [result.data, ...state.posts];
    state.editingPostId = null;
    $("postForm").reset();
    $("postDialog").close();
    setView("community");
    renderCommunity();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("artifice-token");
      state.token = null;
      state.userId = null;
      updateAccount();
      $("postDialog").close();
      state.openPostAfterAuth = true;
      openAuth();
      return;
    }
    $("postError").textContent = error.message || "Could not publish your post.";
  } finally {
    button.disabled = false;
    button.textContent = state.editingPostId ? "Save changes" : "Publish post";
  }
}

function renderSprints() {
  $("sprintList").innerHTML = state.sprints.map((sprint, index) => {
    const isDone = state.completed.has(index);
    const isCurrent = index === state.current;
    const locked = !state.preview && index > state.current && !isDone;
    const title = escapeHtml(sprint.title || `Sprint ${index + 1}`);
    const status = isDone ? "✓" : locked ? "♙" : "";
    return `<button class="sprint-item ${isCurrent ? "current" : ""} ${isDone ? "done" : ""} ${locked ? "locked" : ""}" data-sprint="${index}" ${locked ? "aria-disabled=true" : ""}><span class="sprint-status">${status}</span><span class="sprint-order">${String(index + 1).padStart(2, "0")}</span><span class="sprint-name">${title}</span>${isDone ? '<span class="sprint-done">✓</span>' : ""}</button>`;
  }).join("");
  $("sprintList").querySelectorAll(".sprint-item").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.sprint);
    if (button.classList.contains("locked")) return;
    state.current = index;
    state.hints = 1;
    delete $("codeEditor").dataset.dirty;
    state.latestResults = null;
    render();
  }));
}

function renderDefinition(sprint) {
  const items = sprint.definitionOfDone || sprint.requirements || [];
  const checks = state.latestResults?.results || [];
  $("definitionList").innerHTML = items.slice(0, 5).map((item, index) => {
    const passed = Boolean(checks[index]?.passed);
    return `<li><button class="check-circle ${passed ? "checked" : ""}" data-definition="${index}" aria-label="${passed ? "Mark incomplete" : "Mark complete"}">${passed ? "✓" : ""}</button><span>${escapeHtml(item)}</span></li>`;
  }).join("");
  $("definitionList").querySelectorAll(".check-circle").forEach((button) => button.addEventListener("click", () => button.classList.toggle("checked")));
}

function renderHints(sprint) {
  const hints = sprint.hints || DEMO_SPRINTS[state.current]?.hints || DEMO_SPRINTS[1].hints;
  const count = Math.max(hints.length, 1);
  state.hints = Math.min(state.hints, count);
  $("hintCount").textContent = `Hint ${state.hints} of ${count}`;
  $("hintText").textContent = hints[state.hints - 1] || "No hint available for this sprint yet.";
  $("hintPrev").disabled = state.hints <= 1;
  $("hintNext").disabled = state.hints >= count;
}

function renderTests(sprint) {
  const checks = state.latestResults?.results;
  const specChecks = sprint.testSpec?.checks || [];
  const demoTests = ["Parses GET method correctly", "Extracts request path correctly", "Identifies HTTP version"];
  const labels = checks?.length ? checks.map((test) => niceCheckName(test.check)) : specChecks.length ? specChecks.map((test) => niceCheckName(test.type)) : demoTests;
  const passing = checks?.filter((test) => test.passed).length ?? (state.preview ? 2 : 0);
  $("testsSummary").textContent = `${passing} / ${labels.length}`;
  $("testResults").innerHTML = labels.map((label, index) => {
    const result = checks?.[index];
    const status = result ? (result.passed ? "pass" : "fail") : (state.preview && state.current === 1 && index < 2 ? "pass" : "pending");
    return `<div class="test-row"><span class="test-indicator ${status}">${status === "pass" ? "✓" : status === "fail" ? "×" : ""}</span><span>${escapeHtml(label)}</span>${result?.error ? `<button class="test-more" title="${escapeHtml(result.error)}">…</button>` : ""}</div>`;
  }).join("");
}

function niceCheckName(type = "test") {
  const names = { server_starts: "Server starts successfully", http_request: "Receives an HTTP request", method_detection: "Parses request method correctly", path_detection: "Extracts request path correctly", http_version_detection: "Identifies HTTP version", tcp_connection: "Accepts a TCP connection", receives_data: "Receives client data", sends_response: "Responds to the client", multiple_connections: "Accepts multiple connections", multiple_requests: "Handles multiple requests", malformed_request: "Handles malformed input", server_stays_alive: "Server stays running", route: "Route responds correctly", status_code: "Returns the expected status", headers: "Includes response headers", response_body: "Returns the expected body", unknown_route: "Handles unknown routes" };
  return names[type] || type.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

function starterFor(sprint) {
  if (state.current === 0) return `const net = require('net');\n\nconst server = net.createServer((socket) => {\n  socket.on('data', (data) => {\n    // TODO: respond to the client\n  });\n});\n\nserver.listen(3000);`;
  return STARTER_CODE;
}

function getCodeKey(sprint) { return `artifice-code-${state.project?._id || "demo"}-${sprint._id || sprint.order}`; }

function syncLines() {
  const lines = Math.max($("codeEditor").value.split("\n").length, 8);
  $("lineNumbers").innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("<br>");
}

function updateAccount() {
  $("accountLabel").textContent = state.token ? "You’re signed in" : "You’re viewing a preview";
  $("authAction").textContent = state.token ? "Log out" : "Log in";
  $("profileAction").hidden = !state.token;
}

function profileDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderProfile(profile) {
  const { user, projects = [], submissions = [] } = profile;
  const completedCount = projects.filter((item) => item.status === "completed").length;
  const currentProjects = projects.filter((item) => item.status === "in_progress");
  const projectCards = projects.length ? projects.map((item) => {
    const project = item.project || {};
    const sprint = item.currentSprint;
    const isComplete = item.status === "completed";
    return `<article class="profile-project">
      <div class="profile-card-heading"><h4>${escapeHtml(project.title || "Untitled project")}</h4><span class="profile-status ${isComplete ? "complete" : "active"}">${isComplete ? "Completed" : "In progress"}</span></div>
      <p>${escapeHtml(project.description || (isComplete ? "All sprints completed." : "Your project workspace is in progress."))}</p>
      <div class="profile-project-meta">${isComplete ? `${item.completedSprints?.length || 0} sprints completed` : `Currently on ${escapeHtml(sprint?.title || "a sprint")}`}</div>
    </article>`;
  }).join("") : '<p class="profile-empty">No projects started yet. Start a project and your progress will appear here.</p>';
  const attemptCards = submissions.length ? submissions.map((attempt) => {
    const passed = attempt.status === "passed";
    const results = attempt.testResults || {};
    const testSummary = Number.isFinite(results.passedTests) && Number.isFinite(results.totalTests)
      ? `${results.passedTests} of ${results.totalTests} tests passed`
      : "Test results saved";
    return `<article class="profile-attempt">
      <div class="profile-card-heading"><h4>${escapeHtml(attempt.project?.title || "Project")}</h4><span class="profile-status ${passed ? "complete" : "attempted"}">${passed ? "Passed" : attempt.status === "pending" ? "Pending" : "Attempted"}</span></div>
      <p class="profile-attempt-meta">Sprint ${escapeHtml(attempt.sprint?.order ?? "")} · ${escapeHtml(attempt.sprint?.title || "Sprint")} · ${escapeHtml((attempt.language || "").toUpperCase())} · ${escapeHtml(profileDate(attempt.createdAt))}</p>
      <p class="profile-test-summary">${escapeHtml(testSummary)}</p>
      <details class="profile-code"><summary>View submitted code</summary><pre><code>${escapeHtml(attempt.code || "No code was saved for this attempt.")}</code></pre></details>
    </article>`;
  }).join("") : '<p class="profile-empty">No code attempts yet. Submitted code will be listed here.</p>';

  $("profileContent").innerHTML = `
    <section class="profile-identity"><span class="profile-avatar" aria-hidden="true">${escapeHtml((user.name || "A").trim().charAt(0).toUpperCase())}</span><div><h3>${escapeHtml(user.name || "Artifice learner")}</h3><p>${escapeHtml(user.email || "")}</p><small>Member since ${escapeHtml(profileDate(user.createdAt))}</small></div></section>
    <div class="profile-stats"><div><b>${projects.length}</b><span>Projects</span></div><div><b>${completedCount}</b><span>Completed</span></div><div><b>${currentProjects.length}</b><span>In progress</span></div><div><b>${submissions.length}</b><span>Code attempts</span></div></div>
    <section class="profile-section"><div class="profile-section-heading"><h3>Your projects</h3><span>${projects.length}</span></div><div class="profile-list">${projectCards}</div></section>
    <section class="profile-section"><div class="profile-section-heading"><h3>Code attempts</h3><span>${submissions.length}</span></div><div class="profile-list">${attemptCards}</div></section>`;
}

async function openProfile() {
  $("accountMenu").hidden = true;
  $("accountButton").setAttribute("aria-expanded", "false");
  $("profileDialog").showModal();
  $("profileContent").innerHTML = '<p class="profile-loading">Loading your learning activity…</p>';
  try {
    const response = await api("/profile");
    renderProfile(response.data || {});
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("artifice-token");
      state.token = null;
      state.userId = null;
      updateAccount();
      $("profileDialog").close();
      openAuth();
      return;
    }
    $("profileContent").innerHTML = `<p class="profile-error">${escapeHtml(error.message || "Could not load your profile. Please try again.")}</p>`;
  }
}

function openAuth() {
  $("authError").textContent = "";
  $("authDialog").showModal();
}

function setAuthMode(signup) {
  state.signup = signup;
  $("authTitle").textContent = signup ? "Create your Artifice account" : "Log in to keep building";
  $("authSubmit").textContent = signup ? "Create account" : "Log in";
  $("authToggle").textContent = signup ? "Already have an account? Log in" : "Create an account";
  $("nameLabel").hidden = !signup;
  $("authName").required = signup;
  $("authPassword").autocomplete = signup ? "new-password" : "current-password";
}

function showMessage(message, isError = false) {
  const feedback = $("submissionFeedback");
  feedback.hidden = false;
  feedback.classList.toggle("error", isError);
  feedback.textContent = message;
}

async function submitCode() {
  if (!state.token) {
    showMessage("Log in to submit your work and save your progress.", true);
    openAuth();
    return;
  }
  if (state.project?._id === "demo") {
    showMessage("The API isn’t connected yet. Start the backend to submit this sprint.", true);
    return;
  }
  const sprint = state.sprints[state.current];
  if (!sprint?._id) return;
  const button = $("runTests");
  button.disabled = true;
  button.innerHTML = "<span>◌</span> Running…";
  showMessage("Running your sprint tests…");
  state.latestResults = null;
  try {
    const response = await api(`/submissions/projects/${state.project._id}/sprints/${sprint._id}`, { method: "POST", body: { code: $("codeEditor").value, language: state.project.language || "javascript" } });
    state.latestResults = response.data.tests;
    const progress = response.data.progress;
    if (response.data.submission.status === "passed") {
      state.completed.add(state.current);
      if (progress.currentSprint) {
        const id = progress.currentSprint._id || progress.currentSprint;
        const next = state.sprints.findIndex((item) => String(item._id) === String(id));
        if (next >= 0) state.current = next;
      }
      showMessage(progress.currentSprint ? "Sprint passed! The next sprint is unlocked." : "Project complete — beautiful work!");
    } else {
      showMessage("Some tests didn’t pass yet. Review the results and try again.", true);
    }
    render();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("artifice-token");
      state.token = null;
      state.userId = null;
      updateAccount();
      openAuth();
    }
    showMessage(error.message, true);
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>▶</span> Run tests";
  }
}

$("accountButton").addEventListener("click", () => {
  const menu = $("accountMenu");
  menu.hidden = !menu.hidden;
  $("accountButton").setAttribute("aria-expanded", String(!menu.hidden));
});
$("profileAction").addEventListener("click", openProfile);
$("closeProfile").addEventListener("click", () => $("profileDialog").close());
$("writePostButton").addEventListener("click", openPostComposer);
$("projectSearch").addEventListener("input", (event) => {
  state.projectQuery = event.target.value;
  renderProjectChoices();
  renderProjectCatalog();
});
$("closePost").addEventListener("click", () => $("postDialog").close());
$("postForm").addEventListener("submit", publishPost);
$("authAction").addEventListener("click", () => {
  $("accountMenu").hidden = true;
  if (state.token) {
    localStorage.removeItem("artifice-token");
    state.token = null;
    state.userId = null;
    state.preview = true;
    state.current = 1;
    state.completed = new Set([0]);
    updateAccount(); render();
  } else openAuth();
});
$("authToggle").addEventListener("click", () => setAuthMode(!state.signup));
$("closeAuth").addEventListener("click", () => $("authDialog").close());
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("authError").textContent = "";
  const payload = { email: $("authEmail").value, password: $("authPassword").value };
  if (state.signup) payload.name = $("authName").value;
  try {
    if (state.signup) await api("/auth/register", { method: "POST", body: payload });
    const login = await api("/auth/login", { method: "POST", body: { email: payload.email, password: payload.password } });
    state.token = login.data.token;
    state.userId = String(login.data.user?.id || "");
    localStorage.setItem("artifice-token", state.token);
    $("authDialog").close();
    await loadWorkspace();
    if (state.openPostAfterAuth) {
      state.openPostAfterAuth = false;
      openPostComposer();
    }
  } catch (error) { $("authError").textContent = error.message; }
});
$("hintPrev").addEventListener("click", () => { state.hints = Math.max(1, state.hints - 1); renderHints(state.sprints[state.current]); });
$("hintNext").addEventListener("click", async () => {
  const sprint = state.sprints[state.current];
  const max = sprint.hints?.length || DEMO_SPRINTS[state.current]?.hints.length || 3;
  state.hints = Math.min(max, state.hints + 1);
  if (state.token && sprint._id) {
    try {
      const result = await api(`/sprints/${sprint._id}/hints?level=${state.hints}`);
      $("hintText").textContent = result.data.hints.at(-1) || $("hintText").textContent;
      $("hintCount").textContent = `Hint ${state.hints} of ${max}`;
      $("hintPrev").disabled = state.hints <= 1;
      $("hintNext").disabled = state.hints >= max;
      return;
    } catch (error) { if (error.status === 403) showMessage("Hints are available for your current or completed sprint.", true); }
  }
  renderHints(sprint);
});
$("runTests").addEventListener("click", submitCode);
$("codeEditor").addEventListener("input", () => {
  const sprint = state.sprints[state.current];
  $("codeEditor").dataset.dirty = "true";
  localStorage.setItem(getCodeKey(sprint), $("codeEditor").value);
  $("saveStatus").textContent = "Saved locally";
  syncLines();
});
$("codeEditor").addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); submitCode(); }
  if (event.key === "Tab") { event.preventDefault(); const start = event.target.selectionStart; event.target.setRangeText("  ", start, event.target.selectionEnd, "end"); event.target.dispatchEvent(new Event("input")); }
});
$("expandEditor").addEventListener("click", () => $("editorPanel").requestFullscreen?.());
document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => {
  if (button.dataset.view === "community") setView("community");
  if (button.dataset.view === "projects") setView("catalog");
  if (button.dataset.view === "learning") {
    if (state.token) openProfile();
    else openAuth();
  }
}));

setAuthMode(false);
state.project = fallbackProject();
state.projects = [state.project];
setView("community");
render();
loadWorkspace();
