import { API } from "./API";

export const submitRepo = async (repoData) => {
  try {
    const response = await API.post("/api/repo", repoData);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit repository",
      status: error?.response?.status || 500,
    };
  }
};

export const askRepoQuestion = async ({ repositoryId, question, sessionId, onToken }) => {
  try {
    const url = `${API.defaults.baseURL || ""}/api/chat/ask`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: onToken ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify({ repositoryId, question, sessionId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        success: false,
        message: body?.message || `Chat request failed (${response.status}).`,
        status: response.status,
      };
    }

    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      return await response.json();
    }

    if (!response.body) return { success: false, message: "Streaming is unavailable in this browser." };
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = null;
    let streamError = null;

    const consumeEvent = (rawEvent) => {
      let eventName = "message";
      const dataLines = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) return;
      let data;
      try { data = JSON.parse(dataLines.join("\n")); } catch { return; }
      if (eventName === "token") onToken?.(data.token || "");
      if (eventName === "done") result = data;
      if (eventName === "error") streamError = data.message || "Chat request failed.";
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replace(/\r\n/g, "\n");
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.forEach(consumeEvent);
      if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
    if (streamError) return { success: false, message: streamError };
    return result || { success: false, message: "The chat stream ended before a response was received." };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "Failed to get chat response",
      status: 500,
    };
  }
};

export const getChatSessions = async () => {
  try {
    const response = await API.get("/api/chat/sessions");
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to load chat history",
      data: [],
    };
  }
};

export const getChatSession = async (sessionId) => {
  try {
    const response = await API.get(`/api/chat/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to load chat",
    };
  }
};

export const getRepositoryById = async (repositoryId) => {
  try {
    const response = await API.get(`/api/repo/${repositoryId}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to load repository",
    };
  }
};
