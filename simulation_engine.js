/**
 * Classe SimulationEngine
 * Utilizzata per simulare scenario di approvvigionamento/fornitura con EOQ, Safety stock e ROP
 */

class SimulationEngine {


    // EOQ = sqrt(2DS/H)
    computeEOQ(annualDemand, setupCost, holdingCost) {
        return Math.round(Math.sqrt((2 * annualDemand * setupCost) / holdingCost), 0);
    }


    // Safety stock = Z * sigma_d * sqrt(L)
    computeSafetyStock(demandStd, leadTime, serviceZ) {
        return Math.round(serviceZ * demandStd * Math.sqrt(leadTime), 0);
    }


    // ROP = avgDailyDemand * leadTime + safetyStock
    computeReorderPoint(avgDemand, leadTime, safetyStock) {
        return Math.round(avgDemand * leadTime + safetyStock, 0);
    }

	
	// calcolo giorno di arrivo del materiale ordinato considerando il leadTime
    simulateArrivalDate(mese, giorno, leadTime) {
        // Converti tutto in "giorni assoluti" rispetto all'inizio (mese 1, giorno 1)
        const totaleGiorni = (mese - 1) * 30 + (giorno - 1) + leadTime;

        // Calcola il nuovo mese e giorno assumendo mesi da 30 giorni
        const nuovoMese = Math.floor(totaleGiorni / 30) + 1;
        const nuovoGiorno = (totaleGiorni % 30) + 1;

        return {
            month: nuovoMese,
            day: nuovoGiorno
        };
    }


    /*
     * Simulazione mese per mese con EOQ, ROP e safety stock
     * Nella politica classica (r, Q) o ROP-EOQ, 
	 * l'ordine si effettua ogni volta che l'inventory position 
     * (stock on-hand + ordini pendenti - backorder) 
     * scende sotto ROP, anche con ordini già piazzati. 
     * Questo permette ordini multipli outstanding durante LT, evitando stockout con domanda variabile
     *
     * Per meglio distinguere variabili con nome simile, si adotta la nomenclatura t_***, m_*** e d_*** dove
     *   t_***: indica una variabile di accumulo TOTALE della simulazione
     *   m_***: indica una variabile di accumulo MENSILE della simulazione
     *   d_***: indica una variabile di accumulo GIORNALIERA della simulazione
     */
    simulateInventory(syntheticDemand, EOQ, reorderPoint, safetyStock, leadTimeDays) {
    
    	// tutta la simulazione assume mesi equivalenti di 30 giorni
        const DAYS_PER_MONTH = 30;

        // Valore stock iniziale: ROP + EOQ/2 --> Inventario medio iniziale, riduce immobilizzo capitale.
        let stock = reorderPoint + EOQ / 2;

		// oggetto (mappa) dove la chiave indica la data di arrivo. 
		// Il formato della chiave è il progressivo mese + il progressivo giorno 
		// (es: 5_23 significa mese 5, giorno 23)
        let onOrder = {}; 

		// array contenente i risultati della simulazione. Ogni occorrenza rappresenta un mese
        let simulationMonths = [];
          
        // domanda non servita accumulata
        let backorder = 0;

		// numero giorni totali della simulazione (numero totale mesi * numero giorno per mese)
        const totalDays = syntheticDemand.months.length * DAYS_PER_MONTH;
        
        // numero di giorni totali in stockout
        let t_stockout_days = 0;


        // simulazione mensile
        // il consumo e i nuovi ordini vengono simulati giornalmente assumendo 30gg per ogni mese
        syntheticDemand.months.forEach((month, idx) => {
            const m_label = idx + 1;
            const m_demand = month.tot;
            const d_demand = month.daily;
            const m_initial_stock = stock;

			// domanda servita nel mese (in unità) 
            let m_served = 0;
            
            // numero di giorni del mese in stockout
            let m_stockout_days = 0;
            
            // quantità ordinata nel mese
            let m_orderPlacedQty = 0;
            
            // numero ordini nel mese
            let m_ordersPlaced = 0;
            
            // quantità in ingresso nel mese
            let m_incomingQty = 0;
            

			// simulazione giornaliera
            for (let day = 1; day <= DAYS_PER_MONTH; day++) {

                // accumulo incoming ordini con consegna odierna
                if (onOrder != undefined && onOrder[m_label + "_" + day] != undefined) {
                	const todayIncoming = onOrder[m_label + "_" + day] || 0;
                    m_incomingQty += todayIncoming;
                    stock += todayIncoming;
                    onOrder[m_label + "_" + day] = 0;
                }
				
				// totale in ordine con ingresso futuro
                const waitingArrivals = Object.values(onOrder).reduce((tot, v) => tot + v, 0);

                // Reorder decision: se stock+totale_in_arrivo < ROP ordiniamo EOQ
                if ((stock + waitingArrivals) < reorderPoint) {
                
                	// iene calcolata la data di arrivo in funzione del leadTime
                    const arrivalDate = this.simulateArrivalDate(m_label, day, leadTimeDays);
                    const orderMonth = arrivalDate.month;
                    const orderDay = arrivalDate.day;
                    
                    // generazione nuovo ordine -> inserimento nella mappa degli arrivi
                    onOrder[orderMonth + "_" + orderDay] = Math.round(EOQ);
                    
                    // incremento totale qty in ordine e numero ordini
                    m_orderPlacedQty += Math.round(EOQ);
                    m_ordersPlaced++;
                }

                // Calcolo della domanda giornaliera (si cumula il backorder in quanto domanda rimanente dai giorni precedenti)
                const d_demand_rectified = d_demand[day - 1] + backorder;

                // check stockout
                if (d_demand_rectified > stock) {
                    m_stockout_days++;
                    t_stockout_days++;
                }
                
                // il backorder è l'eventuale domanda non servita
                backorder = Math.max(0, d_demand_rectified - stock);

				// Soddisfazione domanda
                const d_served = Math.min(stock, d_demand_rectified);
                m_served += d_served;
                stock -= d_served;
                
            } // fine simulazione giornaliera
            

            const waitingArrivals = Object.values(onOrder).reduce((tot, v) => tot + v, 0);
            const finalBackorder = Math.max(0, m_demand - m_served);

            const serviceLevel = (DAYS_PER_MONTH - m_stockout_days) / DAYS_PER_MONTH; 

            simulationMonths.push({
                month: m_label,
                demand: m_demand,
                stockStart: Math.round(m_initial_stock),
                incomingQty: m_incomingQty,
                orders: m_ordersPlaced,
                orderQty: m_orderPlacedQty,
                served: Math.round(m_served),
                servedDays: DAYS_PER_MONTH - m_stockout_days,
                stockoutDays: m_stockout_days,
                backorder: Math.round(backorder),
                stockEnd: Math.round(stock),
                waitingArrivals: Math.round(waitingArrivals),
                serviceLevel
            });

        });

        return {
            simulationMonths,
            overallServiceLevel: (totalDays - t_stockout_days) / totalDays
        };
    }
}
