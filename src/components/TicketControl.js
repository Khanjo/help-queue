import React, { useEffect, useState } from "react";
import NewTicketForm from "./NewTicketForm";
import TicketList from "./TicketList";
import TicketDetail from "./TicketDetail";
import EditTicketForm from "./EditTicketForm"
import db from "../firebase";
import { collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc } from "firebase/firestore";

function TicketControl() {
    const [formVisibleOnPage, setFormVisibleOnPage] = useState(false);
    const [mainTicketList, setMainTicketList] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unSubscribe = onSnapshot(
            collection(db, "tickets"),
            (collectionSnapshot) => {
                const tickets = [];
                collectionSnapshot.forEach((doc) => {
                    tickets.push({
                        ...doc.data(),
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

export default TicketControl;