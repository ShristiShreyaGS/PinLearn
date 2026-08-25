import { apiRequest } from "./client";

export async function fetchVideoPage(topic, { pageToken = "", search = "" } = {}) {
  const params = new URLSearchParams({ topic });
  if (pageToken) params.set("pageToken", pageToken);
  if (search) params.set("search", search);
  const data = await apiRequest(`/api/youtube?${params.toString()}`);

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextPageToken: data?.nextPageToken || ""
  };
}

export async function fetchVideos(topic) {
  const page = await fetchVideoPage(topic);
  return page.items;
}

function normalizeRepositories(topic, items) {
  return Array.isArray(items)
    ? items.map((repository) => ({
        id: `github-${repository.id}`,
        topic,
        type: "Repository",
        title: repository.full_name,
        description: repository.description || "No description provided.",
        image: repository.owner?.avatar_url || "https://placehold.co/600x400",
        url: repository.html_url,
        source: `GitHub | ${Number(repository.stargazers_count || 0).toLocaleString()} stars`
      }))
    : [];
}

export async function fetchRepositoryPage(topic, { page = 1, search = "" } = {}) {
  const params = new URLSearchParams({ topic, page: String(page) });
  if (search) params.set("search", search);
  const data = await apiRequest(`/api/github?${params.toString()}`);

  return {
    items: normalizeRepositories(topic, data?.items),
    hasNextPage: Boolean(data?.has_next_page)
  };
}

export async function fetchRepositories(topic) {
  const page = await fetchRepositoryPage(topic);
  return page.items;
}
