document.addEventListener('DOMContentLoaded', function() {
  const dateRangePicker = new DateRangePicker('dateRangePicker');
  let selectedPeriod = dateRangePicker.getPeriod();
  let selectedGranularity = 'day';
  const currencyCode = window.activeBusinessData && window.activeBusinessData.currency
    ? window.activeBusinessData.currency
    : 'BRL';
  let currentView = 'campaign';
  let currentData = { sources: [], campaigns: [] };

  initializeAll();
  setupEventListeners();

  function initializeAll() {
    loadTrafficSourcesData();
    loadReferrerAndUtmData();
  }

  function setupEventListeners() {
    dateRangePicker.onPeriodChange = (period) => {
      selectedPeriod = period;
      refreshAll();
    };

    document.querySelectorAll('#granularityFilter button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('#granularityFilter button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        selectedGranularity = button.dataset.granularity;
        loadReferrerAndUtmData();
      });
    });

    document.querySelectorAll('#viewTypeFilter button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('#viewTypeFilter button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentView = button.dataset.view;
        updatePerformanceView();
      });
    });
  }

  function refreshAll() {
    loadTrafficSourcesData();
    loadReferrerAndUtmData();
  }

  function showLoadingState(elementId, isLoading) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const loader = el.querySelector('.chart-loader') || el.closest('.card-body')?.querySelector('.chart-loader');
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
  }

  function showEmptyState(elementId, show, message = 'No data available') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const empty = el.querySelector('.chart-empty-state') || el.closest('.card-body')?.querySelector('.chart-empty-state');
    const content = el.querySelector('div[id$="Chart"], ul, table, .table-responsive');
    if (empty) {
      empty.style.display = show ? 'flex' : 'none';
      if (show) empty.querySelector('p').textContent = message;
    }
    if (content) {
      if (content.classList?.contains('table-responsive')) {
        content.style.display = show ? 'none' : '';
      } else if (el.querySelector('div[id$="Chart"]')) {
        const chartDiv = el.querySelector('div[id$="Chart"]');
        if (chartDiv) chartDiv.style.display = show ? 'none' : '';
      } else if (content.tagName === 'TABLE' || content.tagName === 'UL') {
        content.style.display = show ? 'none' : '';
      }
    }
  }

  async function loadTrafficSourcesData() {
    chartUtils.showLoading('performanceChart');
    showLoadingState('performanceTableContainer', true);
    try {
      const data = await analyticsService.getTrafficSources(selectedPeriod);
      currentData = data;
      updatePerformanceView();
    } catch (err) {
      showEmptyState('performanceChart', true, 'Failed to load performance data');
      showEmptyState('performanceTableContainer', true, 'Failed to load performance data');
    } finally {
      chartUtils.hideLoading('performanceChart');
      showLoadingState('performanceTableContainer', false);
    }
  }

  async function loadReferrerAndUtmData() {
    showLoadingState('referrerWebsitesTableContainer', true);
    showLoadingState('searchEnginesTableContainer', true);
    const utmEl = document.getElementById('utmAnalysisChart');
    if (utmEl) chartUtils.showLoading('utmAnalysisChart');
    try {
      const data = await analyticsService.getReferrerData(selectedPeriod, selectedGranularity);
      renderReferrerWebsitesTable(data.topWebsites);
      renderSearchEnginesTable(data.searchEnginesSummary);
      renderUtmAnalysisChart(data.utmParameters);
    } catch (err) {
      showEmptyState('referrerWebsitesTableContainer', true, 'Failed to load referrer data');
      showEmptyState('searchEnginesTableContainer', true, 'Failed to load engine data');
      if (utmEl) showEmptyState('utmAnalysisChart', true, 'Failed to load UTM data');
    } finally {
      showLoadingState('referrerWebsitesTableContainer', false);
      showLoadingState('searchEnginesTableContainer', false);
      if (utmEl) chartUtils.hideLoading('utmAnalysisChart');
    }
  }

  function updatePerformanceView() {
    const titleEl = document.getElementById('performanceCardTitle');
    if (currentView === 'channel') {
      titleEl.textContent = 'Channel Performance';
      renderChannelPerformanceChart(currentData.sources);
      renderChannelPerformanceTable(currentData.sources);
    } else {
      titleEl.textContent = 'Campaign Performance';
      renderCampaignPerformanceChart(currentData.campaigns);
      renderCampaignPerformanceTable(currentData.campaigns);
    }
  }

  function renderChannelPerformanceChart(sourcesData) {
    const chartId = 'performanceChart';
    const container = document.getElementById(chartId);
    if (!container) return;
    chartUtils.showLoading(chartId);
    const existing = window.ApexCharts.getChartByID(chartId);
    if (existing) existing.destroy();
    try {
      if (!sourcesData?.length) {
        showEmptyState(chartId, true, 'No channel performance data available');
        return;
      }
      showEmptyState(chartId, false);
      const opts = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
        chart: { id: chartId, type: 'bar', height: 400 },
        plotOptions: { bar: { columnWidth: '60%', distributed: false, borderRadius: 4 } },
        colors: chartUtils.getBaseOptions().colors,
        legend: {position:'top', show: true },
        dataLabels: { enabled: false },
        xaxis: {
          categories: sourcesData.map(s => s.source),
          title: { text: 'Channel Source' },
          labels: {
            rotate: -45,
            hideOverlappingLabels: false,
            style: { fontSize: '10px' },
            formatter: val => (val.length > 15 ? val.slice(0, 15) + '…' : val)
          }
        },
        yaxis: [
          { seriesName: 'Visits', title: { text: 'Visits' }, labels: { formatter: val => chartUtils.formatNumber(val) } },
          { seriesName: 'Revenue', title: { text: 'Revenue' }, opposite: true, labels: { formatter: val => chartUtils.formatCurrency(val, currencyCode) } }
        ],
        series: [
          { name: 'Visits', data: sourcesData.map(s => s.visitors || 0) },
          { name: 'Revenue', data: sourcesData.map(s => s.revenue || 0) }
        ],
        tooltip: {
          y: {
            formatter: (v, { seriesIndex }) =>
              seriesIndex === 0
                ? chartUtils.formatNumber(v, 0) + ' visits'
                : chartUtils.formatCurrency(v, currencyCode)
          }
        }
      });
      new ApexCharts(container, opts).render();
    } catch (e) {
      showEmptyState(chartId, true, 'Error rendering chart');
    } finally {
      chartUtils.hideLoading(chartId);
    }
  }

  function renderCampaignPerformanceChart(data) {
    const chartId = 'performanceChart';
    const container = document.getElementById(chartId);
    if (!container) return;
    chartUtils.showLoading(chartId);
    const existing = window.ApexCharts.getChartByID(chartId);
    if (existing) existing.destroy();
    try {
      if (!data?.length) {
        showEmptyState(chartId, true, 'No campaign performance data available');
        return;
      }
      showEmptyState(chartId, false);
      const top10 = [...data].sort((a,b) => (b.revenue||0)-(a.revenue||0)).slice(0,10);
      const opts = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
        chart: { id: chartId, type: 'bar', height: 400 },
        plotOptions: { bar: { columnWidth: '60%', distributed: false, borderRadius: 4 } },
        colors: chartUtils.getBaseOptions().colors,
        legend: {position:'top', show: true },
        dataLabels: { enabled: false },
        xaxis: {
          categories: top10.map(c => c.campaign),
          labels: {
            rotate: -45,
            hideOverlappingLabels: false,
            style: { fontSize: '10px' },
            formatter: val => (val.length > 15 ? val.slice(0,15)+'…' : val)
          }
        },
        yaxis: [
          { seriesName: 'Visits', title: { text: 'Visits' }, labels: { formatter: val => chartUtils.formatNumber(val) } },
          { seriesName: 'Revenue', title: { text: 'Revenue' }, opposite: true, labels: { formatter: val => chartUtils.formatCurrency(val, currencyCode) } }
        ],
        series: [
          { name: 'Visits', data: top10.map(c => c.visits || 0) },
          { name: 'Revenue', data: top10.map(c => c.revenue || 0) }
        ],
        tooltip: {
          y: {
            formatter: (v, { seriesIndex }) =>
              seriesIndex === 0
                ? chartUtils.formatNumber(v, 0) + ' visits'
                : chartUtils.formatCurrency(v, currencyCode)
          }
        }
      });
      new ApexCharts(container, opts).render();
    } catch (e) {
      showEmptyState(chartId, true, 'Error rendering chart');
    } finally {
      chartUtils.hideLoading(chartId);
    }
  }

  function renderChannelPerformanceTable(sourcesData) {
    const id = 'performanceTableContainer';
    const th = document.getElementById('performanceTableHead');
    const tb = document.getElementById('performanceTableBody');
    if (!th || !tb) return;
    th.innerHTML = '<tr><th>Channel</th><th class="text-end">Visits</th><th class="text-end">Conversions</th><th class="text-end">Conv. Rate</th><th class="text-end">Bounce Rate</th><th class="text-end">Avg. Ticket</th><th class="text-end">Revenue</th></tr>';
    tb.innerHTML = '';
    try {
      if (!sourcesData?.length) {
        showEmptyState(id, true, 'No channel performance data available');
        return;
      }
      showEmptyState(id, false);
      [...sourcesData]
        .sort((a,b)=> (b.visitors||0)-(a.visitors||0))
        .forEach(s => {
          const v = s.visitors || 0;
          const cv = s.conversions || 0;
          const rev = s.revenue || 0;
          const cr = s.conversionRate !== undefined ? s.conversionRate : (v > 0 ? (cv/v)*100 : 0);
          const br = s.bounceRate || 0;
          const at = cv > 0 ? rev/cv : 0;
          const row = tb.insertRow();
          row.innerHTML =
            '<td>'+ (s.source||'N/A') + '</td>' +
            '<td class="text-end">'+ chartUtils.formatNumber(v,0) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatNumber(cv,0) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatPercentage(cr,1) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatPercentage(br,1) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatCurrency(at,currencyCode,2) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatCurrency(rev,currencyCode,2) + '</td>';
        });
    } catch(e) {
      showEmptyState(id,true,'Error rendering table');
      tb.innerHTML = '';
    }
  }

  function renderCampaignPerformanceTable(data) {
    const id = 'performanceTableContainer';
    const th = document.getElementById('performanceTableHead');
    const tb = document.getElementById('performanceTableBody');
    if (!th || !tb) return;
    th.innerHTML = '<tr><th>Campaign</th><th class="text-end">Visits</th><th class="text-end">Conversions</th><th class="text-end">Conv. Rate</th><th class="text-end">Bounce Rate</th><th class="text-end">Avg. Ticket</th><th class="text-end">Revenue</th></tr>';
    tb.innerHTML = '';
    try {
      if (!data?.length) {
        showEmptyState(id,true,'No campaign data available');
        return;
      }
      showEmptyState(id,false);
      [...data]
        .sort((a,b)=> (b.visits||0)-(a.visits||0))
        .forEach(c => {
          const v = c.visits || 0;
          const cv = c.conversions || 0;
          const rev = c.revenue || 0;
          const cr = c.conversionRate !== undefined ? c.conversionRate : (v > 0 ? (cv/v)*100 : 0);
          const br = c.bounceRate || 0;
          const at = cv > 0 ? rev/cv : 0;
          const row = tb.insertRow();
          row.innerHTML =
            '<td>'+ (c.campaign||'N/A') + '</td>' +
            '<td class="text-end">'+ chartUtils.formatNumber(v,0) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatNumber(cv,0) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatPercentage(cr,1) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatPercentage(br,1) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatCurrency(at,currencyCode,2) + '</td>' +
            '<td class="text-end">'+ chartUtils.formatCurrency(rev,currencyCode,2) + '</td>';
        });
    } catch(e) {
      showEmptyState(id,true,'Error rendering table');
      tb.innerHTML = '';
    }
  }

  function renderReferrerWebsitesTable(websiteData) {
    const id = 'referrerWebsitesTableContainer';
    const tb = document.querySelector("#referrerWebsitesTable tbody");
    if (!tb) return;
    tb.innerHTML = '';
    try {
      if (!websiteData?.length) {
        showEmptyState(id,true,'No referrer website data available');
        return;
      }
      showEmptyState(id,false);
      websiteData.forEach(site => {
        const row = tb.insertRow();
        row.innerHTML =
          '<td class="text-truncate" title="'+ site.url +'">'+ (site.url||'N/A') +'</td>' +
          '<td class="text-end">'+ chartUtils.formatNumber(site.visits||0,0) +'</td>';
      });
    } catch(e) {
      showEmptyState(id,true,'Error rendering table');
      tb.innerHTML = '';
    }
  }

  function renderSearchEnginesTable(engineData) {
    const id = 'searchEnginesTableContainer';
    const tb = document.querySelector("#searchEnginesTable tbody");
    if (!tb) return;
    tb.innerHTML = '';
    try {
      if (!engineData?.length) {
        showEmptyState(id,true,'No search engine data available');
        return;
      }
      showEmptyState(id,false);
      engineData.forEach(engine => {
        const row = tb.insertRow();
        row.innerHTML =
          '<td>'+ (engine.engine||'N/A') +'</td>' +
          '<td class="text-end">'+ chartUtils.formatNumber(engine.visits||0,0) +'</td>';
      });
    } catch(e) {
      showEmptyState(id,true,'Error rendering table');
      tb.innerHTML = '';
    }
  }

  function renderUtmAnalysisChart(utmData) {
    const chartId = 'utmAnalysisChart';
    const container = document.getElementById(chartId);
    if (!container) { return; }
    chartUtils.showLoading(chartId);
    const existing = window.ApexCharts.getChartByID(chartId);
    if (existing) existing.destroy();
    try {
      if (!utmData?.length) {
        showEmptyState(chartId,true,'No UTM data available for analysis.');
        return;
      }
      const sorted = [...utmData].sort((a,b)=>(b.visitors||0)-(a.visitors||0)).slice(0,15);
      if (!sorted.length) {
        showEmptyState(chartId,true,'No UTM data to display after filtering.');
        return;
      }
      showEmptyState(chartId,false);
      const cats = sorted.map(i=>(i.source||'N/A')+'/'+(i.medium||'N/A'));
      const visitors = sorted.map(i=>i.visitors||0);
      const conversions = sorted.map(i=>i.conversions||0);
      const vColor = chartUtils.getBaseOptions().colors[0];
      const cColor = chartUtils.getBaseOptions().colors[1];
      const opts = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
        chart: {
          id: chartId, type: 'bar', height: 420,
          toolbar: { show:false, tools:{download:true,selection:false,zoom:false,zoomin:false,zoomout:false,pan:false,reset:false} }
        },
        plotOptions: { bar: { horizontal:false,columnWidth:'70%',borderRadius:4,distributed:false } },
        colors: [vColor,cColor],
        series: [{ name:'Visitors', data: visitors }, { name:'Conversions', data: conversions }],
        xaxis: {
          categories: cats,
          labels: {
            rotate:-45,trim:true,maxHeight:120,style:{fontSize:'10px'},
            formatter: v=> v.length>25 ? v.substr(0,22)+'…' : v
          },
          tooltip:{enabled:false}
        },
        yaxis: [
          { seriesName:'Visitors', labels:{formatter:v=>chartUtils.formatNumber(v,0)}, title:{text:'Visitors', style:{color:vColor}}, axisTicks:{show:true,color:vColor}, axisBorder:{show:true,color:vColor} },
          { seriesName:'Conversions', opposite:true, labels:{formatter:v=>chartUtils.formatNumber(v,0)}, title:{text:'Conversions', style:{color:cColor}}, axisTicks:{show:true,color:cColor}, axisBorder:{show:true,color:cColor},
            tickAmount: Math.max(...conversions)>0&&Math.max(...conversions)<=5?Math.max(...conversions)+1:undefined }
        ],
        tooltip: {
          shared:true, intersect:false,
          y:{ formatter:(val,{seriesIndex})=> seriesIndex===0 ? chartUtils.formatNumber(val,0)+' visitors' : chartUtils.formatNumber(val,0)+' conversions' }
        },
        legend:{ position:'top', horizontalAlign:'center', offsetY:-5 },
        dataLabels:{enabled:false},
        stroke:{show:true,width:1,colors:['transparent']}
      });
      new ApexCharts(container, opts).render();
    } catch(e) {
      showEmptyState(chartId,true,'Error rendering UTM analysis chart.');
    } finally {
      chartUtils.hideLoading(chartId);
    }
  }
});