const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Normalize base url (no trailing slash)
const BASE_URL =
    (RAW_BASE_URL && RAW_BASE_URL.trim().replace(/\/+$/, "")) ||
    "http://localhost:8080";

async function request(
    path,
    { method = "GET", body, headers, signal } = {}
) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        signal, // ✅ AbortController support
        headers: {
            "Content-Type": "application/json",
            ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    const data =
        text && contentType.includes("application/json")
            ? JSON.parse(text)
            : text || null;

    if (!res.ok) {
        const msg =
            (data && typeof data === "object" && (data.message || data.error)) ||
            (typeof data === "string" && data) ||
            `Request failed (${res.status})`;

        throw new Error(msg);
    }

    return data;
}

export const http = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) =>
        request(path, { ...options, method: "POST", body }),
    put: (path, body, options) =>
        request(path, { ...options, method: "PUT", body }),
    del: (path, options) => request(path, { ...options, method: "DELETE" }),
};
