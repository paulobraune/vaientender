document.addEventListener('DOMContentLoaded', function () {
  const dateRangePicker = new DateRangePicker('dateRangePicker');
  let selectedPeriod = dateRangePicker.getPeriod();
  let selectedGranularity = 'day';
  let primaryMetric = 'revenue';
  let secondaryMetric = 'orders';
  let currentEcommerceData = null;
  const currencyCode =
    window.activeBusinessData && window.activeBusinessData.currency
      ? window.activeBusinessData.currency
      : 'BRL';

  initializeAll();
  setupEventListeners();

  function initializeAll() {
    loadEcommerceMetrics();
    loadProductPerformance();
    updateMetricButtonStates();
  }

  function updateMetricButtonStates() {
    const buttons = document.querySelectorAll('#ecommerceMetricFilter button');
    buttons.forEach((btn) => {
      const metric = btn.dataset.metric;
      btn.classList.remove('active', 'secondary-active');

      if (metric === primaryMetric) {
        btn.classList.add('active');
      } else if (metric === secondaryMetric) {
        btn.classList.add('secondary-active');
      }
    });
  }

  function setupEventListeners() {
    dateRangePicker.onPeriodChange = (period) => {
      selectedPeriod = period;
      refreshAll();
    };

    const granularityButtons = document.querySelectorAll(
      '#granularityFilter button'
    );
    granularityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        granularityButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGranularity = btn.dataset.granularity;
        loadEcommerceMetrics();
      });
    });

    const metricButtons = document.querySelectorAll(
      '#ecommerceMetricFilter button'
    );
    metricButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const metric = this.dataset.metric;

        this.classList.add('button-pulse');
        setTimeout(() => {
          this.classList.remove('button-pulse');
        }, 300);

        if (this.classList.contains('active')) {
          this.classList.remove('active');
          primaryMetric = null;
        } else if (this.classList.contains('secondary-active')) {
          this.classList.remove('secondary-active');
          secondaryMetric = null;
        } else {
          if (primaryMetric === null) {
            primaryMetric = metric;
            this.classList.add('active');
          } else if (secondaryMetric === null) {
            secondaryMetric = metric;
            this.classList.add('secondary-active');
          } else {
            // MODIFICADO AQUI para usar 'warning'
            showGlobalAlert(
              'Please deselect a metric first before selecting a new one.',
              'warning'
            );
            return;
          }
        }
        updateEcommercePerformanceChart();
      });
    });
  }

  function refreshAll() {
    loadEcommerceMetrics();
    loadProductPerformance();
  }

  function showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const loader =
      element.querySelector('.chart-loader') ||
      element.closest('.card-body')?.querySelector('.chart-loader');
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
  }

  function showEmptyState(elementId, show, message = 'No data available') {
    const element = document.getElementById(elementId);
    if (!element) return;
    let emptyState =
      element.querySelector('.chart-empty-state') ||
      element.closest('.card-body')?.querySelector('.chart-empty-state');
    const contentElement = element.querySelector(
      'div[id$="Chart"], ul, table, .table-responsive'
    );

    if (emptyState) {
      emptyState.style.display = show ? 'flex' : 'none';
      if (show) emptyState.querySelector('p').textContent = message;
    }
    if (contentElement) contentElement.style.display = show ? 'none' : '';
  }

  function updateMetricCard(
    idPrefix,
    currentValue,
    previousValue,
    formatFn,
    isInverted = false
  ) {
    const valueEl = document.getElementById(idPrefix);
    const iconEl = document.getElementById(idPrefix + 'TrendIcon');
    const textEl = document.getElementById(idPrefix + 'TrendText');
    const trendEl = textEl?.parentElement;

    if (valueEl) valueEl.textContent = formatFn(currentValue);

    if (iconEl && textEl && trendEl) {
      const change = chartUtils.formatPercentageChange(
        currentValue,
        previousValue
      );
      let trendClass = change.trend;
      let trendIcon = change.icon;

      if (isInverted) {
        if (trendClass === 'up') {
          trendClass = 'down';
          trendIcon = 'fa-arrow-down';
        } else if (trendClass === 'down') {
          trendClass = 'up';
          trendIcon = 'fa-arrow-up';
        }
      }

      textEl.textContent = change.text + ' vs prev';
      iconEl.className = 'fas ' + trendIcon;
      trendEl.className = 'metric-trend small ' + trendClass;
    }
  }

  async function loadEcommerceMetrics() {
    const chartId = 'ecommercePerformanceChart';
    chartUtils.showLoading(chartId);
    updateMetricCard('summaryTotalRevenue', '--', 0, (val) => val);
    updateMetricCard('summaryTotalOrders', '--', 0, (val) => val);
    updateMetricCard('summaryAvgOrderValue', '--', 0, (val) => val);
    updateMetricCard('summaryAvgConversionRate', '--', 0, (val) => val);

    try {
      const data = await analyticsService.getEcommerceMetrics(
        selectedPeriod,
        selectedGranularity
      );
      currentEcommerceData = data;
      const cur = data.current.summary,
        prev = data.previous.summary;

      updateMetricCard(
        'summaryTotalRevenue',
        cur.totalRevenue,
        prev.totalRevenue,
        (val) => chartUtils.formatCurrency(val || 0, currencyCode, 0)
      );
      updateMetricCard(
        'summaryTotalOrders',
        cur.totalOrders,
        prev.totalOrders,
        (val) => chartUtils.formatNumber(val || 0)
      );
      updateMetricCard(
        'summaryAvgOrderValue',
        cur.avgOrderValue,
        prev.avgOrderValue,
        (val) => chartUtils.formatCurrency(val || 0, currencyCode, 2)
      );
      updateMetricCard(
        'summaryAvgConversionRate',
        cur.avgConversionRate,
        prev.avgConversionRate,
        (val) => chartUtils.formatPercentage(val || 0, 1)
      );

      updateEcommercePerformanceChart();
    } catch (error) {
      updateMetricCard('summaryTotalRevenue', 'Error', 0, (val) => val);
      updateMetricCard('summaryTotalOrders', 'Error', 0, (val) => val);
      updateMetricCard('summaryAvgOrderValue', 'Error', 0, (val) => val);
      updateMetricCard('summaryAvgConversionRate', 'Error', 0, (val) => val);
      showEmptyState(chartId, true, 'Failed to load ecommerce data');
    } finally {
      chartUtils.hideLoading(chartId);
    }
  }

  async function loadProductPerformance() {
    const containerId = 'productPerformanceTableContainer';
    showLoadingState(containerId, true);
    try {
      const data = await analyticsService.getProductPerformance(selectedPeriod);
      renderProductPerformanceTable(data.topProducts);
    } catch (error) {
      showEmptyState(containerId, true, 'Failed to load product data');
    } finally {
      showLoadingState(containerId, false);
    }
  }

  function updateEcommercePerformanceChart() {
    const chartId = 'ecommercePerformanceChart';
    const container = document.getElementById(chartId);
    if (!container) return;

    if (
      !currentEcommerceData ||
      !currentEcommerceData.current ||
      !currentEcommerceData.current.dates
    ) {
      showEmptyState(chartId, true);
      if (window.ApexCharts.getChartByID(chartId)) {
        window.ApexCharts.getChartByID(chartId).destroy();
      }
      return;
    }

    showEmptyState(chartId, false);

    const trendData = currentEcommerceData.current;
    const series = [];
    const yAxisConfigs = [];
    let hasAnyMetrics = false;

    function getMetricConfig(metric) {
      if (!metric) return null;

      let data, title, formatter, color;
      const colors = chartUtils.getBaseOptions().colors;

      switch (metric) {
        case 'orders':
          data = trendData.trends.orders || [];
          title = 'Orders';
          formatter = (value) => chartUtils.formatNumber(value || 0, 0);
          color = colors[1];
          break;
        case 'avgOrderValue':
          data = trendData.trends.orders.map((orders, index) => {
            const revenue = trendData.trends.revenue[index] || 0;
            return orders > 0 ? revenue / orders : 0;
          });
          title = 'Avg Order Value (' + currencyCode + ')';
          formatter = (value) =>
            chartUtils.formatCurrency(value || 0, currencyCode, 2);
          color = colors[2];
          break;
        case 'conversionRate':
          data = trendData.trends.conversionRate || [];
          title = 'Conversion Rate (%)';
          formatter = (value) => chartUtils.formatPercentage(value || 0, 1);
          color = colors[3];
          break;
        case 'revenue':
        default:
          data = trendData.trends.revenue || [];
          title = 'Revenue (' + currencyCode + ')';
          formatter = (value) =>
            chartUtils.formatCurrency(value || 0, currencyCode, 2);
          color = colors[0];
          break;
      }

      return { data, title, formatter, color };
    }

    if (primaryMetric) {
      const primaryConfig = getMetricConfig(primaryMetric);
      series.push({
        name: primaryConfig.title,
        data: primaryConfig.data,
        type: 'area',
      });

      yAxisConfigs.push({
        seriesName: primaryConfig.title,
        title: { text: primaryConfig.title },
        labels: { formatter: primaryConfig.formatter },
        axisTicks: { show: true },
        axisBorder: { show: true },
      });

      hasAnyMetrics = true;
    }

    if (secondaryMetric) {
      const secondaryConfig = getMetricConfig(secondaryMetric);
      series.push({
        name: secondaryConfig.title,
        data: secondaryConfig.data,
        type: 'line',
      });

      yAxisConfigs.push({
        seriesName: secondaryConfig.title,
        opposite: true,
        title: { text: secondaryConfig.title },
        labels: { formatter: secondaryConfig.formatter },
        axisTicks: { show: true },
        axisBorder: { show: true },
      });

      hasAnyMetrics = true;
    }

    if (!hasAnyMetrics) {
      showEmptyState(
        chartId,
        true,
        'Please select at least one metric to display'
      );
      if (window.ApexCharts.getChartByID(chartId)) {
        window.ApexCharts.getChartByID(chartId).destroy();
      }
      return;
    }

    const colors = [];
    if (primaryMetric) {
      colors.push(getMetricConfig(primaryMetric).color);
    }
    if (secondaryMetric) {
      colors.push(getMetricConfig(secondaryMetric).color);
    }

    const options = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
      chart: {
        id: chartId,
        type: 'line',
        height: 400,
        toolbar: { show: true },
        zoom: { enabled: false },
      },
      xaxis: { categories: trendData.dates },
      yaxis: yAxisConfigs,
      series: series,
      colors: colors,
      stroke: {
        curve: 'smooth',
        width: secondaryMetric ? [2, 3] : 2,
      },
      fill: {
        type: secondaryMetric ? ['gradient', 'none'] : 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 95, 100],
        },
      },
      markers: {
        size: 0,
        hover: { size: 5 },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (value, { seriesIndex, dataPointIndex, w }) {
            const seriesName = w.config.series[seriesIndex].name;
            const primaryConfig = getMetricConfig(primaryMetric);
            const secondaryConfig = getMetricConfig(secondaryMetric);

            if (primaryConfig && seriesName === primaryConfig.title) {
              return primaryConfig.formatter(value);
            } else if (
              secondaryConfig &&
              seriesName === secondaryConfig.title
            ) {
              return secondaryConfig.formatter(value);
            }
            return value;
          },
        },
      },
    });

    const chart = window.ApexCharts.getChartByID(chartId);
    if (chart) {
      chart.updateOptions(options, true, true);
    } else {
      new ApexCharts(container, options).render();
    }
  }

  function renderProductPerformanceTable(productData) {
    const containerId = 'productPerformanceTableContainer';
    const tableBody = document.querySelector('#productPerformanceTable tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    try {
      if (!productData || productData.length === 0) {
        showEmptyState(containerId, true);
        return;
      }
      showEmptyState(containerId, false);

      productData.forEach((product) => {
        const row = tableBody.insertRow();
        row.innerHTML =
          '<td class="text-truncate" title="' +
          (product.name || 'N/A') +
          '">' +
          (product.name || 'N/A') +
          '</td>' +
          '<td class="text-end">' +
          chartUtils.formatNumber(product.productViews || 0) +
          '</td>' +
          '<td class="text-end">' +
          chartUtils.formatNumber(product.addsToCart || 0) +
          '</td>' +
          '<td class="text-end">' +
          chartUtils.formatNumber(product.quantitySold || 0) +
          '</td>' +
          '<td class="text-end">' +
          chartUtils.formatPercentage(product.conversionRate || 0, 1) +
          '</td>' +
          '<td class="text-end">' +
          chartUtils.formatCurrency(product.revenue || 0, currencyCode, 2) +
          '</td>';
      });
    } catch (e) {
      showEmptyState(containerId, true, 'Error rendering table');
      tableBody.innerHTML = '';
    }
  }
});
