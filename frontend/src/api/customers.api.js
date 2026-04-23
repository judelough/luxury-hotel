import { http } from "./http";
import { endpoints } from "./endpoints";

export const customersApi = {
    create: (payload) => http.post(endpoints.customers, payload),
};
