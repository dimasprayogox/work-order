export const getCookie = (name) => {
    const nameLen = name.length + 1;
    return (
        document.cookie
            .split(";")
            .map((c) => c.trim())
            .filter((cookie) => cookie.substring(0, nameLen) === `${name}=`)
            .map((cookie) => decodeURIComponent(cookie.substring(nameLen)))[0] || null
    );
};

export const setCookie = (name, value, maxAge) => {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
};
