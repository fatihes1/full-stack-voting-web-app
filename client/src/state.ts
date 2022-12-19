import { proxy } from 'valtio'

export enum AppPage {
    // store possible pages
    Welcome = 'welcome',
    Create = 'create',
    Join = 'join',
}

// hold the current page
export type AppState = {
    currentPage: AppPage
}

// initial state
const state: AppState = proxy({
    currentPage: AppPage.Welcome,
});

const actions = {
    setPage: (page: AppPage) => {
        state.currentPage = page;
    }
}

export { state, actions };