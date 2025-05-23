const chartUtils = {
  getBaseOptions() {
    const themeAttribute = document.documentElement.getAttribute('data-theme');
    const isLightTheme = themeAttribute === 'light';
    const textColorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const textColorSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    return {
      chart: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'transparent',
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          },
          export: {
            csv: { filename: undefined },
            svg: { filename: undefined },
            png: { filename: undefined }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 600,
          animateGradually: { enabled: false },
          dynamicAnimation: { enabled: true, speed: 300 }
        },
        foreColor: textColorPrimary
      },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A'],
      tooltip: {
        theme: isLightTheme ? 'light' : 'dark',
        x: { show: true }
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: borderColor,
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        offsetY: 8,
        fontSize: '11px',
        labels: { colors: textColorSecondary },
        itemMargin: { horizontal: 8, vertical: 2 }
      },
      xaxis: {
        labels: {
          style: { colors: textColorSecondary, fontSize: '11px' },
          trim: true,
          rotate: 0
        },
        axisBorder: { color: borderColor },
        axisTicks: { color: borderColor },
        tooltip: { enabled: false }
      },
      yaxis: {
        labels: {
          style: { colors: textColorSecondary, fontSize: '11px' },
          formatter: (value) => {
            if (typeof value !== 'number') return value;
            if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1).replace('.0','') + 'M';
            if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1).replace('.0','') + 'K';
            return value.toFixed(0);
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 300 },
            xaxis: { labels: { style: { fontSize: '10px' } } },
            yaxis: { labels: { style: { fontSize: '10px' } } },
            legend: { fontSize: '10px' }
          }
        },
        {
          breakpoint: 480,
          options: {
            chart: { height: 250 },
            legend: { fontSize: '10px', itemMargin: { horizontal: 5 } }
          }
        }
      ]
    };
  },

  mergeOptions(...options) {
    return options.reduce((result, option) => this._deepMerge(result, option), {});
  },

  _deepMerge(target, source) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this._deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },


  formatNumber(value, decimals = 0) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(decimals).replace(/\.0$/, '') + 'M';
    if (Math.abs(value) >= 1000) return (value / 1000).toFixed(decimals).replace(/\.0$/, '') + 'K';
    return value.toFixed(decimals);
  },

  formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  },

  formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number' || isNaN(value)) return '--%';
    return value.toFixed(decimals) + '%';
  },

  formatCurrency(value, currency = 'BRL', decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  },

  formatPercentageChange(newValue, oldValue) {
    if (typeof newValue !== 'number' || typeof oldValue !== 'number' || isNaN(newValue) || isNaN(oldValue)) {
      return { text: '', trend: 'neutral', icon: 'fa-minus' };
    }
    if (oldValue === 0) {
      if (newValue === 0) return { text: '0.0%', trend: 'neutral', icon: 'fa-minus' };
      return { text: newValue > 0 ? '+inf%' : '-inf%', trend: newValue > 0 ? 'up' : 'down', icon: newValue > 0 ? 'fa-arrow-up' : 'fa-arrow-down' };
    }
    const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    const absChange = Math.abs(change);
    let trend = 'neutral';
    let icon = 'fa-minus';
    if (change > 0.1) { trend = 'up'; icon = 'fa-arrow-up'; }
    else if (change < -0.1) { trend = 'down'; icon = 'fa-arrow-down'; }

    return {
      text: `${change >= 0 ? '+' : ''}${absChange.toFixed(1)}%`,
      trend: trend,
      icon: icon
    };
  },

  showLoading(chartId) {
    const container = document.getElementById(chartId)?.closest('.chart-container');
    if (!container) return;
    let loader = container.querySelector('.chart-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'chart-loader';
      loader.innerHTML = `<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
      const chartDiv = document.getElementById(chartId);
      if (chartDiv && chartDiv.parentNode === container) {
        container.insertBefore(loader, chartDiv);
      } else {
        container.appendChild(loader);
      }
    }
    loader.style.display = 'flex';
  },

  hideLoading(chartId) {
    const container = document.getElementById(chartId)?.closest('.chart-container');
    if (!container) return;
    const loader = container.querySelector('.chart-loader');
    if (loader) loader.style.display = 'none';
  },

  showEmptyState(chartId, message = 'No data available for the selected period') {
    const container = document.getElementById(chartId)?.closest('.chart-container');
    if (!container) return;
    let emptyState = container.querySelector('.chart-empty-state');
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'chart-empty-state';
      emptyState.innerHTML = `<i class="fas fa-chart-area"></i><p>${message}</p>`;
      const chartDiv = document.getElementById(chartId);
      if (chartDiv && chartDiv.parentNode === container) {
        container.insertBefore(emptyState, chartDiv);
      } else {
        container.appendChild(emptyState);
      }
    }
    emptyState.style.display = 'flex';
    emptyState.querySelector('p').textContent = message;
    const chartElement = document.getElementById(chartId);
    if(chartElement) chartElement.style.display = 'none';
  },

  hideEmptyState(chartId) {
    const container = document.getElementById(chartId)?.closest('.chart-container');
    if (!container) return;
    const emptyState = container.querySelector('.chart-empty-state');
    if (emptyState) emptyState.style.display = 'none';
    const chartElement = document.getElementById(chartId);
    if(chartElement) chartElement.style.display = '';
  },

  initExportDropdown(chartId) {
    const chartCard = document.getElementById(chartId)?.closest('.chart-card');
    if (!chartCard) return;
    const exportBtn = chartCard.querySelector('.export-btn');
    const exportMenu = chartCard.querySelector('.export-dropdown-menu');
    if (!exportBtn || !exportMenu) return;

    const instance = {
      toggleMenu: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isShown = exportMenu.classList.contains('show');
        document.querySelectorAll('.export-dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
        if (!isShown) {
          exportMenu.classList.add('show');
          const btnRect = exportBtn.getBoundingClientRect();
          const cardRect = chartCard.getBoundingClientRect();
          exportMenu.style.top = (btnRect.bottom - cardRect.top + 5) + 'px';
          exportMenu.style.left = 'auto';
          exportMenu.style.right = (cardRect.right - btnRect.right) + 'px';
        }
      },
      closeMenu: (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
          exportMenu.classList.remove('show');
        }
      },
      exportChart: async (e, format) => {
        e.preventDefault();
        const apexChart = window.ApexCharts.getChartByID(chartId);
        if (!apexChart) return;
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `chart-${chartId}-${timestamp}`;

        try {
          if (format === 'png') {
            const dataUrl = await apexChart.dataURI({ scale: 2 });
            instance.triggerDownload(dataUrl.imgURI, `${filename}.png`);
          } else if (format === 'svg') {
            const { svg } = apexChart.exports.exportToSVG();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            instance.triggerDownload(URL.createObjectURL(blob), `${filename}.svg`);
          } else if (format === 'csv') {
            apexChart.exports.exportToCSV({filename: filename});
          }
        } catch(err) {
          alert('Failed to export chart: ' + err.message);
        } finally {
          exportMenu.classList.remove('show');
        }
      },
      triggerDownload: (href, filename) => {
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (href.startsWith('blob:')) { URL.revokeObjectURL(href); }
      },
      destroy: () => {
        exportBtn.removeEventListener('click', instance.toggleMenu);
        document.removeEventListener('click', instance.closeMenu);
        exportMenu.querySelectorAll('.export-dropdown-item').forEach(option => {});
      }
    };

    exportBtn.addEventListener('click', instance.toggleMenu);
    document.addEventListener('click', instance.closeMenu);

    exportMenu.querySelectorAll('.export-dropdown-item').forEach(option => {
      option.addEventListener('click', (e) => instance.exportChart(e, option.dataset.format));
    });

    chartCard._exportDropdownInstance = instance;
  }
};