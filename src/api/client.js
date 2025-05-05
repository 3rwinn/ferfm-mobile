import { create } from "apisauce";
import constants from "../config/constants";
// import useStorage from "../hooks/useStorage";

const apiClient = create({
  baseURL: constants.SERVER,
});

const get = apiClient.get;
apiClient.get = async (url, params, axiosConfig) => {
  const response = await get(url, params, axiosConfig);
  if (response.ok) {
    // caches.store(url, response.data)
    return response;
  }

  // const data = await cache.get(url);
  // return data ? {ok: true, data} : response;

  return response;
};

export default apiClient;
