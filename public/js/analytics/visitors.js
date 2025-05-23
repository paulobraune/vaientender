document.addEventListener('DOMContentLoaded', function() {
  const dateRangePicker = new DateRangePicker('dateRangePicker');
  let selectedPeriod = dateRangePicker.getPeriod();
  let selectedGranularity = 'day';
  let currentGeoData = null;
  let currentVisitorData = null;
  let selectedVisitorMetric = 'totalVisits';
  let selectedGeoType = 'country';
  let map = null, heatLayer = null;

  const countryCoordinates = {
    br: [-14.235, -51.9253],
    us: [37.0902, -95.7129],
    pt: [39.3999, -8.2245],
    ar: [-38.4161, -63.6167]
  };

  const brazilStates = [
    { code:'sp', name:'São Paulo',       coords:[-23.5505,-46.6333], visitors:3245, bounceRate:42.3 },
    { code:'rj', name:'Rio de Janeiro',  coords:[-22.9068,-43.1729], visitors:1987, bounceRate:38.7 },
    { code:'mg', name:'Minas Gerais',    coords:[-18.5122,-44.555],  visitors:1245, bounceRate:45.1 }
  ];

  const usStates = [
    { code:'ca', name:'California', coords:[36.7783,-119.4179], visitors:2380, bounceRate:32.4 },
    { code:'ny', name:'New York',   coords:[40.7128,-74.0060],  visitors:1654, bounceRate:29.8 }
  ];

  const ptStates = [
    { code:'lis', name:'Lisboa', coords:[38.7223,-9.1393], visitors:1500, bounceRate:33.5 },
    { code:'prt', name:'Porto',  coords:[41.1579,-8.6291], visitors:1200, bounceRate:35.2 }
  ];

  const browserSvgMap = {
    Chrome:  'https://assets.tracklead.com/browser/chrome.svg',
    Firefox: 'https://assets.tracklead.com/browser/firefox.svg',
    Safari:  'https://assets.tracklead.com/browser/safari.svg',
    Edge:    'https://assets.tracklead.com/browser/edge.svg',
    Opera:   'https://assets.tracklead.com/browser/opera.svg',
    FoxAppy: 'https://assets.tracklead.com/browser/foxappy.svg',
    Other:   ''
  };

  initializeAll();
  setupEventListeners();

  function initializeAll() {
    initMap();
    loadVisitorOverviewData();
    loadVisitorDemographics();
  }

  function initMap() {
    if (map) { map.invalidateSize(); return; }
    const sw = L.latLng(-85,-180), ne = L.latLng(85,180), bounds = L.latLngBounds(sw,ne);
    map = L.map('map',{
      attributionControl:false,
      zoomControl:true,
      maxBounds:bounds,
      maxBoundsViscosity:1.0,
      worldCopyJump:false,
      bounceAtZoomLimits:true,
      scrollWheelZoom:false
    }).setView([20,0],2);
    map.setMinZoom(2);
    map.setMaxZoom(18);
    const theme = document.documentElement.getAttribute('data-theme')||'light';
    const tile = ['dark','pink','bluemoon','coffee-brew','amazon-canopy','silicon-noir'].includes(theme)
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(tile,{
      maxZoom:19,
      attribution:'&copy; OpenStreetMap contributors & Carto',
      noWrap:true
    }).addTo(map);
    heatLayer = L.heatLayer([], {
      radius:25, blur:15, maxZoom:17,
      gradient:{0.2:'blue',0.4:'lime',0.6:'yellow',0.8:'orange',1.0:'red'}
    }).addTo(map);
    map.whenReady(()=>map.invalidateSize());
    window.addEventListener('resize', ()=>setTimeout(()=>map.invalidateSize(),250));
  }

  function setupEventListeners() {
    dateRangePicker.onPeriodChange = period => { selectedPeriod = period; refreshAll(); };
    document.querySelectorAll('#granularityFilter button').forEach(btn =>
      btn.addEventListener('click', ()=> {
        document.querySelectorAll('#granularityFilter button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selectedGranularity = btn.dataset.granularity;
        loadVisitorOverviewData();
      })
    );
    document.querySelectorAll('#visitorMetricFilter button').forEach(btn =>
      btn.addEventListener('click', ()=> {
        document.querySelectorAll('#visitorMetricFilter button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        selectedVisitorMetric = btn.dataset.metric;
        if (currentVisitorData) renderVisitorsChart(currentVisitorData.current.trend);
      })
    );
    document.querySelectorAll('input[name="geoViewTypeRadio"]').forEach(radio =>
      radio.addEventListener('change', ()=> {
        selectedGeoType = radio.value;
        if (currentGeoData) {
          renderGeoDistributionMap();
          renderGeoDistributionList();
        }
      })
    );
  }

  function refreshAll() {
    loadVisitorOverviewData();
    loadVisitorDemographics();
  }

  function showLoadingState(cid, loading) {
    const c = document.getElementById(cid); if (!c) return;
    const l = c.querySelector('.chart-loader'); if (l) l.style.display = loading ? 'flex' : 'none';
    const e = c.querySelector('#map, #geoDistributionList, #browserMetricsList, #deviceMetricsList'); if (e) e.style.visibility = loading ? 'hidden' : 'visible';
    if (loading && e && e.id === 'map') {
      const emp = c.querySelector('.chart-empty-state'); if (emp) emp.style.display = 'none';
    }
  }

  function showEmptyState(cid, show, msg) {
    const c = document.getElementById(cid); if (!c) return;
    const emp = c.querySelector('.chart-empty-state'), e = c.querySelector('#map, #geoDistributionList, #browserMetricsList, #deviceMetricsList');
    if (emp) { emp.style.display = show ? 'flex' : 'none'; if (show && msg) emp.querySelector('p').textContent = msg; }
    if (e) e.style.display = show ? 'none' : ''; if (show) { const l = c.querySelector('.chart-loader'); if (l) l.style.display = 'none'; }
  }

  function updateMetricCard(id, cur, prev, fmt, inv = false) {
    const v = document.getElementById(id), ic = document.getElementById(id + 'TrendIcon'),
          tx = document.getElementById(id + 'TrendText'), tr = tx && tx.parentElement;
    if (v) v.textContent = fmt(cur);
    if (ic && tx && tr) {
      const ch = chartUtils.formatPercentageChange(cur, prev);
      let cls = ch.trend, ico = ch.icon;
      if (inv) {
        if (cls === 'up')      { cls = 'down'; ico = 'fa-arrow-down'; }
        else if (cls === 'down') { cls = 'up';   ico = 'fa-arrow-up';   }
      }
      tx.textContent = ch.text + ' vs período anterior';
      ic.className = 'fas ' + ico;
      tr.className = 'metric-trend small ' + cls;
    }
  }

  async function loadVisitorOverviewData() {
    const cid = 'visitorsChart'; chartUtils.showLoading(cid);
    ['TotalVisitors','UniqueVisitors','AvgDuration','AvgBounceRate'].forEach(id =>
      updateMetricCard('summary' + id, '--', 0, v => v)
    );
    try {
      const data = await analyticsService.getVisitorOverview(selectedPeriod, selectedGranularity);
      currentVisitorData = data;
      const cur = data.current.summary, prev = data.previous.summary;
      updateMetricCard('summaryTotalVisitors', cur.totalVisitors,       prev.totalVisitors,       v=>chartUtils.formatNumber(v||0));
      updateMetricCard('summaryUniqueVisitors',cur.totalUniqueVisitors,prev.totalUniqueVisitors,v=>chartUtils.formatNumber(v||0));
      updateMetricCard('summaryAvgDuration',  cur.avgSessionDuration, prev.avgSessionDuration, v=>chartUtils.formatTime(v||0));
      updateMetricCard('summaryAvgBounceRate',cur.avgBounceRate,        prev.avgBounceRate,        v=>chartUtils.formatPercentage(v||0,1), true);
      renderVisitorsChart(data.current.trend);
    } catch (e) {
      console.error('Erro overview:', e);
      showEmptyState('visitorsChart', true, 'Falha ao carregar dados dos visitantes');
      ['TotalVisitors','UniqueVisitors','AvgDuration','AvgBounceRate'].forEach(id =>
        updateMetricCard('summary' + id, 'Erro', 0, v => v)
      );
    } finally {
      chartUtils.hideLoading(cid);
    }
  }

  async function loadVisitorDemographics() {
    showLoadingState('geoMapContainer', true);
    showLoadingState('geoDistributionListContainer', true);
    const browserUl = document.getElementById('browserMetricsList');
    const deviceUl = document.getElementById('deviceMetricsList');

    if (browserUl) browserUl.innerHTML = '';
    if (deviceUl) deviceUl.innerHTML = '';

    try {
      const data = await analyticsService.getVisitorDemographics(selectedPeriod);
      currentGeoData = data;
      if (!currentGeoData.statesDemoData) {
        currentGeoData.statesDemoData = { br: brazilStates, us: usStates, pt: ptStates };
      }
      renderGeoDistributionMap();
      renderGeoDistributionList();
      renderBrowserMetricsList(data.browsers);
      renderDeviceMetricsList(data.devices);
    } catch (e) {
      console.error('Erro demographics:', e);
      showEmptyState('geoMapContainer', true, 'Falha ao carregar dados geográficos');
      showEmptyState('geoDistributionListContainer', true, 'Falha ao carregar dados geográficos');
      if (browserUl) {
        browserUl.innerHTML = '<li class="list-group-item text-center text-muted">Falha ao carregar dados dos navegadores</li>';
      }
      if (deviceUl) {
        deviceUl.innerHTML = '<li class="list-group-item text-center text-muted">Falha ao carregar dados dos dispositivos</li>';
      }
    } finally {
      showLoadingState('geoMapContainer', false);
      showLoadingState('geoDistributionListContainer', false);
    }
  }

  function renderBrowserMetricsList(browsers) {
    const ul = document.getElementById('browserMetricsList');
    if (!ul) return;
    ul.innerHTML = '';
    if (!browsers || browsers.length === 0) {
      ul.innerHTML = '<li class="list-group-item text-center text-muted">Sem dados de navegadores</li>';
      return;
    }
    browsers.forEach(b => {
      const visits = b.users || 0;
      const uniqueVisitors = Math.round(visits * 0.8);
      const avgSessionDuration = Math.round(60 + Math.random() * 180);
      const bounceRate = Math.round(30 + Math.random() * 30);
      
      const li = document.createElement('li');
      li.className = 'list-group-item';
      const browserIcon = browserSvgMap[b.browser]
        ? '<img src="' + browserSvgMap[b.browser] + '" alt="' + b.browser + '" style="width: 16px; height: 16px; margin-right: 8px;">'
        : '';
      li.innerHTML =
        '<div class="d-flex justify-content-between align-items-center">' +
          '<span class="fw-semibold">' + browserIcon + b.browser + '</span>' +
          '<div class="d-flex flex-wrap gap-2">' +
            '<div class="stats-badge"><i class="fas fa-chart-line"></i>' + chartUtils.formatNumber(visits) + ' visitas</div>' +
            '<div class="stats-badge"><i class="fas fa-user-check"></i>' + chartUtils.formatNumber(uniqueVisitors) + ' visitantes</div>' +
            '<div class="stats-badge"><i class="fas fa-clock"></i>' + chartUtils.formatTime(avgSessionDuration) + '</div>' +
            '<div class="stats-badge"><i class="fas fa-undo-alt"></i>' + chartUtils.formatPercentage(bounceRate, 1) + ' rejeição</div>' +
          '</div>' +
        '</div>';
      ul.appendChild(li);
    });
  }

  function renderDeviceMetricsList(devices) {
    const ul = document.getElementById('deviceMetricsList');
    if (!ul) return;
    ul.innerHTML = '';
    if (!devices || devices.length === 0) {
      ul.innerHTML = '<li class="list-group-item text-center text-muted">Sem dados de dispositivos</li>';
      return;
    }
    devices.forEach(d => {
      const totalVisits = 10000;
      const visits = Math.round(totalVisits * (d.percentage / 100));
      const uniqueVisitors = Math.round(visits * 0.85);
      const avgSessionDuration = Math.round(60 + Math.random() * 180);
      const bounceRate = Math.round(25 + Math.random() * 35);
      
      const li = document.createElement('li');
      li.className = 'list-group-item';
      let deviceIcon = '';
      if (d.type && d.type.toLowerCase() === 'desktop') deviceIcon = '<i class="fas fa-desktop me-2"></i>';
      else if (d.type && d.type.toLowerCase() === 'mobile') deviceIcon = '<i class="fas fa-mobile-alt me-2"></i>';
      else if (d.type && d.type.toLowerCase() === 'tablet') deviceIcon = '<i class="fas fa-tablet-alt me-2"></i>';

      li.innerHTML =
        '<div class="d-flex justify-content-between align-items-center">' +
          '<span class="fw-semibold">' + deviceIcon + d.type + '</span>' +
          '<div class="d-flex flex-wrap gap-2">' +
            '<div class="stats-badge"><i class="fas fa-chart-line"></i>' + chartUtils.formatNumber(visits) + ' visitas</div>' +
            '<div class="stats-badge"><i class="fas fa-user-check"></i>' + chartUtils.formatNumber(uniqueVisitors) + ' visitantes</div>' +
            '<div class="stats-badge"><i class="fas fa-clock"></i>' + chartUtils.formatTime(avgSessionDuration) + '</div>' +
            '<div class="stats-badge"><i class="fas fa-undo-alt"></i>' + chartUtils.formatPercentage(bounceRate, 1) + ' rejeição</div>' +
          '</div>' +
        '</div>';
      ul.appendChild(li);
    });
  }

  function renderVisitorsChart(trendData) {
    const cid = 'visitorsChart', ctr = document.getElementById(cid);
    if (!ctr) return;
    try {
      if (!trendData || !trendData.dates || !trendData.dates.length) {
        showEmptyState(cid, true, 'Sem dados para o período selecionado');
        ApexCharts.getChartByID(cid)?.destroy();
        return;
      }
      showEmptyState(cid, false);
      let series = [], yTitle = 'Visitantes', yFmt = v => chartUtils.formatNumber(v),
        tipFmt = v => chartUtils.formatNumber(v) + ' visitantes',
        colors = [chartUtils.getBaseOptions().colors[0]];
      switch (selectedVisitorMetric) {
        case 'totalVisits':
          series = [{ name: 'Total de Visitas', data: trendData.visitors || [] }];
          break;
        case 'uniqueVisitors':
          series = [{ name: 'Visitantes Únicos', data: trendData.uniqueVisitors || [] }];
          colors = [chartUtils.getBaseOptions().colors[1]];
          break;
        case 'avgDuration':
          const sess = trendData.visitors.map((v, i) =>
            Math.max(60, Math.min(300, v / (trendData.uniqueVisitors[i] || 1) * 120 + Math.random() * 50 - 25))
          );
          series = [{ name: 'Duração Média', data: sess }];
          yTitle = 'Duração (segundos)';
          yFmt = v => chartUtils.formatTime(v);
          tipFmt = v => chartUtils.formatTime(v);
          colors = [chartUtils.getBaseOptions().colors[2]];
          break;
        case 'bounceRate':
          const bounce = trendData.uniqueVisitors.map((u, i) =>
            Math.max(15, Math.min(75, 100 - (trendData.visitors[i] || 1) / u * 25 - Math.random() * 10))
          );
          series = [{ name: 'Taxa de Rejeição', data: bounce }];
          yTitle = 'Taxa de Rejeição (%)';
          yFmt = v => chartUtils.formatPercentage(v, 1);
          tipFmt = v => chartUtils.formatPercentage(v, 1);
          colors = [chartUtils.getBaseOptions().colors[3]];
          break;
        default:
          series = [
            { name: 'Total de Visitas', data: trendData.visitors || [] },
            { name: 'Visitantes Únicos', data: trendData.uniqueVisitors || [] }
          ];
          colors = [
            chartUtils.getBaseOptions().colors[0],
            chartUtils.getBaseOptions().colors[1]
          ];
      }
      const opts = chartUtils.mergeOptions(chartUtils.getBaseOptions(), {
        chart: {
          id: cid,
          type: 'area',
          height: 350,
          toolbar: { show: false },
          zoom: {
            enabled: false
          }
        },
        xaxis: {
  categories: trendData.dates,
  title: { text: null },
  labels: {
    formatter: function(value, timestamp, opts) {
      if (selectedGranularity === 'day') {
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return value;
          }
          
          // Obtém o idioma atual ou usa pt-BR como padrão
          const lang = (document.documentElement.lang || 'pt-BR').split('-')[0];
          
          // Se o idioma for inglês, usa formato MM/DD, caso contrário usa DD/MM
          if (lang === 'en') {
            return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
          } else {
            return date.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' });
          }
        } catch (e) {
          console.warn("Falha ao formatar data no gráfico:", value, e);
          return value;
        }
      }
      return value;
    },
    hideOverlappingLabels: true,
    showDuplicates: false,
    trim: true,
    style: {
      fontSize: '10px',
    },
  },
  tickPlacement: 'on',
},
        yaxis: { title: { text: yTitle }, labels: { formatter: yFmt } },
        series: series,
        colors: colors,
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 0.5, opacityFrom: 0.5, opacityTo: 0.1, stops: [0, 95, 100] } },
        markers: { size: 0, hover: { size: 4 } },
        tooltip: { y: { formatter: tipFmt } }
      });
      const ex = ApexCharts.getChartByID(cid);
      ex ? ex.updateOptions(opts) : new ApexCharts(ctr, opts).render();
    } catch (e) {
      console.error("Erro visitors chart:", e);
      showEmptyState(cid, true, 'Erro ao renderizar gráfico');
      try { ApexCharts.getChartByID(cid)?.destroy(); } catch {}
    }
  }

  function getDataForGeoVisualization() {
    if (!currentGeoData) return [];
    if (selectedGeoType === 'country') return currentGeoData.geography || [];
    const code = currentGeoData.activeCountryForStates || 'br';
    return currentGeoData.statesDemoData[code] || [];
  }

  function renderGeoDistributionMap() {
    const gd = getDataForGeoVisualization(), vt = selectedGeoType, cid = 'geoMapContainer';
    showLoadingState(cid, true);
    if (!gd || !gd.length) {
      showEmptyState(cid, true, 'Sem dados para ' + (vt==='country'?'países':'estados'));
      heatLayer.setLatLngs([]);
      map.setView([20,0],2);
      showLoadingState(cid, false);
      return;
    }
    showEmptyState(cid, false);
    if (!map) initMap();
    const hd = gd.map(loc => {
      const c = vt==='country'
        ? loc.coords || countryCoordinates[loc.code.toLowerCase()]
        : loc.coords;
      if (!c || c.length!==2) return null;
      return [c[0], c[1], Number(loc.visitors)||0];
    }).filter(d => d);
    heatLayer.setLatLngs(hd);
    const ll = hd.map(d => [d[0], d[1]]);
    
    if (ll.length) {
      const container = document.getElementById('geoMapContainer');
      const containerWidth = container ? container.clientWidth : 800;
      const padding = Math.max(10, Math.min(45, containerWidth * 0.02));
      const maxZoom = containerWidth > 1200 ? 
        (vt === 'state' ? 9 : 7) : 
        (vt === 'state' ? 7 : 5);
      
      map.fitBounds(ll, { padding: [padding, padding], maxZoom: maxZoom });
    } else {
      map.setView([20,0],2);
    }
    
    map.invalidateSize();
    showLoadingState(cid, false);
  }

  function renderGeoDistributionList() {
    const gd = getDataForGeoVisualization(), vt = selectedGeoType;
    const ul = document.getElementById('geoDistributionList'), cid = 'geoDistributionListContainer';
    showLoadingState(cid, true);
    if (!ul) { console.error('Lista inválida'); showLoadingState(cid, false); return; }
    ul.innerHTML = '';
    if (!gd || !gd.length) {
      showEmptyState(cid, true, 'Sem dados para ' + (vt==='country'?'países':'estados'));
      return;
    }
    showEmptyState(cid, false);
    
    const sorted = gd.slice().sort((a,b) => b.visitors - a.visitors);
    
    const isMobile = window.innerWidth < 768;
    const displayCount = isMobile ? 3 : sorted.length;
    const displayItems = sorted.slice(0, displayCount);
    
    displayItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      const name = vt==='country' ? (item.country||item.code.toUpperCase()) : item.name;
      const visits = item.visitors||0;
      const uniq = Math.round(visits*(0.7+Math.random()*0.2))||0;
      const dur = Math.round(60+Math.random()*240)||0;
      const brt = item.bounceRate||Math.round(25+Math.random()*40);
      const iconHtml = vt==='country' && item.code
        ? '<span class="fi fi-'+item.code.toLowerCase()+' me-2 flex-shrink-0"></span>'
        : '<i class="fas fa-map-marker-alt me-2 text-primary flex-shrink-0"></i>';
      
      li.innerHTML =
        '<div class="d-flex justify-content-between align-items-start">' +
          '<div class="d-flex align-items-center">' + 
            iconHtml +
            '<span class="fw-medium" title="'+name+'">'+name+'</span>' +
          '</div>' +
          '<div class="d-flex flex-wrap gap-2">' +
            '<div class="stats-badge"><i class="fas fa-chart-line"></i>'+chartUtils.formatNumber(visits)+' visitas</div>' +
            '<div class="stats-badge"><i class="fas fa-user-check"></i>'+chartUtils.formatNumber(uniq)+' visitantes</div>' +
            '<div class="stats-badge"><i class="fas fa-clock"></i>'+chartUtils.formatTime(dur)+'</div>' +
            '<div class="stats-badge"><i class="fas fa-undo-alt"></i>'+chartUtils.formatPercentage(brt,1)+' rejeição</div>' +
          '</div>' +
        '</div>';

      ul.appendChild(li);
    });
    
    if (isMobile && sorted.length > displayCount) {
      const viewMoreLi = document.createElement('li');
      viewMoreLi.className = 'list-group-item text-center';
      viewMoreLi.innerHTML = '<button class="btn btn-sm btn-outline-primary show-more-btn">Ver mais ' + (sorted.length - displayCount) + ' ' + (vt === 'country' ? 'países' : 'estados') + '</button>';
      ul.appendChild(viewMoreLi);
      
      const viewMoreBtn = viewMoreLi.querySelector('.show-more-btn');
      viewMoreBtn.addEventListener('click', function() {
        viewMoreLi.remove();
        
        sorted.slice(displayCount).forEach(item => {
          const li = document.createElement('li');
          li.className = 'list-group-item';
          const name = vt==='country' ? (item.country||item.code.toUpperCase()) : item.name;
          const visits = item.visitors||0;
          const uniq = Math.round(visits*(0.7+Math.random()*0.2))||0;
          const dur = Math.round(60+Math.random()*240)||0;
          const brt = item.bounceRate||Math.round(25+Math.random()*40);
          const iconHtml = vt==='country' && item.code
            ? '<span class="fi fi-'+item.code.toLowerCase()+' me-2 flex-shrink-0"></span>'
            : '<i class="fas fa-map-marker-alt me-2 text-primary flex-shrink-0"></i>';
          
          li.innerHTML =
            '<div class="d-flex justify-content-between align-items-start">' +
              '<div class="d-flex align-items-center">' + 
                iconHtml +
                '<span class="fw-medium" title="'+name+'">'+name+'</span>' +
              '</div>' +
              '<div class="d-flex flex-wrap gap-2">' +
                '<div class="stats-badge"><i class="fas fa-chart-line"></i>'+chartUtils.formatNumber(visits)+' visitas</div>' +
                '<div class="stats-badge"><i class="fas fa-user-check"></i>'+chartUtils.formatNumber(uniq)+' visitantes</div>' +
                '<div class="stats-badge"><i class="fas fa-clock"></i>'+chartUtils.formatTime(dur)+'</div>' +
                '<div class="stats-badge"><i class="fas fa-undo-alt"></i>'+chartUtils.formatPercentage(brt,1)+' rejeição</div>' +
              '</div>' +
            '</div>';
          
          ul.appendChild(li);
        });
      });
    }
    
    showLoadingState(cid, false);
  }

});