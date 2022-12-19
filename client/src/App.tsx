import React from 'react';
import { devtools } from "valtio/utils";

import './index.css';
import Pages from './Pages';
import { state } from './state';
import {useSnapshot} from "valtio";
import Loader from "./components/ui/Loader";


devtools(state, 'app state');
const App: React.FC = () => {
    const currentState = useSnapshot(state);
    return (
        <>
            <Loader color="orange" isLoading={currentState.isLoading} width={120} />
            <Pages />
        </>
    )
};

export default App;
