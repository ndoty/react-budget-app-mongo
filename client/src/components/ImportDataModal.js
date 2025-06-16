import { Form, Modal, Button, Alert } from "react-bootstrap";
import { useRef, useState } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function ImportDataModal({ show, handleClose }) {
    const fileRef = useRef();
    const [error, setError] = useState("");
    const { importData } = useBudgets();

    const handleImport = () => {
        const file = fileRef.current.files[0];
        if (!file) {
            return setError("Please select a file to import.");
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation to ensure the file looks correct
                if (!data.budgets || !data.expenses || !data.income) {
                    throw new Error("Invalid data file format. The file must contain budgets, expenses, and income arrays.");
                }
                await importData(data);
                handleClose();
            } catch (err) {
                setError(`Failed to import data: ${err.message}`);
            }
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        reader.readAsText(file);
    };
    
    // Reset error when closing the modal
    const onHide = () => {
        setError("");
        handleClose();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Import Budget Data</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="danger">
                    <strong>Warning:</strong> Importing data will permanently delete all of your current budgets, expenses, and income. This action cannot be undone. It is highly recommended to export your current data first as a backup.
                </Alert>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Select JSON Backup File</Form.Label>
                    <Form.Control type="file" ref={fileRef} accept=".json" />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="danger" onClick={handleImport}>Delete and Import Data</Button>
            </Modal.Footer>
        </Modal>
    );
}
