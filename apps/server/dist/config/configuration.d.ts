declare const _default: () => {
    port: number;
    app: {
        name: string;
        url: string;
        supportEmail: string;
        logoUrl: string;
        primaryColor: string;
    };
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
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
