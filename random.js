/**
 * Classe PRNG (Pseudo-Random Number Generator) seedabile.
 * Genera sequenze [0,1) *sempre identiche* dato lo stesso seed iniziale.
 * Usa algoritmo mulberry32 (32-bit, buona qualità statistica).
 */

class SeededRandom {

    /**
     * @param {number} seed - Seed iniziale (32-bit integer raccomandato)
     */
    constructor(seed) {
        this.seed = seed >>> 0; // Forza unsigned 32-bit
    }

    /**
     * Ritorna numero pseudo-casuale in [0, 1).
     * La sequenza è deterministica: stesso seed → stessi valori in ordine.
     * @returns {number} Valore [0, 1)
     */
    generate() {
        // Algoritmo mulberry32 (David Bau)
        let t = this.seed += 0x6D2B79F5; // Costante mixing
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        this.seed = (t ^ t >>> 14) >>> 0; // Aggiorna stato interno
        return this.seed / 4294967296; // Normalizza [0,1)
    }
  
}
