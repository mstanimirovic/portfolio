const GITHUB_USER = "mstanimirovic";

const PROJECTS = ["portfolio", "berba", "skocko"];

const CACHE_KEY = "projects_cache";
const CACHE_TTL = 60 * 60 * 1000;

function getCachedProjects() {
  const raw = sessionStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const { timestamp, data } = JSON.parse(raw);

    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedProjects(data) {
  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    }),
  );
}

async function loadProjects() {
  const container = document.getElementById("projects");
  if (!container) return;

  const cached = getCachedProjects();
  if (cached && cached.length === PROJECTS.length) {
    cached.forEach((repo) => {
      container.appendChild(createProjectTemplate(repo));
    });
    return;
  }

  const repos = [];

  for (const repoName of PROJECTS) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${repoName}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (!res.ok) continue;

      const repo = await res.json();
      repos.push(repo);
      const article = createProjectTemplate(repo);
      container.appendChild(article);
    } catch (err) {
      console.error("Failed loading repo:", repoName, err);
    }
  }

  setCachedProjects(repos);
}

function createProjectTemplate(repo) {
  const article = document.createElement("article");
  article.className = "project";

  let html = `
    <div class="project__head">
      <a href="${repo.html_url}" target="_blank" rel="noreferrer">
        <span class="prompt">#</span>
        <h3 class="project__name">${repo.name}</h3>
        <span class="arrow">
          &#8599;
        </span>
      </a>
    </div>

    <p class="project__desc">
      ${repo.description ?? "No description provided."}
    </p>
  `;

  const topics = repo.topics.map((t) => t.replace(/-/g, " "));

  html = html.concat(`<div class="project__stack">`);
  for (const topic in topics) {
    html = html.concat(`
      <p class="topic">${topics[topic]}</p>
    `);
  }
  html = html.concat(`</div>`);

  article.innerHTML = html;

  return article;
}

function formatTopics(topics = []) {
  if (!topics.length) return "—";

  return topics.map((t) => t.replace(/-/g, " ")).join(" · ");
}

document.addEventListener("DOMContentLoaded", loadProjects);
