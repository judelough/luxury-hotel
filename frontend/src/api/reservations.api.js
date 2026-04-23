import { http } from "./http";
import { endpoints } from "./endpoints";

export const reservationsApi = {
    create: async (payload) => {
        try {
            return await http.post(endpoints.reservations, payload);
        } catch (e) {
            if (e?.response?.status === 409) {
                throw new Error(
                    e.response.data?.message ||
                    "Room is already booked for the selected dates."
                );
            }
            throw e;
        }
    },
};
