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

export const askRepoQuestion = async ({ repositoryId, question, sessionId }) => {
  try {
    const response = await API.post("/api/chat/ask", {
      repositoryId,
      question,
      sessionId,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to get chat response",
      status: error?.response?.status || 500,
    };
  }
};
