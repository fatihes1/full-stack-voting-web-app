import React from 'react';
import { CSSTransition } from "react-transition-group";
import Welcome from './pages/Welcome';
import {AppPage, state} from "./state";
import Create from "./pages/Create";
import Join from "./pages/Join";
import {useSnapshot} from "valtio";
import {WaitingRoom} from "./pages/WaitingRoom";

const routeConfig = {
    [AppPage.Welcome]: Welcome,
    [AppPage.Create]: Create,
    [AppPage.Join]: Join,
    [AppPage.WaitingRoom]: WaitingRoom,
}


const Pages: React.FC = () => {
    const currentState = useSnapshot(state);
    return (
        <>
            {Object.entries(routeConfig).map(([page, Component]) => (
                <CSSTransition
                    key={page}
                    in={currentState.currentPage === page}
                    timeout={300}
                    classNames="page"
                    unmountOnExit>
                    <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
                        <Component />
                    </div>
                </CSSTransition>
            ))}
        </>

    )
};

export default Pages;