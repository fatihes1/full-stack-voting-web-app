import { proxy } from 'valtio'
import {Poll} from "shared";

export enum AppPage {
    // store possible pages
    Welcome = 'welcome',
    Create = 'create',
    Join = 'join',
    WaitingRoom = 'waiting-room',
}

// hold the current page
export type AppState = {
    isLoading: boolean;
    currentPage: AppPage;
    poll?: Poll;
    accessToken?: string;
}

// initial state
const state: AppState = proxy({
    isLoading: false,
    currentPage: AppPage.Welcome,
});

const actions = {
    setPage: (page: AppPage) => {
        state.currentPage = page;
    },
    startOver: (): void => {
        actions.setPage(AppPage.Welcome);
    },
    startLoading: (): void => {
        state.isLoading = true;
    },
    stopLoading: (): void => {
        state.isLoading = false;
    },
    initializePoll: (poll?: Poll): void => {
        state.poll = poll;
    },
    setPollAccessToken: (token?: string): void => {
        state.accessToken = token;
    },
}

export { state, actions };