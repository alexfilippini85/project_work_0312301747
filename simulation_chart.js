/**
 * Classe SimulationChart
 * Utilizzata per aggiornare il contenuto dei grafici con il dettaglio della simulazione
 */

class SimulationChart {

    #simulationChartInstance = null;
    #serviceLevelChartInstance = null;

    // Render grafico simulazione con dati mese per mese
    updateSimulation(canvasId, monthlyDemand, simulationMonths) {
        const canvas = document.getElementById(canvasId);

        const labels = simulationMonths.map(r => 'M' + r.month);
        const initialStocks = simulationMonths.map(r => r.stockStart);
        const incoming = simulationMonths.map(r => r.incomingQty);
        const stockEnd = simulationMonths.map(r => r.stockEnd);
        const cumService = simulationMonths.map(r => (r.serviceLevel * 100).toFixed(1));
        const demand = monthlyDemand.months.map(r => r.tot);
        const waitingArrivals = simulationMonths.map(r => r.waitingArrivals);

        // allineamento assi y
        const stackedValues = initialStocks.map((_, i) => initialStocks[i] + incoming[i]);
        const allValues = [
            ...stackedValues,
            ...demand
        ];
        const globalMin = Math.min(...allValues, 0); // includi 0
        const globalMax = Math.max(...allValues);

        // opzionale: arrotonda il max
        const step = 10;
        const alignedMax = Math.ceil(globalMax / step) * step;

        if (this.#simulationChartInstance) {
            this.#simulationChartInstance.destroy();
        }

        this.#simulationChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    // BAR STACK
                    {
                        type: 'bar',
                        label: 'initialStock',
                        data: initialStocks,
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 3,
                        stack: 'stock',
                        yAxisID: 'yStacked',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: 'incoming',
                        data: incoming,
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        borderRadius: 3,
                        stack: 'stock',
                        yAxisID: 'yStacked',
                        order: 1
                    },

                    // LINES
                    {
                        type: 'line',
                        label: 'demand',
                        data: demand,
                        borderColor: 'rgba(0, 106, 255, 1)',
                        backgroundColor: 'rgba(0, 106, 255, 0.2)',
                        borderWidth: 2,
                        fill: false,
                        // colori punti (uguali per tutti i punti di questa linea)
                        pointBackgroundColor: function (context) {
                            const idx = context.dataIndex;
                            const stockEndValue = stockEnd[idx];
                            return stockEndValue <= 0 ?
                                'rgba(255, 10, 80, 1)' :
                                'rgba(0, 106, 255, 1)';
                        },


                        pointBorderColor: function (context) {
                            const idx = context.dataIndex;
                            const stockEndValue = stockEnd[idx];
                            return stockEndValue <= 0 ?
                                'rgba(240, 43, 86, 1)' :
                                'rgba(255, 255, 255, 1)';
                        },
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.2,
                        yAxisID: 'yLines',
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: function (context) {
                                const idx = context.index;
                                const stockEndValue = stockEnd[idx];
                                return stockEndValue <= 0 ?
                                    'red' :
                                    'black';
                            }
                        }
                    },
                    // Asse per le BARRE (stacked)
                    yStacked: {
                        type: 'linear',
                        position: 'left',
                        stacked: true,
                        beginAtZero: true,
                        min: globalMin,
                        max: alignedMax
                    },
                    // Asse per le LINEE (non stacked, ma con stesso range)
                    yLines: {
                        type: 'linear',
                        position: 'right',
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false // evita doppia griglia
                        },
                        min: globalMin,
                        max: alignedMax
                    }
                }
            }
        });

    }


    // Render grafico service level con dati mese per mese
    updateServiceLevel(canvasId, simulationMonths) {
        const canvas = document.getElementById(canvasId);
        const labels = simulationMonths.map(r => 'M' + r.month);
        const servedDays = simulationMonths.map(r => r.servedDays);
        const stockoutDays = simulationMonths.map(r => r.stockoutDays);

        // allineamento assi y
        const allValues = servedDays.map((_, i) => servedDays[i] + stockoutDays[i]);
        const globalMin = Math.min(...allValues, 0); // includi 0
        const globalMax = Math.max(...allValues);

        // opzionale: arrotonda il max
        const step = 10;
        const alignedMax = Math.ceil(globalMax / step) * step;

        if (this.#serviceLevelChartInstance) {
            this.#serviceLevelChartInstance.destroy();
        }

        this.#serviceLevelChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    // BAR STACK
                    {
                        type: 'bar',
                        label: 'servedDays',
                        data: servedDays,
                        backgroundColor: 'rgba(54, 162, 235, 0.3)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 3,
                        stack: 'stock',
                        yAxisID: 'yStacked',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: 'stockoutDays',
                        data: stockoutDays,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        borderRadius: 3,
                        stack: 'stock',
                        yAxisID: 'yStacked',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    // Asse per le BARRE (stacked)
                    yStacked: {
                        type: 'linear',
                        position: 'left',
                        stacked: true,
                        beginAtZero: true,
                        min: globalMin,
                        max: alignedMax
                    },
                    // Asse per le LINEE (non stacked, ma con stesso range)
                    yLines: {
                        type: 'linear',
                        position: 'right',
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false // evita doppia griglia
                        },
                        min: globalMin,
                        max: alignedMax
                    }
                }
            }
        });

    }

}
