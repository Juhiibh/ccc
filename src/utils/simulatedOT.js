// src/utils/simulatedOT.js
// Simple, clear CLIENT-SIDE SIMULATION of 1-out-of-n OT for demo purposes.
// WARNING: This is NOT cryptographically secure. It's an app-level simulation
// meant to show the OT flow in UI for demos and tests.

export function simulateOT(senderMessages, choiceIndex) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(senderMessages)) return reject(new Error("senderMessages must be an array"));
    if (choiceIndex < 0 || choiceIndex >= senderMessages.length) return reject(new Error("choiceIndex out of range"));

    // Simulate network + protocol delay
    setTimeout(() => {
      // The "simulation" reveals only the chosen message
      resolve(senderMessages[choiceIndex]);
    }, 300 + Math.random() * 400);
  });
}
