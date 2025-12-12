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
        let screenX, screenY;

        if (role === 'B') {
            // Player B View: Inverted (180 degree rotation)
            screenX = this.centerX - x;
            screenY = this.centerY - y;
        } else {
            // Player A View: Normal
            screenX = this.centerX + x;
            screenY = this.centerY + y;
        }

        // Apply Z-offset for 2.5D effect (up is -Y)
        screenY -= z;

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
        let worldX, worldY;

        if (role === 'B') {
            // Player B sees inverted view
            worldX = this.centerX - screenX;
            worldY = this.centerY - screenY;
        } else {
            // Player A sees normal view
            worldX = screenX - this.centerX;
            worldY = screenY - this.centerY;
        }

        return { x: worldX, y: worldY };
    }

    /**
     * Calculate scale based on Z position for depth effect
     * @param {number} z - Z coordinate (height)
     * @param {number} baseScale - Base scale value
     * @param {number} scaleFactor - How much Z affects scale
     * @returns {number} Calculated scale
     */
    calculateDepthScale(z, baseScale, scaleFactor) {
        return baseScale + (z / scaleFactor);
    }
}
