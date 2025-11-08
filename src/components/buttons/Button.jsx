import './button.css';

interface ButtonProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
}

function Button({ onZoomIn, onZoomOut }: ButtonProps) {
    const handleZoomIn = () => {
        console.log('Zoom in clicked');
        window.dispatchEvent(new CustomEvent('avatarZoom', { detail: { zoom: -0.5 } }));
        onZoomIn?.();
    };

    const handleZoomOut = () => {
        console.log('Zoom out clicked');
        window.dispatchEvent(new CustomEvent('avatarZoom', { detail: { zoom: 0.5 } }));
        onZoomOut?.();
    };

    return (
        <>
            {/* ✅ REMOVED: Duplicate SidePanel */}
            
            <button className="zoom-button zoom-in" onClick={handleZoomIn}>
                <span className="material-icons">zoom_in</span>
            </button>
            
            <button className="zoom-button zoom-out" onClick={handleZoomOut}>
                <span className="material-icons">zoom_out</span>
            </button>
        </>
    );
}

export default Button;