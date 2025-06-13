import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from 'react-bootstrap';

// MODIFIED: Updated the fallback URL to use the correct single domain.
const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget.technickservices.com/api";

const VersionFooter = () => {
    const [backendVersion, setBackendVersion] = useState('loading...');
    const frontendVersion = process.env.REACT_APP_VERSION || 'N/A';

    useEffect(() => {
        const fetchBackendVersion = async () => {
            try {
                // Fetches the version from the /api/version endpoint on the server
                const response = await axios.get(`${API_URL_BASE}/version`);
                setBackendVersion(response.data.version || 'unknown');
            } catch (error) {
                console.error("Failed to fetch backend version:", error);
                setBackendVersion('error');
            }
        };

        fetchBackendVersion();
    }, []);

    return (
        <footer className="bg-light text-center text-muted py-2 mt-auto">
            <Container>
                <small>
                    Client Version: {frontendVersion} | Server Version: {backendVersion}
                </small>
            </Container>
        </footer>
    );
};

export default VersionFooter;
