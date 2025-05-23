class AnalyticsService {
  constructor() {
    this.isLoading = false;
    this.currencyCode = 'BRL';
    this.previousVisitors = [];
    this.hasNewPurchases = false;
  }

  _randomNumber(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  _randomDataArray(length, min, max, decimals = 0) {
     if (length <= 0) return [];
    return Array(length).fill(0).map(() => this._randomNumber(min, max, decimals));
  }

  _getDateRangeForPeriod(period) {
    const endDate = new Date();
    let startDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
         startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'last7days':
        startDate.setDate(endDate.getDate() - 6);
         startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        startDate.setDate(endDate.getDate() - 29);
         startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'lastMonth':
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0, 23, 59, 59, 999);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1, 0, 0, 0, 0);
        break;
      default:
        startDate.setDate(endDate.getDate() - 29);
         startDate.setHours(0, 0, 0, 0);
    }
    return { startDate, endDate };
  }

   _getPreviousPeriod(startDate, endDate) {
        const diff = endDate.getTime() - startDate.getTime();
        const prevEndDate = new Date(startDate.getTime() - 1);
        prevEndDate.setHours(23, 59, 59, 999);
        const prevStartDate = new Date(prevEndDate.getTime() - diff);
         prevStartDate.setHours(0, 0, 0, 0);

        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endMonth = endDate.getMonth();
         if (startDate.getDate() === 1 && endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate() && startMonth === endMonth) {
            const prevMonthEndDate = new Date(startYear, startMonth, 0);
             prevMonthEndDate.setHours(23,59,59,999);
             const prevMonthStartDate = new Date(prevMonthEndDate.getFullYear(), prevMonthEndDate.getMonth(), 1);
             prevMonthStartDate.setHours(0,0,0,0);
             return { startDate: prevMonthStartDate, endDate: prevMonthEndDate };
         }

         const oneDay = 24 * 60 * 60 * 1000;
         if (diff < oneDay * 1.5 && startDate.getHours() === 0) {
             const prevSingleDay = new Date(startDate.getTime() - oneDay);
             prevSingleDay.setHours(0, 0, 0, 0);
             const prevSingleDayEnd = new Date(startDate.getTime() - 1);
             prevSingleDayEnd.setHours(23, 59, 59, 999);
             return { startDate: prevSingleDay, endDate: prevSingleDayEnd };
         }

        return { startDate: prevStartDate, endDate: prevEndDate };
    }


  _generateDateRange(startDate, endDate, granularity = 'day') {
    const dates = [];
    let current = new Date(startDate);
     if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
        return [];
    }

    while (current <= endDate) {
      dates.push(new Date(current));
      switch (granularity) {
        case 'hour': current.setHours(current.getHours() + 1); break;
        case 'day': current.setDate(current.getDate() + 1); break;
        case 'week': current.setDate(current.getDate() + 7); break;
        case 'month': current.setMonth(current.getMonth() + 1); break;
        default: current.setDate(current.getDate() + 1);
      }
    }
    return dates;
  }


  _formatDate(date, format = 'day') {
     if (!(date instanceof Date) || isNaN(date)) return '';
    const options = {};
    switch (format) {
      case 'hour': return date.getHours() + ':00';
      case 'day': return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      case 'week':
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) + ' - ' + weekEnd.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      case 'month': return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      default: return date.toLocaleDateString('pt-BR');
    }
  }

  _generateTimeSeriesData(startDate, endDate, granularity, valueRange, trend = 'random', decimals = 0, variationFactor = 1.0) {
        const dates = this._generateDateRange(startDate, endDate, granularity);
        let data = [];
        let currentVal = this._randomNumber(valueRange[0], (valueRange[0] + valueRange[1]) / 2, decimals) * variationFactor;

        if (dates.length === 0) return { dates: [], values: [] };

        data = dates.map((_, i) => {
            let step = 0;
            if(dates.length > 1) { step = (valueRange[1] - valueRange[0]) / (dates.length -1); }
            let noise = (valueRange[1] - valueRange[0]) * 0.15 * variationFactor;

            if (trend === 'increasing') { currentVal = valueRange[0] + (step * i) + this._randomNumber(-noise, noise, decimals); }
            else if (trend === 'decreasing') { currentVal = valueRange[1] - (step * i) + this._randomNumber(-noise, noise, decimals); }
            else { currentVal += this._randomNumber(-step || -noise, step || noise, decimals); }

            currentVal = Math.max(valueRange[0] * 0.7 * variationFactor, currentVal);
            currentVal = Math.min(valueRange[1] * 1.3 * variationFactor, currentVal);
             if (valueRange[0] >= 0) { currentVal = Math.max(0, currentVal); }

            return parseFloat(currentVal.toFixed(decimals));
        });

         if (dates.length === 1) { data = [this._randomNumber(valueRange[0], valueRange[1], decimals) * variationFactor]; }

        return {
            dates: dates.map(date => this._formatDate(date, granularity)),
            values: data
        };
    }


  _generateCategoryData(categories, valueRange, decimals = 0) {
    return categories.map(category => ({
        label: category,
        value: this._randomNumber(valueRange[0], valueRange[1], decimals)
    })).sort((a, b) => b.value - a.value);
  }

  _calculateSummary(values) {
      if (!values || values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0);
  }

  _calculateAverage(values) {
      if (!values || values.length === 0) return 0;
      return this._calculateSummary(values) / values.length;
  }


  async getRealTimeVisitors() {
    return new Promise(resolve => setTimeout(() => {
      // Generate comparison data to simulate same time yesterday metrics
      const comparisons = {
        // For each top product, simulate a percentage change
        productChanges: [
          {
            quantityChange: this._randomNumber(-10, 15, 1),
            revenueChange: this._randomNumber(-8, 20, 1),
            convRateChange: this._randomNumber(-5, 10, 1)
          },
          {
            quantityChange: this._randomNumber(-10, 15, 1),
            revenueChange: this._randomNumber(-8, 20, 1),
            convRateChange: this._randomNumber(-5, 10, 1)
          },
          {
            quantityChange: this._randomNumber(-10, 15, 1),
            revenueChange: this._randomNumber(-8, 20, 1),
            convRateChange: this._randomNumber(-5, 10, 1)
          },
          {
            quantityChange: this._randomNumber(-10, 15, 1),
            revenueChange: this._randomNumber(-8, 20, 1),
            convRateChange: this._randomNumber(-5, 10, 1)
          },
          {
            quantityChange: this._randomNumber(-10, 15, 1),
            revenueChange: this._randomNumber(-8, 20, 1),
            convRateChange: this._randomNumber(-5, 10, 1)
          }
        ],
        // Daily metrics vs yesterday same time
        totalVisits: {
          current: this._randomNumber(1200, 2000, 0),
          previous: this._randomNumber(1000, 1800, 0),
          change: this._randomNumber(-5, 15, 1)
        },
        uniqueVisitors: {
          current: this._randomNumber(700, 1200, 0),
          previous: this._randomNumber(650, 1100, 0),
          change: this._randomNumber(-5, 15, 1)
        },
        bounceRate: {
          current: this._randomNumber(25, 45, 1),
          previous: this._randomNumber(26, 46, 1),
          change: this._randomNumber(-8, 5, 1)
        }
      };
      
      // Simulate some visitors
      const visitorCount = this._randomNumber(5, 25, 0);
      const countries = ['Brazil','United States','Germany','France','Spain','UK','Canada','Italy','Japan','Australia'];
      const cities = ['São Paulo','New York','Berlin','Paris','Madrid','London','Toronto','Rome','Tokyo','Sydney'];
      const browsers = ['Chrome','Firefox','Safari','Edge'];
      const devices = ['Desktop','Mobile','Tablet'];
      const referrers = [
        { domain: 'google.com', name: 'Google', icon: 'fa-google' },
        { domain: 'facebook.com', name: 'Facebook', icon: 'fa-facebook' },
        { domain: 'instagram.com', name: 'Instagram', icon: 'fa-instagram' },
        { domain: 'twitter.com', name: 'Twitter', icon: 'fa-twitter' },
        { domain: null, name: 'Direct', icon: 'fa-arrow-right' }
      ];
      
      const campaigns = [
        { name: 'summer_sale_2025', source: 'google', medium: 'cpc' },
        { name: 'new_product_launch', source: 'facebook', medium: 'social' },
        { name: 'holiday_special', source: 'pinterest', medium: 'social' },
        { name: 'black_friday', source: 'google', medium: 'cpc' }
      ];
      
      const countryCodes = {
        'Brazil': 'br', 'United States': 'us', 'Germany': 'de', 'France': 'fr', 
        'Spain': 'es', 'UK': 'gb', 'Canada': 'ca', 'Italy': 'it', 'Japan': 'jp', 'Australia': 'au'
      };
      
      const simulatedVisitors = [];
      
      // Create new visitors or update previous visitors
      for (let i = 0; i < visitorCount; i++) {
        // Either create a new visitor or update an existing one from previous call
        const useExisting = this.previousVisitors.length > 0 && Math.random() < 0.7;
        
        if (useExisting) {
          // Update an existing visitor
          const existingIndex = Math.floor(Math.random() * this.previousVisitors.length);
          const existingVisitor = {...this.previousVisitors[existingIndex]};
          
          // Add new page view
          if (Math.random() < 0.7 && existingVisitor.actions && existingVisitor.actions.length) {
            const pages = [
              { url:'/', title:'Home Page' },
              { url:'/products', title:'Products Page' },
              { url:'/category/electronics', title:'Electronics Category' },
              { url:'/product/smartphone', title:'Smartphone Product' },
              { url:'/cart', title:'Shopping Cart' },
              { url:'/checkout', title:'Checkout' }
            ];
            
            const newAction = {
              page: pages[Math.floor(Math.random() * pages.length)],
              time: new Date(),
              isNew: true
            };
            
            existingVisitor.actions.push(newAction);
          }
          
          // Maybe add cart to visitor
          if (!existingVisitor.cart && Math.random() < 0.3) {
            const itemCount = Math.floor(Math.random() * 5) + 1;
            const cartTotal = (Math.random() * 500 + 50).toFixed(2);
            existingVisitor.cart = { itemCount, total: cartTotal };
          }
          
          // Maybe update existing cart value
          if (existingVisitor.cart && Math.random() < 0.4) {
            const addMore = Math.random() < 0.7;
            if (addMore) {
              // Increase cart value
              existingVisitor.cart.itemCount = Math.min(10, existingVisitor.cart.itemCount + 1);
              existingVisitor.cart.total = (parseFloat(existingVisitor.cart.total) + this._randomNumber(20, 80, 2)).toFixed(2);
            } else {
              // Decrease cart value (but keep at least 1 item)
              if (existingVisitor.cart.itemCount > 1) {
                existingVisitor.cart.itemCount--;
                existingVisitor.cart.total = Math.max(20, (parseFloat(existingVisitor.cart.total) - this._randomNumber(20, 50, 2))).toFixed(2);
              }
            }
          }
          
          // Maybe convert cart to purchase
          if (existingVisitor.cart && !existingVisitor.purchase && Math.random() < 0.5) {
            const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            existingVisitor.purchase = {
              orderId: orderId,
              totalValue: existingVisitor.cart.total, // Use cart total as purchase total
              itemCount: existingVisitor.cart.itemCount,
              purchaseTime: new Date(),
              paymentMethod: ['credit_card', 'paypal', 'pix'][Math.floor(Math.random() * 3)]
            };
            
            this.hasNewPurchases = true; // Flag to indicate new purchases
          }
          
          simulatedVisitors.push(existingVisitor);
        } else {
          // Create a new visitor
          const idx = Math.floor(Math.random() * countries.length);
          const visitorId = 'user_' + Math.random().toString(36).substring(2, 10);
          const isReturning = Math.random() > 0.4;
          const refIdx = Math.floor(Math.random() * referrers.length);
          
          // Randomly determine if this visitor has an active campaign
          const hasCampaign = Math.random() > 0.7;
          let campaign = null;
          if (hasCampaign) {
            campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
          }
          
          // Randomly determine if this visitor has items in cart
          const hasCart = Math.random() > 0.65;
          let cart = null;
          if (hasCart) {
            const itemCount = Math.floor(Math.random() * 5) + 1;
            const cartTotal = (Math.random() * 500 + 50).toFixed(2);
            cart = { itemCount, total: cartTotal };
          }
          
          const visitor = {
            id: Date.now() + i,
            externalId: visitorId,
            country: countries[idx],
            countryCode: countryCodes[countries[idx]] || 'un',
            city: cities[idx],
            browser: browsers[Math.floor(Math.random() * browsers.length)],
            device: devices[Math.floor(Math.random() * devices.length)],
            visitTime: new Date(),
            isReturning: isReturning,
            referrer: referrers[refIdx],
            campaign: campaign,
            cart: cart,
            actions: []
          };
          
          // Randomly create a purchase directly for ~5% of new visitors (impulse buy)
          if (Math.random() < 0.05) {
            const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const purchaseTotal = (Math.random() * 300 + 80).toFixed(2);
            const itemCount = Math.floor(Math.random() * 4) + 1;
            
            visitor.purchase = {
              orderId: orderId,
              totalValue: purchaseTotal,
              itemCount: itemCount,
              purchaseTime: new Date(),
              paymentMethod: ['credit_card', 'paypal', 'pix'][Math.floor(Math.random() * 3)]
            };
            
            this.hasNewPurchases = true; // Flag to indicate new purchases
          }
          
          // Add page views for this visitor
          const actionCount = Math.floor(Math.random() * 3) + 1;
          const pages = [
            { url:'/', title:'Home Page' },
            { url:'/products', title:'Products Page' },
            { url:'/category/electronics', title:'Electronics Category' },
            { url:'/product/smartphone', title:'Smartphone Product' },
            { url:'/cart', title:'Shopping Cart' },
            { url:'/checkout', title:'Checkout Page' }
          ];
          
          for (let j = 0; j < actionCount; j++) {
            const page = pages[Math.floor(Math.random() * pages.length)];
            const time = new Date(visitor.visitTime);
            time.setSeconds(time.getSeconds() + j * Math.floor(Math.random() * 60));
            visitor.actions.push({
              page,
              time,
              isNew: j === actionCount - 1
            });
          }
          
          simulatedVisitors.push(visitor);
        }
      }
      
      this.previousVisitors = [...simulatedVisitors];
      
      // Keep no more than 20 previous visitors
      if (this.previousVisitors.length > 20) {
        this.previousVisitors = this.previousVisitors.slice(0, 20);
      }
      
      const newPurchases = this.hasNewPurchases;
      this.hasNewPurchases = false;
      
      resolve({ 
        count: simulatedVisitors.length,
        comparisons: comparisons,
        visitors: simulatedVisitors,
        hasNewPurchases: newPurchases
      });
    }, 500));
  }

   async getVisitorOverview(period = 'last30days', granularity = 'day') {
        this.isLoading = true;
        return new Promise(resolve => {
            setTimeout(() => {
                const currentRange = this._getDateRangeForPeriod(period);
                const previousRange = this._getPreviousPeriod(currentRange.startDate, currentRange.endDate);

                const currentVisitors = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [100, 1500], 'increasing', 0);
                const currentUniqueVisitors = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [80, 1200], 'increasing', 0);
                const currentSessionDuration = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [60, 300], 'random', 0);
                const currentBounceRate = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [25, 65], 'decreasing', 1);

                const prevFactor = this._randomNumber(0.8, 1.2);
                const previousVisitors = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [100, 1500], 'increasing', 0, prevFactor);
                const previousUniqueVisitors = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [80, 1200], 'increasing', 0, prevFactor);
                const previousSessionDuration = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [60, 300], 'random', 0, prevFactor);
                const previousBounceRate = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [25, 65], 'decreasing', 1, prevFactor * this._randomNumber(0.9, 1.1));

                const currentSummary = {
                    totalVisitors: this._calculateSummary(currentVisitors.values),
                    totalUniqueVisitors: Math.min(this._calculateSummary(currentVisitors.values), this._calculateSummary(currentUniqueVisitors.values)),
                    avgSessionDuration: Math.max(0, this._calculateAverage(currentSessionDuration.values)),
                    avgBounceRate: Math.max(0, Math.min(100, this._calculateAverage(currentBounceRate.values)))
                };

                const previousSummary = {
                    totalVisitors: this._calculateSummary(previousVisitors.values),
                    totalUniqueVisitors: Math.min(this._calculateSummary(previousVisitors.values), this._calculateSummary(previousUniqueVisitors.values)),
                    avgSessionDuration: Math.max(0, this._calculateAverage(previousSessionDuration.values)),
                    avgBounceRate: Math.max(0, Math.min(100, this._calculateAverage(previousBounceRate.values)))
                };


                this.isLoading = false;
                resolve({
                  current: {
                    trend: {
                      dates: currentVisitors.dates,
                      visitors: currentVisitors.values,
                      uniqueVisitors: currentUniqueVisitors.values
                    },
                    summary: currentSummary
                  },
                  previous: {
                    summary: previousSummary
                  }
                });
            }, 1200);
        });
    }


   async getVisitorDemographics(period = 'last30days') {
     this.isLoading = true;
     return new Promise(resolve => {
       setTimeout(() => {
         const countries = ['Brazil', 'United States', 'Portugal', 'Argentina', 'Germany', 'United Kingdom', 'Canada', 'France', 'Other'];
         const geoData = this._generateCategoryData(countries, [50, 5000])
             .map(item => ({ country: item.label, visitors: item.value, code: this._getCountryCode(item.label) }));

         const devices = ['Desktop', 'Mobile', 'Tablet'];
         const deviceDataRaw = this._generateCategoryData(devices, [10, 80]);
         const totalDevice = deviceDataRaw.reduce((sum, d) => sum + d.value, 0);
         const deviceData = deviceDataRaw.map(d => ({ type: d.label, percentage: totalDevice > 0 ? parseFloat((d.value / totalDevice * 100).toFixed(1)) : 0 }));
         if(deviceData.length > 0) {
            let currentSum = deviceData.reduce((sum, d) => sum + d.percentage, 0);
             if (Math.abs(100 - currentSum) > 0.01) { // Adjust if sum is not close to 100
                deviceData[deviceData.length-1].percentage = parseFloat((deviceData[deviceData.length-1].percentage + (100 - currentSum)).toFixed(1));
             }
         }

         const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'FoxAppy', 'Other'];
         const browserData = this._generateCategoryData(browsers, [100, 3000]).map(b => ({ browser: b.label, users: b.value }));

         this.isLoading = false;
         resolve({ geography: geoData, devices: deviceData, browsers: browserData });
       }, 1000);
     });
   }

   _getCountryCode(countryName) {
        const codes = { 'Brazil': 'br', 'United States': 'us', 'Portugal': 'pt', 'Argentina': 'ar', 'Germany': 'de', 'United Kingdom': 'gb', 'Canada': 'ca', 'France': 'fr', 'Other': 'ot' };
        return codes[countryName] || 'xx';
    }

   async getVisitorEngagement(period = 'last30days', granularity = 'day') {
     this.isLoading = true;
     return new Promise(resolve => {
       setTimeout(() => {
         const currentRange = this._getDateRangeForPeriod(period);
         const previousRange = this._getPreviousPeriod(currentRange.startDate, currentRange.endDate);
         const prevFactor = this._randomNumber(0.8, 1.2);

         const currentSessionDuration = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [60, 300], 'random', 0);
         const currentBounceRate = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [25, 65], 'decreasing', 1);
         const currentActionsPerVisit = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [1.5, 6], 'increasing', 1);

         const previousSessionDuration = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [60, 300], 'random', 0, prevFactor);
         const previousBounceRate = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [25, 65], 'decreasing', 1, prevFactor * this._randomNumber(0.9, 1.1));
         const previousActionsPerVisit = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [1.5, 6], 'increasing', 1, prevFactor);

         const currentMetrics = {
             avgSessionDuration: Math.max(0, this._calculateAverage(currentSessionDuration.values)),
             avgBounceRate: Math.max(0, Math.min(100, this._calculateAverage(currentBounceRate.values))),
             avgActionsPerVisit: Math.max(1, this._calculateAverage(currentActionsPerVisit.values))
         };

         const previousMetrics = {
             avgSessionDuration: Math.max(0, this._calculateAverage(previousSessionDuration.values)),
             avgBounceRate: Math.max(0, Math.min(100, this._calculateAverage(previousBounceRate.values))),
             avgActionsPerVisit: Math.max(1, this._calculateAverage(previousActionsPerVisit.values))
         };

         this.isLoading = false;
         resolve({
           current: {
               dates: currentSessionDuration.dates,
               sessionDuration: currentSessionDuration.values,
               bounceRate: currentBounceRate.values,
               actionsPerVisit: currentActionsPerVisit.values,
               metrics: currentMetrics
           },
           previous: {
               metrics: previousMetrics
           }
         });
       }, 1300);
     });
   }

  async getPageViewMetrics(period = 'last30days') {
    this.isLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        const pages = [
          { page: '/', title: 'Home Page' }, { page: '/products', title: 'All Products' }, { page: '/category/electronics', title: 'Electronics Category' },
          { page: '/product/smartphone', title: 'Smartphone Product Page' }, { page: '/checkout', title: 'Checkout Page' }, { page: '/blog', title: 'Blog Page' },
          { page: '/about', title: 'About Us' }, { page: '/contact', title: 'Contact Us' }, { page: '/cart', title: 'Shopping Cart'}, { page: '/sale', title: 'Sale Items'}
        ];
        const pageData = pages.map(page => {
            const pageviews = this._randomNumber(100, 8000, 0);
            const uniquePageviews = Math.floor(pageviews * this._randomNumber(0.7, 0.95));
            const avgTime = this._randomNumber(30, 300, 0);
            const bounceRate = this._randomNumber(15, 70, 1);
            const exitRate = this._randomNumber(Math.max(5, bounceRate - 10), Math.min(95,bounceRate + 30), 1);
           return { ...page, pageviews, uniquePageviews, avgTime, bounceRate: Math.max(0, Math.min(100, bounceRate)), exitRate: Math.max(0, Math.min(100, exitRate)) };
        }).sort((a, b) => b.pageviews - a.pageviews);

        this.isLoading = false;
        resolve({ topPages: pageData.slice(0, 10) });
      }, 1400);
    });
  }

  async getUserFlowMetrics(period = 'last30days') {
    this.isLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        const entryPagesSource = [
          { page: '/', title: 'Home Page' }, { page: '/products', title: 'Products' }, { page: '/blog', title: 'Blog' },
          { page: '/category/electronics', title: 'Electronics' }, { page: '/search?q=gadget', title: 'Search Results' }, { page: '/sale', title: 'Sale Items'}
        ];
        const entryPagesData = entryPagesSource.map(page => ({
          ...page, entries: this._randomNumber(200, 6000, 0), bounceRate: this._randomNumber(30, 80, 1)
        })).sort((a, b) => b.entries - a.entries);

        const exitPagesSource = [
           { page: '/cart', title: 'Shopping Cart'}, { page: '/checkout', title: 'Checkout Page'}, { page: '/contact', title: 'Contact Page' },
           { page: '/products', title: 'Products Page' }, { page: '/blog', title: 'Blog Page' }, { page: '/', title: 'Home Page' },
        ];
        const exitPagesData = exitPagesSource.map(page => ({
          ...page, exits: this._randomNumber(100, 4000, 0), exitRate: this._randomNumber(20, 85, 1)
        })).sort((a, b) => b.exits - a.exits);

        this.isLoading = false;
        resolve({ entryPages: entryPagesData.slice(0,5), exitPages: exitPagesData.slice(0,5) });
      }, 1100);
    });
  }

  async getTrafficSources(period = 'last30days') {
    this.isLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        const sources = ['Direct', 'Organic Search', 'Referrals', 'Social Media', 'Email', 'Paid Search', 'Other'];
        const sourcesData = sources.map(source => {
            const visitors = this._randomNumber(500, 10000, 0);
            const conversionRate = this._randomNumber(1.0, 5.0, 2);
            const conversions = Math.round(visitors * conversionRate / 100);
            const revenue = this._randomNumber(conversions * 50, conversions * 150, 2);
            const bounceRate = this._randomNumber(20, 65, 1);
            
            return { 
                source, 
                visitors, 
                conversions,
                conversionRate: parseFloat(conversionRate.toFixed(2)), 
                revenue: parseFloat(revenue.toFixed(2)),
                bounceRate: parseFloat(bounceRate.toFixed(1)) 
            };
        });

        const campaigns = ['Summer Sale 2025','New Product Launch','Holiday Special','Flash Deals','Back to School', 'Newsletter Oct', 'Black Friday Prep'];
        const campaignData = campaigns.map(campaign => {
          const visits = this._randomNumber(100, 5000, 0);
          const convRate = this._randomNumber(1.0, 5.0, 2);
          const conversions = Math.round(visits * convRate / 100);
          const bounceRate = this._randomNumber(20, 75, 1);
          const avgTicket = this._randomNumber(40, 200, 2);
          const revenue = conversions * avgTicket;
          
          return {
            campaign, 
            visits,
            conversions,
            conversionRate: parseFloat(convRate.toFixed(2)),
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            avgTicket: parseFloat(avgTicket.toFixed(2)),
            revenue: parseFloat(revenue.toFixed(2))
          };
        });

        this.isLoading = false;
        resolve({ sources: sourcesData, campaigns: campaignData });
      }, 1500);
    });
  }

   async getReferrerData(period = 'last30days', granularity = 'day') {
     this.isLoading = true;
     return new Promise(resolve => {
       setTimeout(() => {
         const { startDate, endDate } = this._getDateRangeForPeriod(period);

         const websites = ['google.com', 'facebook.com', 'bing.com', 't.co', 'news.portal.com', 'partner-site.net', 'duckduckgo.com', 'yahoo.com'];
         const websiteData = this._generateCategoryData(websites, [10, 2000]).map(w => ({ url: w.label, visits: w.value }));

         const searchEngines = ['Google', 'Bing', 'DuckDuckGo', 'Yahoo', 'Baidu', 'Other'];
         const searchTrendData = {};
         const searchSummaryData = [];
         searchEngines.forEach(engine => {
           const trend = this._generateTimeSeriesData(startDate, endDate, granularity, [10, 800], 'random', 0);
           searchTrendData[engine.toLowerCase()] = trend.values;
           searchSummaryData.push({ engine: engine, visits: this._calculateSummary(trend.values)});
         });

         const utmSources = ['newsletter', 'facebook', 'google', 'instagram', 'partner', 'linkedin'];
         const utmMediums = ['email', 'cpc', 'social', 'banner', 'affiliate', 'display'];
         const utmCampaigns = ['summer_sale', 'new_collection', 'holiday_special', 'flash_sale', 're_engagement', 'webinar_q4'];
         const utmData = [];
         for (let i = 0; i < 15; i++) {
           utmData.push({
             source: utmSources[Math.floor(Math.random() * utmSources.length)],
             medium: utmMediums[Math.floor(Math.random() * utmMediums.length)],
             campaign: utmCampaigns[Math.floor(Math.random() * utmCampaigns.length)],
             visitors: this._randomNumber(50, 2500, 0),
             conversions: this._randomNumber(1, 150, 0)
           });
         }
         utmData.sort((a, b) => b.visitors - a.visitors);

         this.isLoading = false;
         resolve({
           topWebsites: websiteData.slice(0, 7),
           searchEnginesSummary: searchSummaryData.sort((a,b) => b.visits - a.visits),
           searchEnginesTrend: {
             dates: this._generateDateRange(startDate, endDate, granularity).map(d => this._formatDate(d, granularity)),
             labels: searchEngines,
             series: searchEngines.map(engine => ({ name: engine, data: searchTrendData[engine.toLowerCase()] || [] }))
           },
           utmParameters: utmData.slice(0, 7)
         });
       }, 1600);
     });
   }

  async getEcommerceMetrics(period = 'last30days', granularity = 'day') {
        this.isLoading = true;
        return new Promise(resolve => {
            setTimeout(() => {
                const currentRange = this._getDateRangeForPeriod(period);
                const previousRange = this._getPreviousPeriod(currentRange.startDate, currentRange.endDate);

                const currentRevenue = this._generateTimeSeriesData(currentRange.startDate, currentRange.endDate, granularity, [500, 8000], 'increasing', 2);
                const currentOrders = { dates: currentRevenue.dates, values: currentRevenue.values.map(rev => Math.max(1, Math.round(rev / this._randomNumber(80, 250)))) };
                const currentCR = { dates: currentRevenue.dates, values: [] };
                if (currentRevenue.values.length > 0) {
                     const totalCurrentOrders = this._calculateSummary(currentOrders.values);
                     currentCR.values = currentOrders.values.map((ord, i) => {
                          let baseCR = this._randomNumber(1.5, 4.0);
                          let factor = (ord || 1) / (totalCurrentOrders / currentOrders.values.length || 1);
                          let adjustedCR = baseCR * Math.sqrt(factor);
                          return parseFloat(Math.max(0.1, Math.min(10, adjustedCR)).toFixed(2));
                     });
                 }

                const prevFactor = this._randomNumber(0.8, 1.2);
                const previousRevenue = this._generateTimeSeriesData(previousRange.startDate, previousRange.endDate, granularity, [500, 8000], 'increasing', 2, prevFactor);
                 const previousOrders = { dates: [], values: previousRevenue.values.map(rev => Math.max(1, Math.round(rev / this._randomNumber(80, 250)))) };
                 const previousCR = { dates: [], values: [] };
                 if (previousRevenue.values.length > 0) {
                     const totalPreviousOrders = this._calculateSummary(previousOrders.values);
                     previousCR.values = previousOrders.values.map((ord, i) => {
                          let baseCR = this._randomNumber(1.5, 4.0);
                          let factor = (ord || 1) / (totalPreviousOrders / previousOrders.values.length || 1);
                          let adjustedCR = baseCR * Math.sqrt(factor);
                          return parseFloat(Math.max(0.1, Math.min(10, adjustedCR)).toFixed(2));
                     });
                 }

                const currentSummary = {
                    totalRevenue: this._calculateSummary(currentRevenue.values),
                    totalOrders: this._calculateSummary(currentOrders.values),
                    avgOrderValue: this._calculateSummary(currentOrders.values) > 0 ? parseFloat((this._calculateSummary(currentRevenue.values) / this._calculateSummary(currentOrders.values)).toFixed(2)) : 0,
                    avgConversionRate: this._calculateAverage(currentCR.values)
                };
                 const previousSummary = {
                    totalRevenue: this._calculateSummary(previousRevenue.values),
                    totalOrders: this._calculateSummary(previousOrders.values),
                    avgOrderValue: this._calculateSummary(previousOrders.values) > 0 ? parseFloat((this._calculateSummary(previousRevenue.values) / this._calculateSummary(previousOrders.values)).toFixed(2)) : 0,
                    avgConversionRate: this._calculateAverage(previousCR.values)
                };


                this.isLoading = false;
                resolve({
                    current: {
                        dates: currentRevenue.dates,
                        trends: {
                            revenue: currentRevenue.values,
                            orders: currentOrders.values,
                            conversionRate: currentCR.values
                        },
                        summary: currentSummary
                    },
                     previous: {
                        summary: previousSummary
                    }
                });
            }, 1500);
        });
    }


  async getProductPerformance(period = 'last30days') {
    this.isLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        const products = [
          { id: 'P001', name: 'Smartphone X Pro', category: 'Electronics' }, { id: 'P002', name: 'Wireless Earbuds', category: 'Electronics' },
          { id: 'P003', name: 'Fitness Tracker', category: 'Wearables' }, { id: 'P004', name: 'Ultra HD Smart TV', category: 'Electronics' },
          { id: 'P005', name: 'Gaming Laptop', category: 'Computers' }, { id: 'P006', name: 'Digital Camera', category: 'Electronics' },
          { id: 'P007', name: 'Bluetooth Speaker', category: 'Audio' }, { id: 'P008', name: 'Tablet Pro', category: 'Computers' },
          { id: 'P009', name: 'Wireless Keyboard', category: 'Accessories' }, { id: 'P010', name: 'Portable Charger', category: 'Accessories' },
          { id: 'P011', name: 'Smart Watch', category: 'Wearables' }, { id: 'P012', name: 'Gaming Mouse', category: 'Accessories' }
        ];

        const productData = products.map(product => {
             const sales = this._randomNumber(5, 300, 0);
             const revenue = sales * this._randomNumber(20, 500);
             const productViews = sales * this._randomNumber(10, 50);
             const addsToCart = Math.max(sales, Math.floor(productViews * this._randomNumber(0.1, 0.5)));
             const conversionRate = productViews > 0 ? parseFloat(Math.min(100, (sales / productViews * 100)).toFixed(2)) : 0;

             return { ...product, quantitySold: sales, revenue: parseFloat(revenue.toFixed(2)), conversionRate, productViews, addsToCart };
        }).sort((a, b) => b.revenue - a.revenue);

        this.isLoading = false;
        resolve({ topProducts: productData.slice(0, 10) });
      }, 1400);
    });
  }

}

const analyticsService = new AnalyticsService();