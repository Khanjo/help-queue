import React, { useEffect, useState } from "react";
import NewTicketForm from "./NewTicketForm";
import TicketList from "./TicketList";
import TicketDetail from "./TicketDetail";
import EditTicketForm from "./EditTicketForm"
import { db, auth } from "./../firebase";
import { collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc, query, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

function TicketControl() {
    const [formVisibleOnPage, setFormVisibleOnPage] = useState(false);
    const [mainTicketList, setMainTicketList] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryByTimestamp = query(
            collection(db, "tickets"),
            orderBy('timeOpen')
        );
        const unSubscribe = onSnapshot(
            queryByTimestamp,
            (querySnapshot) => {
                const tickets = [];
                querySnapshot.forEach((doc) => {
                    const timeOpen = doc.get('timeOpen', { serverTimestamps: "estimate" }).toDate();
                    const jsDate = new Date(timeOpen);
                    tickets.push({
                        names: doc.data().names,
                        location: doc.data().location,
                        issue: doc.data().issue,
                        timeOpen: jsDate,
                        formattedWaitTime: formatDistanceToNow(jsDate),
                        id: doc.id
                    });
                });
                setMainTicketList(tickets);
            },
            (error) => {
                setError(error.message);
            }
        );

        return () => unSubscribe();
    }, []);

    useEffect(() => {
        function updateTicketElapsedWaitTime() {
            const newMainTicketList = mainTicketList.map(ticket => {
                const newFormattedWaitTime = formatDistanceToNow(ticket.timeOpen);
                return { ...ticket, formattedWaitTime: newFormattedWaitTime };
            });
            setMainTicketList(newMainTicketList);
        }
        const waitTimeUpdateTimer = setInterval(() =>
            updateTicketElapsedWaitTime(),
            60000
        );
        return function cleanup() {
            clearInterval(waitTimeUpdateTimer);
        }
    }, [mainTicketList])

    const handleClick = () => {
        if (selectedTicket != null) {
            setFormVisibleOnPage(false);
            setSelectedTicket(null);
            setEditing(false)
        } else {
            setFormVisibleOnPage(!formVisibleOnPage);
        }
    }

    const handleAddingNewTicketToList = async (newTicketData) => {
        const collectionRef = collection(db, "tickets");
        await addDoc(collectionRef, newTicketData);
        setFormVisibleOnPage(false);
    }

    const handleChangingSelectedTicket = (id) => {
        const selection = mainTicketList.filter(ticket => ticket.id === id)[0];
        setSelectedTicket(selection);
    }

    const handleDeletingTicket = async (id) => {
        await deleteDoc(doc(db, "tickets", id));
        setSelectedTicket(null);
    }

    const handleEditClick = () => {
        setEditing(true);
    }

    const handleEditingTicketInList = async (ticketToEdit) => {
        const ticketRef = doc(db, "tickets", ticketToEdit.id);
        await updateDoc(ticketRef, ticketToEdit);
        setEditing(false);
        setSelectedTicket(null);
    }

    if (auth.currentUser == null) {
        return (
            <React.Fragment>
                <h1>You must be signed in to access the queue.</h1>
            </React.Fragment>
        )
    } else if (auth.currentUser != null) {
        let currentlyVisibleState = null;
        let buttonText = null;

        if (error) {
            currentlyVisibleState = <p>There was an error: {error}</p>
        } else if (editing) {
            currentlyVisibleState = <EditTicketForm ticket={selectedTicket} onEditTicket={handleEditingTicketInList} />
            buttonText = "Return to ticket list";
        } else if (selectedTicket != null) {
            currentlyVisibleState =
                <TicketDetail
                    ticket={selectedTicket}
                    onClickingDelete={handleDeletingTicket}
                    onClickingEdit={handleEditClick} />;
            buttonText = "Return to ticket list";
        } else if (formVisibleOnPage) {
            currentlyVisibleState = <NewTicketForm onNewTicketCreation={handleAddingNewTicketToList} />;
            buttonText = "Return to Ticket List";
        } else {
            currentlyVisibleState = <TicketList ticketList={mainTicketList} onTicketSelection={handleChangingSelectedTicket} />;
            buttonText = "Add Ticket";
        }
        return (
            <React.Fragment>
                {currentlyVisibleState}
                {error ? null : <button onClick={handleClick}>{buttonText}</button>}
            </React.Fragment>
        );
    }
}

export default TicketControl;