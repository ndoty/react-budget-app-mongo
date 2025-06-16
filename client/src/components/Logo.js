import React from 'react';

// This component renders the logo using Font Awesome icons.
// The custom class names (e.g., 'bg-tns-navy') are defined in the main index.html file.
const Logo = () => {
    return (
        <div className="d-flex align-items-center">
            {/* Circular Icon */}
            <div 
                className="h-24 w-24 bg-tns-navy rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ height: '40px', width: '40px' }}
            >
                <div className="position-relative d-flex align-items-center justify-content-center">
                    {/* Base Piggy Bank Icon */}
                    <i className="fa-solid fa-piggy-bank text-white" style={{ fontSize: '1.5rem' }}></i>
                    {/* Dollar Sign layered on top in green */}
                    <i 
                        className="fa-solid fa-dollar-sign text-tns-green position-absolute" 
                        style={{ 
                            fontSize: '0.9rem', 
                            top: '50%', 
                            left: '55%', 
                            transform: 'translate(-50%, -65%)', 
                            textShadow: '1px 1px 2px #0d253f' 
                        }}
                    ></i>
                </div>
            </div>

            {/* Text Block */}
            <div className="ms-3 text-start">
                <h1 className="text-tns-navy h5 mb-0 fw-bold" style={{ letterSpacing: '0.5px' }}>TechNick Services</h1>
                <p className="text-tns-green small mb-0 fw-semibold" style={{ letterSpacing: '0.5px' }}>Budget App</p>
            </div>
        </div>
    );
};

export default Logo;
