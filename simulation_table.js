/**
 * Classe SimulationTable
 * Utilizzata per aggiornare il contenuto della tabella con il dettaglio della simulazione
 */

class SimulationTable {

    /**
     * Aggiorna la tabella "tbody" con i dati simulationMonths
     */
    render(tbody, simulationMonths) {
        tbody.innerHTML = '';
        simulationMonths.forEach(r => {
            const tr = document.createElement('tr');
            
            if (r.backorder > 0)
            	tr.className = "row_ko";
            else if (r.stockoutDays > 0)
            	tr.className = "row_warning";
            else
            	tr.className = "row_ok";	
            
            tr.innerHTML = `
          <td style="text-align:center;">${r.month}</td>
          <td>${r.stockStart}</td>
          <td>${r.demand}</td>
          <td>${r.incomingQty}</td>
          <td>${r.orderQty} (${r.orders} orders)</td>
          <td>${r.served}</td>
          <td>${r.stockoutDays}</td>
          <td>${r.backorder}</td>
          <td>${r.stockEnd}</td>
          <td>${(r.serviceLevel * 100).toFixed(1)}%</td>
        `;
            tbody.appendChild(tr);
        });
    }

}
