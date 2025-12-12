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
}
