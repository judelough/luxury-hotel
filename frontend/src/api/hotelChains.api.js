import { http } from "./http";
import { endpoints } from "./endpoints";

export const hotelChainsApi = {
    list: () => http.get(endpoints.hotelChains),
    get: (id) => http.get(`${endpoints.hotelChains}/${id}`),
};
