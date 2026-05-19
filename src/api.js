const API_BASE_URL = "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function login(username) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function getItems(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/items${query}`);
}

export function vote({ userId, itemId, choice, decisionMs }) {
  return request("/vote", {
    method: "POST",
    body: JSON.stringify({ userId, itemId, choice, decisionMs }),
  });
}

export function deleteVote({ userId, itemId }) {
  return request("/vote", {
    method: "DELETE",
    body: JSON.stringify({ userId, itemId }),
  });
}

export function getResults(sort) {
  return request(`/results?sort=${encodeURIComponent(sort)}`);
}

export function getMatches(userId) {
  return request(`/matches?userId=${encodeURIComponent(userId)}`);
}

export function getAnalytics() {
  return request("/analytics");
}
