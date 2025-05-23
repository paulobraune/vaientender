  document.addEventListener('DOMContentLoaded', function() {
    let visitorCount = 0;
    let refreshCountdown = 60;
    let charts = {};
    let visitorHistory = [];
    let realtimeData = { timestamps: [], visitors: [] };
    const currencyCode = window.activeBusinessData && window.activeBusinessData.currency
      ? window.activeBusinessData.currency : 'BRL';
    const currencySymbol = currencyCode === 'BRL' ? 'R$'
                          : currencyCode === 'USD' ? '$' : currencyCode;
    
    // Country flags and country codes for visitors
    const countryCodes = {
      'Brazil': 'br',
      'United States': 'us',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'UK': 'gb',
      'United Kingdom': 'gb',
      'Canada': 'ca',
      'Italy': 'it',
      'Japan': 'jp',
      'Australia': 'au',
      'Mexico': 'mx',
      'Argentina': 'ar',
      'Portugal': 'pt',
      'China': 'cn',
      'India': 'in',
      'Russia': 'ru',
      'South Korea': 'kr'
    };
    
    // Referrer domains for visitors
    const referrers = [
      { domain: 'google.com', name: 'Google', icon: 'fa-google' },
      { domain: 'facebook.com', name: 'Facebook', icon: 'fa-facebook' },
      { domain: 'instagram.com', name: 'Instagram', icon: 'fa-instagram' },
      { domain: 'twitter.com', name: 'Twitter', icon: 'fa-twitter' },
      { domain: 'bing.com', name: 'Bing', icon: 'fa-microsoft' },
      { domain: 'linkedin.com', name: 'LinkedIn', icon: 'fa-linkedin' },
      { domain: 'pinterest.com', name: 'Pinterest', icon: 'fa-pinterest' },
      { domain: 'youtube.com', name: 'YouTube', icon: 'fa-youtube' },
      { domain: 'amazon.com', name: 'Amazon', icon: 'fa-amazon' },
      { domain: null, name: 'Direct', icon: 'fa-arrow-right' }
    ];
    
    // UTM Campaign names and sources
    const campaigns = [
      { name: 'summer_sale_2025', source: 'google', medium: 'cpc', content: 'banner_1' },
      { name: 'new_product_launch', source: 'facebook', medium: 'social', content: 'carousel' },
      { name: 'newsletter_may', source: 'email', medium: 'email', content: 'weekly' },
      { name: 'retargeting_cart', source: 'instagram', medium: 'social', content: 'stories' },
      { name: 'holiday_special', source: 'pinterest', medium: 'social', content: 'pins' },
      { name: 'black_friday', source: 'google', medium: 'cpc', content: 'search' },
      { name: 'winter_collection', source: 'facebook', medium: 'social', content: 'video' }
    ];

    initCharts();
    fetchRealtimeData();
    updateTopProducts();
    updateTopCampaigns();
    updateDailyMetrics();

    // Auto-refresh every minute
    const refreshInterval = setInterval(updateCountdown, 1000);
    const dataInterval = setInterval(fetchRealtimeData, 60000);

    function initCharts() {
      const baseOptions = chartUtils.getBaseOptions();
      const visitorsOptions = chartUtils.mergeOptions(baseOptions, {
        chart: { id: 'visitorsRealtimeChart', type: 'area', height: 250,
          animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } },
          toolbar: { show: false }, zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity:1, opacityFrom:0.7, opacityTo:0.3, stops:[0,100] } },
        markers: { size: 0 },
        tooltip: { x: { format: 'HH:mm' } },
        grid: { padding: { left:15, right:15 } },
        yaxis: { min:0, labels: { formatter: val => Math.round(val) }, tickAmount:4 },
        series: [{ name:'Active Visitors', data: [] }],
        colors: [baseOptions.colors[0]]
      });
      
      charts.visitorsChart = new ApexCharts(document.getElementById('visitorsRealtimeChart'), visitorsOptions);
      charts.visitorsChart.render();
    }

    function updateCountdown() {
      refreshCountdown--;
      if (refreshCountdown <= 0) {
        refreshCountdown = 60;
      }
      const badge = document.getElementById('refresh-badge');
      const countdown = document.getElementById('refresh-countdown');
      if (countdown) countdown.textContent = refreshCountdown + 's';
      if (badge) {
        if (refreshCountdown <= 5) badge.classList.add('pulse');
        else badge.classList.remove('pulse');
      }
    }

    function createConfetti() {
      const container = document.getElementById('confetti-container');
      if (!container) return;
      
      container.innerHTML = '';
      container.style.display = 'block';
      
      const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
      
      for (let i = 0; i < 150; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';
        piece.style.width = Math.random() * 10 + 5 + 'px';
        piece.style.height = Math.random() * 20 + 10 + 'px';
        piece.style.opacity = '1';
        piece.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        piece.style.animation = 'confetti ' + (Math.random() * 2 + 1) + 's ease-out forwards';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        
        container.appendChild(piece);
      }
      
      setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
      }, 3500);
    }

    async function fetchRealtimeData() {
      const badge = document.getElementById('refresh-badge');
      if (badge) badge.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span></span>';
      try {
        const data = await analyticsService.getRealTimeVisitors();
        updateVisitorCount(data.count);
        updateTimeSeriesData(data.count);
        generateRecentVisitors(data.visitors || []);
        updateTopProducts();
        updateTopCampaigns();
        updateDailyMetrics();
        
        if (data.hasNewPurchases) {
          createConfetti();
        }
      } catch (err) {
        console.error('Error fetching real-time data:', err);
      } finally {
        if (badge) badge.innerHTML = '<i class="fas fa-sync-alt"></i><span id="refresh-countdown">60s</span>';
      }
    }

    function updateVisitorCount(newCount) {
      const el = document.getElementById('visitor-count');
      if (!el) return;
      el.classList.add('count-animation');
      el.textContent = newCount;
      setTimeout(() => el.classList.remove('count-animation'), 500);
      visitorCount = newCount;
    }

    function updateTimeSeriesData(newCount) {
      const now = new Date();
      const label = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
      // Keep only the last 15 minutes of data
      if (realtimeData.timestamps.length >= 15) {
        realtimeData.timestamps.shift();
        realtimeData.visitors.shift();
      }
      realtimeData.timestamps.push(label);
      realtimeData.visitors.push(newCount);
      if (charts.visitorsChart) {
        charts.visitorsChart.updateSeries([{ name:'Active Visitors', data: realtimeData.visitors }]);
        charts.visitorsChart.updateOptions({ xaxis:{ categories: realtimeData.timestamps } });
      }
    }

    function generateRecentVisitors(visitors = []) {
      const container = document.getElementById('visitors-list');
      if (!container) return;
      
      if (visitors && visitors.length > 0) {
        visitorHistory = [...visitors, ...visitorHistory].slice(0, 15);
      } else {
        const newCount = Math.floor(Math.random()*3)+1;
        const countries = ['Brazil','United States','Germany','France','Spain','UK','Canada','Italy','Japan','Australia'];
        const cities = ['São Paulo','New York','Berlin','Paris','Madrid','London','Toronto','Rome','Tokyo','Sydney'];
        const browsers = ['Chrome','Firefox','Safari','Edge'];
        const devices = ['Desktop','Mobile','Tablet'];
        const pages = [
          { url:'/', title:'Home Page' },
          { url:'/products', title:'Products Page' },
          { url:'/category/electronics', title:'Electronics Category' },
          { url:'/product/smartphone', title:'Smartphone Product' },
          { url:'/cart', title:'Shopping Cart' },
          { url:'/checkout', title:'Checkout' },
          { url:'/blog', title:'Blog' },
          { url:'/about', title:'About Us' },
          { url:'/contact', title:'Contact Us' }
        ];
        
        for (let i=0; i<newCount; i++){
          const idx = Math.floor(Math.random()*countries.length);
          const visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
          const isReturning = Math.random() > 0.4;
          const refIdx = Math.floor(Math.random() * referrers.length);
          
          const hasCampaign = Math.random() > 0.7;
          let campaign = null;
          if (hasCampaign) {
            campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
          }
          
          const hasCart = Math.random() > 0.65;
          let cart = null;
          if (hasCart) {
            const itemCount = Math.floor(Math.random() * 5) + 1;
            const cartTotal = (Math.random() * 500 + 50).toFixed(2);
            cart = {
              itemCount,
              total: cartTotal
            };
          }
          
          const visitor = {
            id: Date.now()+i,
            externalId: visitorId,
            country: countries[idx],
            countryCode: countryCodes[countries[idx]] || 'un',
            city: cities[idx],
            browser: browsers[Math.floor(Math.random()*browsers.length)],
            device: devices[Math.floor(Math.random()*devices.length)],
            visitTime: new Date(),
            isReturning: isReturning,
            referrer: referrers[refIdx],
            campaign: campaign,
            cart: cart,
            actions: []
          };
          
          const actionCount = Math.floor(Math.random()*3)+1;
          for (let j=0; j<actionCount; j++){
            const page = pages[Math.floor(Math.random()*pages.length)];
            const time = new Date(visitor.visitTime);
            time.setSeconds(time.getSeconds() + j * Math.floor(Math.random()*60));
            visitor.actions.push({ page, time, isNew: j===actionCount-1 });
          }
          
          visitorHistory.unshift(visitor);
        }
      }
      
      if (visitorHistory.length > 15) visitorHistory = visitorHistory.slice(0,15);
      
      container.innerHTML = '';
      visitorHistory.forEach(v => {
        const card = document.createElement('div');
        card.className = 'visitor-card';
        
        const flagHtml = v.countryCode
          ? '<span class="fi fi-' + v.countryCode + '"></span>'
          : '<span class="fi fi-un"></span>';
          
        const visitorTypeHtml = v.isReturning
          ? '<span class="visitor-type returning">Returning</span>'
          : '<span class="visitor-type new">New</span>';
        
        let referrerHtml = '';
        if (v.referrer) {
          referrerHtml =
            '<div class="visitor-referrer">' +
              '<i class="' + (v.referrer.domain ? 'fab' : 'fas') + ' ' + v.referrer.icon + '"></i> ' +
              'From: ' + (v.referrer.domain || 'Direct visit') +
            '</div>';
        }
        
        let campaignHtml = '';
        if (v.campaign) {
          campaignHtml =
            '<div class="visitor-campaign">' +
              '<i class="fas fa-bullhorn"></i> ' +
              'Campaign: ' + v.campaign.name +
              ' <small>(' + v.campaign.source + ')</small>' +
            '</div>';
        }
        
        let cartHtml = '';
        if (v.cart && !v.purchase) {
          cartHtml =
            '<div class="visitor-cart">' +
              '<div class="visitor-cart-header">' +
                '<div><i class="fas fa-shopping-cart"></i>' +
                '<span>' + v.cart.itemCount + (v.cart.itemCount === 1 ? ' item' : ' items') + ' in cart</span></div>' +
                '<span class="visitor-cart-total">Total Value: ' + currencySymbol + ' ' + v.cart.total + '</span>' +
              '</div>' +
              '<div class="visitor-cart-items">' +
                'Last updated ' + formatTime(new Date(Math.max(0, v.visitTime.getTime() - Math.random() * 300000))) +
              '</div>' +
            '</div>';
        }
        
        let purchaseHtml = '';
        if (v.purchase) {
          purchaseHtml =
            '<div class="visitor-purchase">' +
              '<div class="visitor-purchase-header">' +
                '<div><i class="fas fa-check-circle"></i>' +
                '<span>Purchase completed!</span></div>' +
                '<div class="visitor-purchase-id">Order ID: ' + v.purchase.orderId + '</div>' +
                '<span class="visitor-purchase-total">Total Value: ' + currencySymbol + ' ' + v.purchase.totalValue + '</span>' +
              '</div>' +
              '<div class="visitor-purchase-items">' +
                'Purchased ' + formatTime(v.purchase.purchaseTime) +
              '</div>' +
            '</div>';
        }
        
        let html = '<div class="visitor-info">' +
          '<div class="visitor-icon"><i class="fa-solid fa-user"></i></div>' +
          '<div class="visitor-details">' +
            '<h5 class="mb-0">' + v.externalId + visitorTypeHtml + '</h5>' +
          '<div class="visitor-location">' +
            flagHtml + ' ' + v.city + ', ' + v.country +
          '</div>' +
          '<div class="visitor-device">' +
            '<i class="fas ' + (v.device==='Mobile' ? 'fa-mobile-alt' : v.device==='Tablet'? 'fa-tablet-alt' : 'fa-desktop') + '"></i> ' +
            'Device: ' + v.device +
          '</div>' +
          '<div class="visitor-browser">' +
            '<i class="fas fa-globe"></i> ' +
            'Browser: ' + v.browser +
          '</div>' +
          referrerHtml +
          campaignHtml +
          '</div></div>';
        
        if (v.purchase) {
          html += purchaseHtml;
        } else if (v.cart) {
          html += cartHtml;
        }
        
        if (v.actions.length) {
          html += '<div class="action-list">';
          v.actions.forEach(act => {
            html += '<div class="action-item ' + (act.isNew ? 'action-new' : '') + '">' +
              '<i class="fas fa-file-alt"></i>' +
              '<span>' + act.page.title + '</span>' +
              '<span class="action-time">' + formatTime(act.time) + '</span>' +
            '</div>';
          });
          html += '</div>';
        }
        
        card.innerHTML = html;
        container.appendChild(card);
      });
    }

    function updateTopProducts() {
      const container = document.getElementById('top-products-list');
      if (!container) return;
      
      const products = [
        { id: 1, name: 'Smartphone X Pro', category: 'Electronics', quantity: Math.floor(Math.random()*10)+15, revenue: (Math.random()*2000+3000).toFixed(2), convRate: (Math.random()*8+2).toFixed(1) },
        { id: 2, name: 'Wireless Earbuds', category: 'Audio', quantity: Math.floor(Math.random()*8)+10, revenue: (Math.random()*800+1200).toFixed(2), convRate: (Math.random()*7+2).toFixed(1) },
        { id: 3, name: 'Ultra HD Smart TV', category: 'Electronics', quantity: Math.floor(Math.random()*5)+5, revenue: (Math.random()*5000+7000).toFixed(2), convRate: (Math.random()*5+2).toFixed(1) },
        { id: 4, name: 'Gaming Laptop', category: 'Computers', quantity: Math.floor(Math.random()*4)+3, revenue: (Math.random()*4000+6000).toFixed(2), convRate: (Math.random()*6+2).toFixed(1) },
        { id: 5, name: 'Bluetooth Speaker', category: 'Audio', quantity: Math.floor(Math.random()*10)+5, revenue: (Math.random()*500+700).toFixed(2), convRate: (Math.random()*9+2).toFixed(1) },
        { id: 6, name: 'Fitness Tracker', category: 'Wearables', quantity: Math.floor(Math.random()*12)+8, revenue: (Math.random()*600+800).toFixed(2), convRate: (Math.random()*7.5+2).toFixed(1) },
        { id: 7, name: 'Tablet Pro', category: 'Computers', quantity: Math.floor(Math.random()*7)+4, revenue: (Math.random()*2500+3500).toFixed(2), convRate: (Math.random()*5.5+2).toFixed(1) }
      ];
      
      const totalSales = products.reduce((sum, product) => sum + parseInt(product.quantity), 0);
      
      products.forEach(product => {
        product.prevQuantity = Math.floor(Math.random() * (product.quantity * 0.9)) + Math.floor(product.quantity * 0.7);
        product.prevRevenue = (Math.random() * (parseFloat(product.revenue) * 0.9) + parseFloat(product.revenue) * 0.7).toFixed(2);
        product.prevConvRate = (Math.random() * (parseFloat(product.convRate) * 0.9) + parseFloat(product.convRate) * 0.7).toFixed(1);
        
        product.quantityChange = parseFloat(((product.quantity - product.prevQuantity) / (product.prevQuantity === 0 ? 1 : product.prevQuantity) * 100).toFixed(1));
        product.revenueChange = parseFloat(((parseFloat(product.revenue) - parseFloat(product.prevRevenue)) / (parseFloat(product.prevRevenue) === 0 ? 1 : parseFloat(product.prevRevenue)) * 100).toFixed(1));
        product.convRateChange = parseFloat(((parseFloat(product.convRate) - parseFloat(product.prevConvRate)) / (parseFloat(product.prevConvRate) === 0 ? 1 : parseFloat(product.prevConvRate)) * 100).toFixed(1));
        
        product.salesPercentage = parseFloat(((product.quantity / (totalSales === 0 ? 1 : totalSales)) * 100).toFixed(1));
        product.prevSalesPercentage = parseFloat(((product.prevQuantity / ((totalSales * 0.9) === 0 ? 1 : (totalSales * 0.9))) * 100).toFixed(1)); // Simplified prevTotalSales
        product.salesPercentageChange = parseFloat(((product.salesPercentage - product.prevSalesPercentage) / (product.prevSalesPercentage === 0 ? 1 : product.prevSalesPercentage) * 100).toFixed(1));
      });
      
      const topProducts = products.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      container.innerHTML = '';
      
      topProducts.forEach((product, index) => {
        const qtyTrendClass = product.quantityChange > 0 ? 'up' : product.quantityChange < 0 ? 'down' : 'neutral';
        const revTrendClass = product.revenueChange > 0 ? 'up' : product.revenueChange < 0 ? 'down' : 'neutral';
        const convTrendClass = product.convRateChange > 0 ? 'up' : product.convRateChange < 0 ? 'down' : 'neutral';
        const salesPercentTrendClass = product.salesPercentageChange > 0 ? 'up' : product.salesPercentageChange < 0 ? 'down' : 'neutral';
        
        const revenueFormatted = currencySymbol + ' ' + parseFloat(product.revenue).toLocaleString();
        
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
            '<div class="product-rank">' +
              '<div class="product-number-small">' + (index+1) + '</div>' +
              '<span class="product-name-text">' + product.name + '</span>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + product.quantity + '</span>' +
            '<div class="product-trend-cell ' + qtyTrendClass + '">' +
              (product.quantityChange > 0 ? '+' : '') + product.quantityChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + revenueFormatted + '</span>' +
            '<div class="product-trend-cell ' + revTrendClass + '">' +
              (product.revenueChange > 0 ? '+' : '') + product.revenueChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + product.convRate + '%</span>' +
            '<div class="product-trend-cell ' + convTrendClass + '">' +
              (product.convRateChange > 0 ? '+' : '') + product.convRateChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + product.salesPercentage + '%</span>' +
            '<div class="product-trend-cell ' + salesPercentTrendClass + '">' +
              (product.salesPercentageChange > 0 ? '+' : '') + product.salesPercentageChange + '%' +
            '</div>' +
          '</td>';
        
        container.appendChild(tr);
      });
    }
    
    function updateTopCampaigns() {
      const container = document.getElementById('top-campaigns-list');
      if (!container) return;
      
      const campaignData = [
        { id: 1, name: 'Summer Sale 2025', source: 'Google Ads', quantity: Math.floor(Math.random()*8)+12, revenue: (Math.random()*3000+2000).toFixed(2), convRate: (Math.random()*7+3).toFixed(1) },
        { id: 2, name: 'New Product Launch', source: 'Facebook', quantity: Math.floor(Math.random()*6)+10, revenue: (Math.random()*2500+1500).toFixed(2), convRate: (Math.random()*6+2.5).toFixed(1) },
        { id: 3, name: 'Holiday Special', source: 'Instagram', quantity: Math.floor(Math.random()*7)+8, revenue: (Math.random()*2000+1200).toFixed(2), convRate: (Math.random()*5+2).toFixed(1) },
        { id: 4, name: 'Retargeting Campaign', source: 'Google Ads', quantity: Math.floor(Math.random()*5)+6, revenue: (Math.random()*1800+900).toFixed(2), convRate: (Math.random()*5.5+4).toFixed(1) },
        { id: 5, name: 'Email Newsletter', source: 'Email', quantity: Math.floor(Math.random()*7)+4, revenue: (Math.random()*1500+800).toFixed(2), convRate: (Math.random()*4+3).toFixed(1) },
        { id: 6, name: 'Black Friday Prep', source: 'Facebook', quantity: Math.floor(Math.random()*6)+3, revenue: (Math.random()*1000+600).toFixed(2), convRate: (Math.random()*4.5+2.5).toFixed(1) },
        { id: 7, name: 'Loyalty Program', source: 'Email', quantity: Math.floor(Math.random()*4)+2, revenue: (Math.random()*800+500).toFixed(2), convRate: (Math.random()*3+2).toFixed(1) }
      ];
      
      const totalSales = campaignData.reduce((sum, campaign) => sum + parseInt(campaign.quantity), 0);
      
      campaignData.forEach(campaign => {
        campaign.prevQuantity = Math.floor(Math.random() * (campaign.quantity * 0.9)) + Math.floor(campaign.quantity * 0.7);
        campaign.prevRevenue = (Math.random() * (parseFloat(campaign.revenue) * 0.9) + parseFloat(campaign.revenue) * 0.7).toFixed(2);
        campaign.prevConvRate = (Math.random() * (parseFloat(campaign.convRate) * 0.9) + parseFloat(campaign.convRate) * 0.7).toFixed(1);
        
        campaign.quantityChange = parseFloat(((campaign.quantity - campaign.prevQuantity) / (campaign.prevQuantity === 0 ? 1: campaign.prevQuantity) * 100).toFixed(1));
        campaign.revenueChange = parseFloat(((parseFloat(campaign.revenue) - parseFloat(campaign.prevRevenue)) / (parseFloat(campaign.prevRevenue) === 0 ? 1 : parseFloat(campaign.prevRevenue)) * 100).toFixed(1));
        campaign.convRateChange = parseFloat(((parseFloat(campaign.convRate) - parseFloat(campaign.prevConvRate)) / (parseFloat(campaign.prevConvRate) === 0 ? 1 : parseFloat(campaign.prevConvRate)) * 100).toFixed(1));
        
        campaign.salesPercentage = parseFloat(((campaign.quantity / (totalSales === 0 ? 1 : totalSales)) * 100).toFixed(1));
        campaign.prevSalesPercentage = parseFloat(((campaign.prevQuantity / ((totalSales * 0.9) === 0 ? 1 : (totalSales * 0.9))) * 100).toFixed(1)); // Simplified prevTotalSales
        campaign.salesPercentageChange = parseFloat(((campaign.salesPercentage - campaign.prevSalesPercentage) / (campaign.prevSalesPercentage === 0 ? 1 : campaign.prevSalesPercentage) * 100).toFixed(1));
      });
      
      const topCampaigns = campaignData.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      container.innerHTML = '';
      
      topCampaigns.forEach((campaign, index) => {
        const qtyTrendClass = campaign.quantityChange > 0 ? 'up' : campaign.quantityChange < 0 ? 'down' : 'neutral';
        const revTrendClass = campaign.revenueChange > 0 ? 'up' : campaign.revenueChange < 0 ? 'down' : 'neutral';
        const convTrendClass = campaign.convRateChange > 0 ? 'up' : campaign.convRateChange < 0 ? 'down' : 'neutral';
        const salesPercentTrendClass = campaign.salesPercentageChange > 0 ? 'up' : campaign.salesPercentageChange < 0 ? 'down' : 'neutral';
        
        const revenueFormatted = currencySymbol + ' ' + parseFloat(campaign.revenue).toLocaleString();
        
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
            '<div class="product-rank">' +
              '<div class="product-number-small">' + (index+1) + '</div>' +
              '<span class="product-name-text">' + campaign.name + '</span>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + campaign.quantity + '</span>' +
            '<div class="product-trend-cell ' + qtyTrendClass + '">' +
              (campaign.quantityChange > 0 ? '+' : '') + campaign.quantityChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + revenueFormatted + '</span>' +
            '<div class="product-trend-cell ' + revTrendClass + '">' +
              (campaign.revenueChange > 0 ? '+' : '') + campaign.revenueChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + campaign.convRate + '%</span>' +
            '<div class="product-trend-cell ' + convTrendClass + '">' +
              (campaign.convRateChange > 0 ? '+' : '') + campaign.convRateChange + '%' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span>' + campaign.salesPercentage + '%</span>' +
            '<div class="product-trend-cell ' + salesPercentTrendClass + '">' +
              (campaign.salesPercentageChange > 0 ? '+' : '') + campaign.salesPercentageChange + '%' +
            '</div>' +
          '</td>';
        
        container.appendChild(tr);
      });
    }

    function updateDailyMetrics() {
      const metrics = {
        avgTime: {
          value: Math.floor(Math.random()*3+2) + ':' + Math.floor(Math.random()*60).toString().padStart(2,'0'),
          change: (Math.random()*5-2).toFixed(1),
          element: 'daily-avg-time-value',
          trendElement: 'daily-avg-time-trend'
        },
        convRate: {
          value: (Math.random()*3+2.5).toFixed(1),
          change: (Math.random()*3-1).toFixed(1),
          element: 'daily-conversion-rate-value',
          trendElement: 'daily-conversion-rate-trend'
        },
        revenue: {
          value: Math.floor(Math.random()*5000+3000),
          change: (Math.random()*20-5).toFixed(1),
          element: 'daily-total-revenue-value',
          trendElement: 'daily-total-revenue-trend'
        },
        orders: {
          value: Math.floor(Math.random()*20+15),
          change: (Math.random()*20-5).toFixed(1),
          element: 'daily-total-orders-value',
          trendElement: 'daily-total-orders-trend'
        },
        avgOrderValue: {
          value: Math.floor(Math.random()*100+150),
          change: (Math.random()*10-3).toFixed(1),
          element: 'daily-avg-order-value',
          trendElement: 'daily-avg-order-value-trend'
        },
        totalVisits: {
          value: Math.floor(Math.random()*1000+1000),
          change: (Math.random()*15-3).toFixed(1),
          element: 'daily-total-visits-value',
          trendElement: 'daily-total-visits-trend'
        },
        uniqueVisitors: {
          value: Math.floor(Math.random()*800+500),
          change: (Math.random()*12-2).toFixed(1),
          element: 'daily-unique-visitors-value',
          trendElement: 'daily-unique-visitors-trend'
        },
        bounceRate: {
          value: (Math.random()*15+25).toFixed(1),
          change: (Math.random()*8-4).toFixed(1), // Pode ser positivo ou negativo
          element: 'daily-bounce-rate-value',
          trendElement: 'daily-bounce-rate-trend',
          isInverted: true // Bounce rate menor é melhor
        }
      };

      for (const [key, data] of Object.entries(metrics)) {
        const el = document.getElementById(data.element);
        const trendEl = document.getElementById(data.trendElement);
        
        if (el) {
          if (key === 'revenue' || key === 'avgOrderValue') {
            el.textContent = currencySymbol + ' ' + (typeof data.value === 'number' ? data.value.toLocaleString() : data.value);
          } else {
            el.textContent = data.value;
          }
        }
        
        if (trendEl) {
          const change = parseFloat(data.change);
          let trendClass = 'neutral';
          
          // Lógica de cor ajustada
          if (change > 0) {
            trendClass = 'up';
          } else if (change < 0) {
            trendClass = 'down';
          }
          // Se change === 0, permanece 'neutral'
          
          const isInverted = data.isInverted || false; // Garante que isInverted seja booleano
          if (isInverted) { // Para métricas como Bounce Rate, onde menor é melhor
            if (change > 0) trendClass = 'down'; // Positivo é ruim (vermelho)
            else if (change < 0) trendClass = 'up'; // Negativo é bom (verde)
            // Se change === 0, permanece 'neutral' (cinza)
          }
          
          trendEl.className = 'metric-trend ' + trendClass;
          trendEl.innerHTML =
            '<span>' + (change > 0 ? '+' : '') + change +
            '%<span class="suffix"> vs same time yesterday</span>' +
            '</span>';
        }
      }
    }

    function formatTime(dt) {
      if (!(dt instanceof Date)) return '';
      const now = new Date();
      const diff = Math.floor((now - dt)/1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) {
        const m = Math.floor(diff/60);
        return m + (m===1?' min':' mins') + ' ago';
      }
      return dt.getHours().toString().padStart(2,'0') + ':' + dt.getMinutes().toString().padStart(2,'0');
    }

    window.addEventListener('beforeunload', () => {
      clearInterval(refreshInterval);
      clearInterval(dataInterval);
    });
  });