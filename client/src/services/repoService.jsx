import { API } from "./API";

export const submitRepo = async (repoData) => {
 try{
    console.log("Submitting repository data:", repoData);
    const reponse = await API.post("/api/repo", repoData);
    return reponse.data;
 }catch(error){
    return {
        success : false,
        message : error?.response?.data?.message || error?.message || "Failed to submit repository",
        status : error?.response?.status || 500
    }
 }
}