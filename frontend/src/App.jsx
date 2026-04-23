import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";

import Landing from "./pages/public/Landing";
import HotelDetails from "./pages/public/HotelDetails";
import SearchRooms from "./pages/public/SearchRooms";
import RoomDetails from "./pages/public/RoomDetails";
import BookRoom from "./pages/public/BookRoom";
import HotelChains from "./pages/public/HotelChains.jsx";
import Hotels from "./pages/public/Hotels.jsx";
import ReservationConfirmation from "./pages/public/ReservationConfirmation.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/hotels" element={<Hotels />} />
                    <Route path="/hotels/:id" element={<HotelDetails />} />
                    <Route path="/search" element={<SearchRooms />} />
                    <Route path="/rooms/:roomId" element={<RoomDetails />} />
                    <Route path="/book/:roomId" element={<BookRoom />} />
                    <Route path="/hotel-chains" element={<HotelChains />} />
                    <Route path="/reservations/:id/confirmation" element={<ReservationConfirmation />} />

                </Route>
            </Routes>
        </BrowserRouter>
    );
}
