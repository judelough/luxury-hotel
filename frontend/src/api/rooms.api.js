import { http } from "./http";
import { endpoints } from "./endpoints";

export const roomsApi = {
    list: () => http.get(endpoints.rooms),
    get: (id) => http.get(`${endpoints.rooms}/${id}`),
};
