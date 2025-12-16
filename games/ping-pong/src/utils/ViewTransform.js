/**
 * ViewTransform - Coordinate transformation utilities
 * 
 * Handles world-to-screen coordinate transformations for different player perspectives.
 * Useful for multiplayer games where players need different viewpoints.
 */
export default class ViewTransform {
    constructor(centerX, centerY) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.scale = 1; // Global scale factor
    }

    /**
     * Update center position and scale
     * @param {number} centerX 
     * @param {number} centerY 
     * @param {number} scale 
     */
    update(centerX, centerY, scale) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.scale = scale;
    }

    /**
     * Transform world coordinates to screen coordinates based on player role
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} z - World Z coordinate (height)
     * @param {string} role - Player role ('A' for normal, 'B' for inverted)
     * @returns {{x: number, y: number}} Screen coordinates
     */
    worldToScreen(x, y, z = 0, role) {
        // Apply global scale to world coordinates for display
        const scaledX = x * this.scale;
        const scaledY = y * this.scale;
        const scaledZ = z * this.scale;

        let screenX, screenY;

        if (role === 'B') {
            // Player B View: Inverted (180 degree rotation)
            screenX = this.centerX - scaledX;
            screenY = this.centerY - scaledY;
        } else {
            // Player A View: Normal
            screenX = this.centerX + scaledX;
            screenY = this.centerY + scaledY;
        }

        // Apply Z-offset for 2.5D effect (up is -Y)
        screenY -= scaledZ;

        return { x: screenX, y: screenY };
    }

    /**
     * Transform screen coordinates to world coordinates based on player role
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {string} role - Player role ('A' for normal, 'B' for inverted)
     * @returns {{x: number, y: number}} World coordinates
     */
    screenToWorld(screenX, screenY, role) {
        let scaledWorldX, scaledWorldY;

        if (role === 'B') {
            // Player B sees inverted view
            scaledWorldX = this.centerX - screenX;
            scaledWorldY = this.centerY - screenY;
        } else {
            // Player A sees normal view
            scaledWorldX = screenX - this.centerX;
            scaledWorldY = screenY - this.centerY;
        }

        // Reverse the scaling to get actual physics units
        return {
            x: scaledWorldX / this.scale,
            y: scaledWorldY / this.scale
        };
    }

    /**
     * Calculate scale based on Z position for depth effect
     * @param {number} z - Z coordinate (height)
     * @param {number} baseScale - Base scale value
     * @param {number} scaleFactor - How much Z affects scale
     * @returns {number} Calculated scale
     */
    calculateDepthScale(z, baseScale, scaleFactor) {
        // Apply global scale to the base sprite scale
        return (baseScale * this.scale) + ((z * this.scale) / scaleFactor);
    }

    /**
     * Transform local coordinates to network coordinates.
     * If I am Role B, my local "Bottom" (A-view) coordinates must be inverted 
     * to represent "Top" (B-view) coordinates for the server/opponent.
     * 
     * @param {object} state - {x, y, vx, vy} 
     * @param {string} role - My Role ('A' or 'B')
     */
    toNetwork(state, role) {
        if (role === 'B') {
            // Invert X and Y for Role B to normalize to "Server Space"
            // If I am at Bottom (y=200), Server sees me at Top (y=-200)
            return {
                x: -state.x, // Flip X (Left becomes Right)
                y: -state.y, // Flip Y (Bottom becomes Top)
                vx: -state.vx,
                vy: -state.vy,
                z: state.z,    // Z is invariant (height is height)
                vz: state.vz,  // VZ is invariant (up is up)
                spin: state.spin // Spin direction might need flip?
                // If I brush "Forward" (Topspin), ball goes away.
                // Opponent sees ball coming "Forward" (Topspin).
                // Spin is rotational. 
                // Clockwise from Top? 
                // Let's assume spin is relative to "Forward" motion, so it might not need flip if logic handles "Relative to Bat".
                // But if spin is "absolute angular velocity around X axis":
                // Topspin (+X rot) -> Inverted Y (+Y) -> Inverted Frame?
                // Simpler: Just sync spin value, physics will handle it relative to velocity.
                // WAIT: If I hit "Forward" (Away), vy is negative? No, Away is +Y or -Y?
                // Local A: Away is Negative Y (Up).
                // Local B (Sim A): Away is Negative Y (Up).
                // Network B: Away is Positive Y (Down).
                // So VY is flipped. (-vy).
            };
        }
        return state; // Role A is canonical
    }

    /**
     * Transform network coordinates to local coordinates.
     * If I am Role B, I receive "Opponent (A) at Top (y=-200)"?
     * No, Opponent is Role A. They send Role A coords (y=200, Bottom).
     * If I am B (Simulating A), I need to see Opponent at My Top (y=-200).
     * 
     * @param {object} state - {x, y, vx, vy}
     * @param {string} localRole - My Role
     */
    fromNetwork(state, localRole) {
        if (localRole === 'B') {
            // I am B. Opponent is A (sent y=200).
            // I want to see Opponent at Top (y=-200).
            // So I must invert.
            return {
                x: -state.x,
                y: -state.y,
                vx: -state.vx,
                vy: -state.vy, // If A hit "Up" (Away, -vy), I see it coming "Down" (Towards, +vy).
                z: state.z || 0,
                vz: state.vz || 0, // VZ invariant
                spin: state.spin || 0
            };
        }
        return state;
    }
}
