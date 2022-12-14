import React, {useEffect} from 'react';
import { devtools } from "valtio/utils";

import './index.css';
import Pages from './Pages';
import {actions, state} from './state';
import {useSnapshot} from "valtio";
import Loader from "./components/ui/Loader";
import {getTokenPayload} from "./util";
import SnackBar from './components/ui/SnackBar';


devtools(state, { name: 'app state'});
const App: React.FC = () => {
    const currentState = useSnapshot(state);

    useEffect(() => {
        console.log(`App useEffect - check token and sen to proper page`);

        actions.startLoading();

        const accessToken = localStorage.getItem('accessToken');

        // if there is bot acces token, stop loading
        // state.currentPage of AppPage.Welcone
        if(!accessToken) {
            actions.stopLoading();
            return;
        }

        const { exp: tokenExp } = getTokenPayload(accessToken);
        const currentTimeInSeconds = Date.now() / 1000;

        // Remove old token
        // if token is within 10 seconds, we'll prevent
        // them forom connecting (poll will almost be over)
        // since token duration and poll duration are
        // approximately at the same time
        if (tokenExp < currentTimeInSeconds - 10) {
            localStorage.removeItem('accessToken');
            actions.stopLoading();
            return;
        }

        // reconnect poll
        actions.setPollAccessToken(accessToken); // needed for socket.io connection
        // socket initialization on server sends updated poll to the client
        actions.initializeSocket();
        actions.stopLoading();
    }, []);

    useEffect(() => {
        console.log(`App useEffect - check if poll has started`);
        const myID = currentState.me?.id;

        if(myID && currentState.socket?.connected && !currentState.poll?.participants[myID]) {
            actions.startOver();
        }
    }, [currentState.poll?.participants]);

    return (
        <>
            <Loader color="orange" isLoading={currentState.isLoading} width={120} />
            {currentState.wsErrors.map((error) =>(
                <SnackBar
                    key={error.id}
                    message={error.message}
                    type="error"
                    title={error.type}
                    onClose={() => actions.removeWsError(error.id)}
                    show={true}
                    autoCloseDuration={5000}
                />
            ))}
            <Pages />
        </>
    )
};

export default App;
