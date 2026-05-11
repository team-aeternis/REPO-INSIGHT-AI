import { API } from "./API";

export const getResult = async (data) => {
  const response = await API.post("/job", data);
  return response.data;
};