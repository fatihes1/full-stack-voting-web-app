import React, { useEffect } from 'react';
import {actions, state} from '../state';
import {useCopyToClipboard} from "react-use";
import {useSnapshot} from "valtio";
import {BsPencilSquare, MdContentCopy, MdPeopleOutline} from "react-icons/all";
import {colorizeText} from "../util";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import ParticipantList from "../components/ParticipantList";
import NominationForm from "../components/NominationForm";

export const WaitingRoom: React.FC = () => {
    const [_copiedText, copyToClipboard] = useCopyToClipboard();
    const [isParticipantListOpen, setIsParticipantListOpen] = React.useState(false);
    const [isNominationFromOpen, setIsNominationFormOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
    const [confirmationMessage, setConfirmationMessage] = React.useState('');
    const [participantToRemove, setParticipantToRemove] = React.useState<string>();
    const [showConfirmation, setShowConfirmation] = React.useState(false);

    const currentState = useSnapshot(state);

    const confirmRemoveParticipant = (id: string) => {
        setConfirmationMessage(`Remove ${currentState.poll?.participants[id]} from the poll?`);
        setParticipantToRemove(id);
        setIsConfirmationOpen(true);
    }

    const submitRemoveParticipant = () => {
        participantToRemove && actions.removeParticipant(participantToRemove);
        setIsConfirmationOpen(false);
    }

    useEffect(() => {
        console.log('Waiting room useEffect');
        actions.initializeSocket();
    }, []);
    return (
        <>
            <div className="flex flex-col w-full justify-between items-center h-full">
                <div>
                    <h2 className="text-center">Poll Topic</h2>
                    <p className="italic text-center mb-4">{ currentState.poll?.topic || '' }</p>
                    <h2 className="text-center">Poll ID</h2>
                    <h3 className="text-center mb-2">Click to copy!</h3>
                    <div
                        onClick={() => copyToClipboard(currentState.poll?.id || '')}
                        className="mb-4 flex justify-center align-middle cursor-pointer"
                    >
                        <div className="font-extrabold text-center mr-2">
                            {currentState.poll && colorizeText(currentState.poll.id)}
                        </div>
                        <MdContentCopy size={24} />
                    </div>
                </div>
                <div className="flex justify-center">
                    <button
                        className="box btn-orange mx-2 pulsate"
                        onClick={() => setIsParticipantListOpen(true)}
                    >
                        <MdPeopleOutline size={24} />
                        <span>{currentState.participantCount}</span>
                    </button>
                    <button
                        className="box btn-purple mx-2 pulsate"
                        onClick={() => setIsNominationFormOpen(true)}
                    >
                        <BsPencilSquare size={24} />
                        <span>{currentState.nominationCount}</span>
                    </button>
                </div>
                <div className="flex flex-col justify-center">
                    {currentState.isAdmin ? (
                      <>
                          <div className="my-2 italic">
                              {currentState.poll?.votesPerVoter} Nominations Required to Start !
                          </div>
                          <button
                            className="box btn-orange my-2"
                            disabled={!currentState.canStartVote}
                            onClick={() => console.log('Will add start vote next time !')}
                          >
                              Start Voting
                          </button>
                      </>
                    ) : (
                      <div className="my-2 italic">
                          Waiting for Admin, {' '}
                          <span className="font-bold text-blue-700">
                              {currentState.poll?.participants[currentState.poll?.adminID]}
                          </span>
                          , to start the voting !
                      </div>
                    )}
                    <button
                        className="box btn-purple my-2"
                        onClick={() => setShowConfirmation(true)}
                    >
                        Leave Poll
                    </button>
                    <ConfirmationDialog
                      message="You'll be kicked out of the poll"
                      showDialog={showConfirmation}
                      onCancel={() => setShowConfirmation(false)}
                      onConfirm={() => actions.startOver()}
                    />
                </div>
            </div>
            <ParticipantList
              isOpen={isParticipantListOpen}
              onClose={() => setIsParticipantListOpen(false)}
              participants={currentState.poll?.participants}
              onRemoveParticipant={confirmRemoveParticipant}
              isAdmin={currentState.isAdmin || false}
              userID={currentState.me?.id}
            />
            <NominationForm
                title={currentState.poll?.topic || ''}
                isOpen={isNominationFromOpen}
                onClose={() => setIsNominationFormOpen(false)}
                onSubmitNomination={(nominationText) => actions.nominate(nominationText)}
                nominations={currentState.poll?.nominations}
                userID={currentState.me?.id}
                onRemoveNomination={(nominationID) => actions.removeNomination(nominationID)}
                isAdmin={currentState.isAdmin || false}
            />
            <ConfirmationDialog
              message={confirmationMessage}
              showDialog={isConfirmationOpen}
              onCancel={() => setIsConfirmationOpen(false)}
              onConfirm={() => submitRemoveParticipant() }
            />
        </>
    );
};