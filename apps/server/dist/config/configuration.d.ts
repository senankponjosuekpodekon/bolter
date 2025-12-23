declare const _default: () => {
    port: number;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: number;
        refreshExpiresIn: number;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    frontend: {
        url: string;
    };
};
export default _default;
