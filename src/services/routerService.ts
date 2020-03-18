import { AuthService } from './authService';
import VueRouter, { Route, RouteConfig, RawLocation, RouteRecord } from 'vue-router';
import Vue from 'vue';
import Router from 'vue-router';
import { Dictionary } from 'vue-router/types/router';
import { ProfileService } from './profileService';

Vue.use(Router);

export interface RouterOptions {
    routes?: RouteConfig[];
    homePage?: string;
    baseUrl?: string;
    page404?: string;
    loginPage?: string;
    otherRoute?: RouteConfig;
}

interface InitialRoute {
    to: Route;
    from: RouteRecord;
    next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void;
}

export class RouterService {

    private options: RouterOptions = {
        routes: [],
        homePage: "/",
        baseUrl: "/",
        loginPage: "/login",
        page404: "/",
        otherRoute: { path: '*', redirect: "/" },
    };

    private initialRoute?: any;
    public router: VueRouter;
    private authService: AuthService;
    private profileService: ProfileService;
    private pause: boolean;

    constructor(authService: AuthService, profileService: ProfileService, options?: RouterOptions) {
        this.authService = authService;
        this.profileService = profileService;
        this.pause = false;

        if (options) {
            this.options.routes = options.routes || this.options.routes;
            this.options.homePage = options.homePage || this.options.homePage;
            this.options.loginPage = options.loginPage || this.options.loginPage;
            this.options.page404 = options.page404 || this.options.page404;
            this.options.otherRoute = options.otherRoute || this.options.otherRoute;
            this.options.baseUrl = options.baseUrl || this.options.baseUrl;
        }
        this.options.routes = [...this.options.routes!, this.options.otherRoute!];
        this.injectProps(this.options.routes);
        this.router = new VueRouter({
            mode: 'history',
            base: this.options.baseUrl || "/",
            scrollBehavior(to, from, savedPosition) {
                if (to.hash) {
                    return {
                        selector: to.hash,
                    };
                }
            },
            routes: this.options.routes,
        });
        this.router.beforeEach((to, from, next) => {
            if (this.escapeRoute(to)) {
                next({ name: to.name!, hash: to.hash, params: to.params, query: to.query!, path: to.path });
            }
            let route = to.matched.find(e => e.meta.auth);
            if (route) {
                this.manageAuthGuard({ to: to, from: route, next: next });
            } else next();
        });
    }

    public home() {
        this.push(this.options.homePage!);
    }

    public push(route: RawLocation) {
        if (!route) route = this.options.homePage!;
        this.router.push(route);
    }

    public updateQuery(query: Dictionary<string | (string | null)[] | null | undefined>) {
        this.replace({ query: query });
    }

    public updateParams(params: Dictionary<string>) {
        this.replace({ params: params });
    }

    public login(url?: string) {
        url = url || this.options.homePage;
        this.replace({ path: this.options.loginPage, query: { url: url } });
    }

    public replace(route?: RawLocation) {
        route = route || this.options.homePage;
        this.router.replace(route!);
    }

    public back() {
        this.router.back();
    }

    public resume() {
        this.pause = false;
        if (this.initialRoute) {
            this.manageAuthGuard({ to: this.initialRoute.to, from: this.initialRoute.route, next: this.initialRoute.next });
            this.initialRoute = undefined;
        }
    }

    public redirectToLoginIfNeeded() {
        if (this.router && this.router.currentRoute && this.router.currentRoute.meta) {
            let auth = this.router.currentRoute.meta.auth;
            if (auth && this.authService) {
                if (!this.authService.store.isAuthenticated) {
                    this.login(this.router.currentRoute.fullPath);
                }
            }
        }
    }

    private manageAuthGuard(initialRoute: InitialRoute) {
        if (!this.pause) {
            if (initialRoute.from && initialRoute.from.meta) {
                let auth = initialRoute.from.meta.auth;
                let roles = initialRoute.from.meta.roles;
                if (auth && this.authService) {
                    if (!this.authService.store.isAuthenticated) {
                        initialRoute.next({ path: this.options.loginPage, query: { url: initialRoute.to.fullPath } });
                        return;
                    }
                    if (roles) {
                        if (!this.profileService.isInOneOfRoles(roles)) {
                            initialRoute.next({ path: this.options.homePage });
                        }
                    }
                }
            }
            initialRoute.next();
        } else {
            if (!this.initialRoute) {
                this.initialRoute = initialRoute;
            }
        }
    }

    private injectProps(routes: RouteConfig[]) {
        if (routes) {
            routes.forEach((r) => {
                if (!r.props) r.props = (route) => this.unEscapeRouteParams(route);
                if (r.children) {
                    this.injectProps(r.children);
                }
            });
        }
    }

    private escapeRoute(route: Route) {
        let changed = false;
        if (route.params) {
            for (let paramKey in route.params) {
                let param = route.params[paramKey];
                let nv = this.escapeUrlParameters(param);
                if (nv !== param) changed = true;
                route.params[paramKey] = nv;
            }
        }
        if (route.query) {
            for (let paramKey in route.query) {
                let param = route.query[paramKey];
                let nv = this.escapeUrlParameters(param);
                if (nv !== param) changed = true;
                route.query[paramKey] = nv;
            }
        }
        return changed;
    }

    private unEscapeRouteParams(route: Route) {
        let params: any = {};
        if (route.params) {
            for (let paramKey in route.params) {
                let param = route.params[paramKey];
                params[paramKey] = this.unEscapeUrlParameters(param);
            }
        }
        if (route.query) {
            for (let paramKey in route.query) {
                let param = route.query[paramKey];
                params[paramKey] = this.unEscapeUrlParameters(param);
            }
        }
        return params;
    }

    private escapeUrlParameters(fragment: any) {
        if (fragment && typeof fragment === 'string') {
            // fragment = fragment.replace(/\./g, '_dot_');
        }
        return fragment;
    }

    private unEscapeUrlParameters(fragment: any) {
        if (fragment && typeof fragment === 'string') {
            // fragment = fragment.replace(/_dot_/g, '.');
        }
        return fragment;
    }

}