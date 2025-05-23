document.addEventListener('DOMContentLoaded', function() {
    const dateRangePicker = new DateRangePicker('dateRangePicker');
    let selectedPeriod = dateRangePicker.getPeriod();
    let selectedGranularity = 'day';
    let selectedEngagementMetric = 'sessionDuration';
    let currentEngagementData = null;

    initializeAll();
    setupEventListeners();

    function initializeAll() {
      loadVisitorEngagement();
      loadPagesTableData();
      loadUserFlowData();
    }

    function setupEventListeners() {
      dateRangePicker.onPeriodChange = (period) => {
        selectedPeriod = period;
        refreshAll();
      };

      const granularityButtons = document.querySelectorAll('#granularityFilter button');
      granularityButtons.forEach(button => {
        button.addEventListener('click', () => {
          granularityButtons.forEach(b => b.classList.remove('active'));
          button.classList.add('active');
          selectedGranularity = button.dataset.granularity;
          loadVisitorEngagement();
        });
      });

      const engagementMetricButtons = document.querySelectorAll('#engagementMetricFilter button');
       engagementMetricButtons.forEach(button => {
         button.addEventListener('click', () => {
           engagementMetricButtons.forEach(b => b.classList.remove('active'));
           button.classList.add('active');
           selectedEngagementMetric = button.dataset.metric;
           updateEngagementChart();
         });
       });
    }

    function refreshAll() {
      loadVisitorEngagement();
      loadPagesTableData();
      loadUserFlowData();
    }

     function showLoadingState(elementId, isLoading) {
        const element = document.getElementById(elementId);
        if (!element) return;
        const loader = element.querySelector('.chart-loader') || element.closest('.card-body')?.querySelector('.chart-loader');
        if (loader) loader.style.display = isLoading ? 'flex' : 'none';
    }

     function showEmptyState(elementId, show, message = 'No data available') {
        const element = document.getElementById(elementId);
        if (!element) return;
        let emptyState = element.querySelector('.chart-empty-state') || element.closest('.card-body')?.querySelector('.chart-empty-state');
        const contentElement = element.querySelector('div[id$="Chart"], ul, table');

        if (emptyState) {
            emptyState.style.display = show ? 'flex' : 'none';
            if (show) emptyState.querySelector('p').textContent = message;
        }
        if (contentElement) contentElement.style.display = show ? 'none' : '';
    }

     function updateMetricCard(idPrefix, currentValue, previousValue, formatFn, isInverted = false) {
        const valueEl = document.getElementById(idPrefix);
        const iconEl = document.getElementById(idPrefix + 'TrendIcon');
        const textEl = document.getElementById(idPrefix + 'TrendText');
        const trendEl = textEl?.parentElement;

        if (valueEl) valueEl.textContent = formatFn(currentValue);

        if(iconEl && textEl && trendEl) {
            const change = chartUtils.formatPercentageChange(currentValue, previousValue);
            let trendClass = change.trend;
            let trendIcon = change.icon;

            if(isInverted) {
                if (trendClass === 'up') { trendClass = 'down'; trendIcon = 'fa-arrow-down'; }
                else if (trendClass === 'down') { trendClass = 'up'; trendIcon = 'fa-arrow-up'; }
            }

            textEl.textContent = change.text + ' vs prev';
            iconEl.className = 'fas ' + trendIcon;
            trendEl.className = 'metric-trend small ' + trendClass;
        }
    }

     async function loadVisitorEngagement() {
        const chartId = 'engagementChart';
        chartUtils.showLoading(chartId);
        updateMetricCard('avgSessionDuration', '--', 0, (val)=>val);
        updateMetricCard('avgBounceRate', '--', 0, (val)=>val);
        updateMetricCard('avgActionsPerVisit', '--', 0, (val)=>val);

        try {
            const data = await analyticsService.getVisitorEngagement(selectedPeriod, selectedGranularity);
            currentEngagementData = data;
            const current = data.current.metrics;
            const previous = data.previous.metrics;

            updateMetricCard('avgSessionDuration', current.avgSessionDuration, previous.avgSessionDuration, (val) => chartUtils.formatTime(val || 0));
            updateMetricCard('avgBounceRate', current.avgBounceRate, previous.avgBounceRate, (val) => chartUtils.formatPercentage(val || 0, 1), true);
            updateMetricCard('avgActionsPerVisit', current.avgActionsPerVisit, previous.avgActionsPerVisit, (val) => (val || 0).toFixed(1));

            updateEngagementChart();
        } catch (error) {
            currentEngagementData = null;
            showEmptyState(chartId, true, 'Failed to load engagement data');
            updateMetricCard('avgSessionDuration', 'Error', 0, (val)=>val);
            updateMetricCard('avgBounceRate', 'Error', 0, (val)=>val);
            updateMetricCard('avgActionsPerVisit', 'Error', 0, (val)=>val);
        } finally {
            chartUtils.hideLoading(chartId);
        }
     }

    async function loadPagesTableData() {
        const containerId = 'pagesTableContainer';
        showLoadingState(containerId, true);
        try {
            const data = await analyticsService.getPageViewMetrics(selectedPeriod);
            renderPagesTable(data.topPages);
        } catch (error) {
            showEmptyState(containerId, true, 'Failed to load page data');
        } finally {
             showLoadingState(containerId, false);
        }
    }

    async function loadUserFlowData() {
        const entryChartId = 'entryPagesChart';
        const exitChartId = 'exitPagesChart';
        chartUtils.showLoading(entryChartId);
        chartUtils.showLoading(exitChartId);
        try {
            const data = await analyticsService.getUserFlowMetrics(selectedPeriod);
            renderEntryPagesChart(data.entryPages);
            renderExitPagesChart(data.exitPages);
        } catch (error) {
            showEmptyState(entryChartId, true, 'Failed to load entry page data');
            showEmptyState(exitChartId, true, 'Failed to load exit page data');
        } finally {
            chartUtils.hideLoading(entryChartId);
            chartUtils.hideLoading(exitChartId);
        }
    }

    function updateEngagementChart() {
       const chartId = 'engagementChart';
       const container = document.getElementById(chartId);
        if (!container) return;

        if (!currentEngagementData || !currentEngagementData.current || !currentEngagementData.current.dates || currentEngagementData.current.dates.length === 0) {
            showEmptyState(chartId, true);
            if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); }
            return;
        }
         showEmptyState(chartId, false);

       let chartData;
       let yAxisTitle;
       let formatter;
       let dataKey;
       const trendData = currentEngagementData.current;

       switch(selectedEngagementMetric) {
           case 'bounceRate':
               dataKey = 'bounceRate'; yAxisTitle = 'Bounce Rate (%)';
               formatter = (value) => chartUtils.formatPercentage(value, 1);
               break;
            case 'actionsPerVisit':
               dataKey = 'actionsPerVisit'; yAxisTitle = 'Actions / Visit';
               formatter = (value) => (value || 0).toFixed(1);
               break;
           case 'sessionDuration': default:
               dataKey = 'sessionDuration'; yAxisTitle = 'Avg. Duration';
               formatter = (value) => chartUtils.formatTime(value || 0);
               break;
       }
       chartData = trendData[dataKey] || [];

       const options = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
         chart: { 
           id: chartId, 
           type: 'area', 
           height: 300, 
           toolbar: { show: false },
           zoom: { enabled: false }
         },
         xaxis: { categories: trendData.dates },
         yaxis: { title: { text: yAxisTitle }, labels: { formatter: formatter } },
         series: [{ name: yAxisTitle, data: chartData }],
         colors: [chartUtils.getBaseOptions().colors[1]],
         stroke: { curve: 'smooth', width: 2 },
         fill: { type: 'gradient', gradient: { shadeIntensity: 0.5, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 95, 100] } },
         markers: { size: 0, hover: { size: 4 } },
         tooltip: { y: { formatter: formatter } }
       });

        try {
            const chart = window.ApexCharts.getChartByID(chartId);
            if (chart) {
                chart.updateOptions(options, true, true);
            } else {
                const newChart = new ApexCharts(container, options);
                newChart.render();
            }
        } catch(e) {
             showEmptyState(chartId, true, 'Error rendering chart');
             try { if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); } } catch(e2){}
        }
     }

    function renderPagesTable(pagesData) {
        const containerId = 'pagesTableContainer';
        const tableBody = document.querySelector("#pagesTable tbody");
        if(!tableBody) return;
        tableBody.innerHTML = '';

        try {
            if (!pagesData || pagesData.length === 0) {
                 showEmptyState(containerId, true); return;
             }
             showEmptyState(containerId, false);

            pagesData.forEach(page => {
                const row = tableBody.insertRow();
                row.innerHTML =
                    '<td class="text-truncate" title="' + (page.title || page.page) + ' (' + page.page +')">' +
                       '<div class="page-title-wrapper">' + (page.title || page.page) + '</div>' +
                       '<div class="small text-muted">' + page.page + '</div>' +
                    '</td>' +
                    '<td class="text-end">' + chartUtils.formatNumber(page.pageviews || 0) + '</td>' +
                    '<td class="text-end">' + chartUtils.formatNumber(page.uniquePageviews || 0) + '</td>' +
                    '<td class="text-end">' + chartUtils.formatTime(page.avgTime || 0) + '</td>' +
                    '<td class="text-end">' + chartUtils.formatPercentage(page.bounceRate || 0, 1) + '</td>' +
                    '<td class="text-end">' + chartUtils.formatPercentage(page.exitRate || 0, 1) + '</td>';
            });
        } catch (e) {
             showEmptyState(containerId, true, 'Error rendering table');
             tableBody.innerHTML = '';
        }
    }

    function renderEntryPagesChart(entryPagesData) {
        const chartId = 'entryPagesChart';
        const container = document.getElementById(chartId);
        if (!container) return;

        try {
            if (!entryPagesData || entryPagesData.length === 0) {
                showEmptyState(chartId, true);
                if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); }
                return;
            }
            showEmptyState(chartId, false);

            const topEntries = entryPagesData.slice(0, 5);

            const options = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
                chart: {
                    id: chartId,
                    type: 'bar',
                    height: 350,
                    toolbar: { show: false }
                },
                plotOptions: {
                    bar: {
                        horizontal: true,
                        barHeight: '60%',
                        borderRadius: 4
                    }
                },
                colors: [chartUtils.getBaseOptions().colors[0]],
                dataLabels: { enabled: false },
                series: [{
                    name: 'Entries',
                    data: topEntries.map(p => p.entries || 0)
                }],
                xaxis: {
                    categories: topEntries.map(p => p.title || p.page),
                    labels: {
                        style: {
                            fontSize: '13px'
                        },
                        formatter: (val) => val.length > 25 ? val.substring(0, 23) + '...' : val
                    },
                    title: { text: 'Entries' }
                },
                yaxis: {
                    labels: {
                        style: {
                            fontSize: '13px'
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: (value) => chartUtils.formatNumber(value, 0) + ' entries'
                    }
                },
                grid: {
                    borderColor: '#f1f1f1'
                }
            });

            const chart = window.ApexCharts.getChartByID(chartId);
            if (chart) {
                chart.updateOptions(options);
            } else {
                const newChart = new ApexCharts(container, options);
                newChart.render();
            }
        } catch (e) {
            showEmptyState(chartId, true, 'Error rendering chart');
            try { if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); } } catch (e2) {}
        }
    }

    function renderExitPagesChart(exitPagesData) {
        const chartId = 'exitPagesChart';
        const container = document.getElementById(chartId);
        if (!container) return;

        try {
            if (!exitPagesData || exitPagesData.length === 0) {
                showEmptyState(chartId, true);
                if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); }
                return;
            }
            showEmptyState(chartId, false);

            const topExits = exitPagesData.slice(0, 5);

            const options = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
                chart: {
                    id: chartId,
                    type: 'bar',
                    height: 350,
                    toolbar: { show: false }
                },
                plotOptions: {
                    bar: {
                        horizontal: true,
                        barHeight: '60%',
                        borderRadius: 4
                    }
                },
                colors: [chartUtils.getBaseOptions().colors[1]],
                dataLabels: { enabled: false },
                series: [{
                    name: 'Exits',
                    data: topExits.map(p => p.exits || 0)
                }],
                xaxis: {
                    categories: topExits.map(p => p.title || p.page),
                    labels: {
                        style: {
                            fontSize: '13px'
                        },
                        formatter: (val) => val.length > 25 ? val.substring(0, 23) + '...' : val
                    },
                    title: { text: 'Exits' }
                },
                yaxis: {
                    labels: {
                        style: {
                            fontSize: '13px'
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: (value, { dataPointIndex }) =>
                            chartUtils.formatNumber(value, 0) +
                            ' Exits (' +
                            (topExits[dataPointIndex]?.exitRate || 0).toFixed(1) +
                            '%)'
                    }
                },
                grid: {
                    borderColor: '#f1f1f1'
                }
            });

            const chart = window.ApexCharts.getChartByID(chartId);
            if (chart) {
                chart.updateOptions(options);
            } else {
                const newChart = new ApexCharts(container, options);
                newChart.render();
            }
        } catch (e) {
            showEmptyState(chartId, true, 'Error rendering chart');
            try { if (window.ApexCharts.getChartByID(chartId)) { window.ApexCharts.getChartByID(chartId).destroy(); } } catch (e2) {}
        }
    }
});
