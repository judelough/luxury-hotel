import { http } from "./http";
import { endpoints } from "./endpoints";

export const hotelsApi = {
    list: () => http.get(endpoints.hotels),
    get: (id) => http.get(`${endpoints.hotels}/${id}`),
};
