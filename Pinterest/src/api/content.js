import { apiRequest } from "./client";

export async function fetchVideos(topic) {
  const data = await apiRequest(
    `/api/youtube?topic=${encodeURIComponent(topic)}`
  );

  return Array.isArray(data) ? data : [];
}

export async function fetchRepositories(topic) {
  const data = await apiRequest(
    `/api/github?topic=${encodeURIComponent(topic)}`
  );

  return Array.isArray(data?.items)
    ? data.items.map((repository) => ({
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
