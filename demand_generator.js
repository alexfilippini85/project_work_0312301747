/**
 * Classe Demand
 * Utilizzata per generazione dati sintetici della domanda
 */


class Demand {

    random;
    months = [];
    annualDemand;
    dailyAvgDemand;
    dailyStdDeviation;

    constructor(seed, months, baseLevel, trendPerPeriod, noiseStd, peakMonth, peakFactor) {
        this.random = new SeededRandom(seed);
        this.months = this.#generateMonthlyDemand(months, baseLevel, trendPerPeriod, noiseStd, peakMonth, peakFactor);

        this.annualDemand = this.months.reduce((a, b) => a + (b.tot || 0), 0) / months * 12;
        this.dailyAvgDemand = this.annualDemand / 365;

        const allDaysDemand = this.months.reduce((acc, obj) => acc.concat(obj.daily), []);
        this.dailyStdDeviation = this.#calcolaDevStd(allDaysDemand);
    }

    // Generazione domanda mensile con trend + stagionalità + rumore
    #generateMonthlyDemand(months, baseLevel, trendPerPeriod, noiseStd, peakMonth, peakFactor) {
        const demand = [];


        for (let t = 0; t < months; t++) {
            const monthIndex = t + 1; // 1..12, 13.. ecc.
            const monthInYear = ((monthIndex - 1) % 12) + 1;

            const trend = trendPerPeriod * t;
            const peakMult = monthInYear === peakMonth ? peakFactor : 1;


            // Rumore gaussiano approssimato (Box-Muller)
            const u1 = this.random.generate();
            const u2 = this.random.generate();
            const randStdNorm = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const noise = randStdNorm * noiseStd;

            const monthDemand = Math.max(0, Math.round((baseLevel + trend) * peakMult + noise));
            const domandaGiornaliera = this.#generateDailyDemand(monthDemand, 30);
            demand.push({
                tot: monthDemand,
                daily: domandaGiornaliera
            });
        }
        return demand;
    }


    /**
     * Genera domanda giornaliera mensile con distribuzione esponenziale usando seeded random.
     * Simula vendite realistiche: molti giorni bassi, pochi picchi alti, somma ESATTA=totalMensile.
     */
    #generateDailyDemand(totalMensile, giorniMese) {

        /**
         * Tasso esponenziale adattivo: λ = giorni/total
         * Media giornaliera = 1/λ = totalMensile/giorniMese
         */
        const lambda = giorniMese / totalMensile;

        /**
         * FASE 1: Serie esponenziale raw con Inverse Transform Sampling
         * X_i = -ln(1-U_i) / λ   dove U_i ~ Uniforme[0,1) da PRNG
         */
        const serie = [];
        for (let i = 0; i < giorniMese; i++) {
            const u = this.random.generate(); // ← Usa SeededRandom
            serie.push(-Math.log(1 - u) / lambda);
        }

        /**
         * FASE 2: Normalizzazione proporzionale
         * x_norm[i] = round( (serie[i] / somma_serie) * totalMensile )
         */
        const somma = serie.reduce((a, b) => a + b, 0);
        const normalizzata = serie.map(x => Math.round((x / somma) * totalMensile));
        let sommaAttuale = normalizzata.reduce((a, b) => a + b, 0);

        /**
         * FASE 3: Correzione finale per somma ESATTA
         * Regola ULTIMO giorno per compensare errori arrotondamento
         * Garantisce: sum(normalizzata) === totalMensile
         */
        normalizzata[giorniMese - 1] += totalMensile - sommaAttuale;
        
        return normalizzata;
    }

    #calcolaDevStd(arr, usePopulation = false) {
        const n = arr.length;
        if (n === 0) return 0;

        // 1. Calcola la media
        const media = arr.reduce((acc, val) => acc + val, 0) / n;

        // 2. Calcola la varianza
        const varianza = arr.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / (usePopulation ? n : n - 1);

        // 3. Calcola la deviazione standard (radice quadrata della varianza)
        return Math.sqrt(varianza);
    }

}
