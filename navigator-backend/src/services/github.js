const axios = require('axios');

const gh = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});

const ORG = process.env.GITHUB_ORG;

// Get recent commits for a repo
async function getRecentCommits(repo, hours = 4) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data } = await gh.get(`/repos/${ORG}/${repo}/commits`, {
    params: { since, per_page: 30 }
  });
  return data.map(c => ({
    sha: c.sha,
    author: c.commit.author.name,
    email: c.commit.author.email,
    message: c.commit.message,
    pushed_at: c.commit.author.date,
    url: c.html_url
  }));
}

// Get a specific commit detail
async function getCommit(repo, sha) {
  const { data } = await gh.get(`/repos/${ORG}/${repo}/commits/${sha}`);
  return {
    sha: data.sha,
    author: data.commit.author.name,
    message: data.commit.message,
    files: data.files.map(f => ({ filename: f.filename, status: f.status, changes: f.changes })),
    stats: data.stats,
    url: data.html_url
  };
}

// Get open pull requests
async function getOpenPRs(repo) {
  const { data } = await gh.get(`/repos/${ORG}/${repo}/pulls`, {
    params: { state: 'open', sort: 'updated', direction: 'desc', per_page: 20 }
  });
  return data.map(p => ({
    number: p.number,
    title: p.title,
    author: p.user.login,
    branch: p.head.ref,
    created_at: p.created_at,
    url: p.html_url
  }));
}

// Get recent deployments
async function getDeployments(repo, environment = 'production') {
  const { data } = await gh.get(`/repos/${ORG}/${repo}/deployments`, {
    params: { environment, per_page: 10 }
  });
  return data;
}

// Get deployment statuses
async function getDeploymentStatus(repo, deploymentId) {
  const { data } = await gh.get(`/repos/${ORG}/${repo}/deployments/${deploymentId}/statuses`);
  return data;
}

// Get workflow runs (CI/CD)
async function getWorkflowRuns(repo) {
  const { data } = await gh.get(`/repos/${ORG}/${repo}/actions/runs`, {
    params: { per_page: 10, status: 'completed' }
  });
  return data.workflow_runs.map(r => ({
    id: r.id,
    name: r.name,
    conclusion: r.conclusion,
    created_at: r.created_at,
    url: r.html_url,
    branch: r.head_branch,
    commit: r.head_sha.slice(0, 7)
  }));
}

// Search code for a string
async function searchCode(query, repo) {
  const q = repo ? `${query} repo:${ORG}/${repo}` : `${query} org:${ORG}`;
  const { data } = await gh.get('/search/code', { params: { q, per_page: 10 } });
  return data.items;
}

module.exports = {
  getRecentCommits,
  getCommit,
  getOpenPRs,
  getDeployments,
  getDeploymentStatus,
  getWorkflowRuns,
  searchCode
};