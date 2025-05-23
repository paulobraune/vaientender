class DateRangePicker {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.dropdown = null;
    this.selectedPeriod = 'last30days'; // Default value
    this.onPeriodChange = null; // Callback to be set by the consumer
    
    if (this.element) {
      this.init();
    }
  }
  
  init() {
    this._createDropdown();
    
    // Setup event listeners
    this.element.addEventListener('click', this._toggleDropdown.bind(this));
    
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target) && !this.dropdown.contains(e.target)) {
        this._hideDropdown();
      }
    });
    
    // Update the initial text
    this._updateDisplayText();
  }
  
  _createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'dropdown-menu date-range-dropdown';
    this.dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1000;
      min-width: 210px;
      padding: 0.5rem;
      margin: 0.125rem 0 0;
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `;
    
    const options = [
      { id: 'today', label: 'Today' },
      { id: 'yesterday', label: 'Yesterday' },
      { id: 'last7days', label: 'Last 7 Days' },
      { id: 'last30days', label: 'Last 30 Days' },
      { id: 'thisMonth', label: 'This Month' },
      { id: 'lastMonth', label: 'Last Month' },
      { id: 'custom', label: 'Custom Range...' }
    ];
    
    options.forEach(option => {
      const item = document.createElement('a');
      item.className = 'dropdown-item';
      item.href = '#';
      item.textContent = option.label;
      item.dataset.period = option.id;
      item.style.cssText = `
        display: block;
        padding: 0.5rem 1rem;
        color: var(--text-primary);
        text-decoration: none;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
      `;
      item.addEventListener('mouseover', () => {
        item.style.backgroundColor = 'var(--surface-hover)';
      });
      item.addEventListener('mouseout', () => {
        item.style.backgroundColor = '';
      });
      
      if (option.id === this.selectedPeriod) {
        item.style.backgroundColor = 'var(--surface-hover)';
      }
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this._selectPeriod(option.id);
      });
      
      this.dropdown.appendChild(item);
    });
    
    document.body.appendChild(this.dropdown);
  }
  
  _toggleDropdown() {
    const isVisible = this.dropdown.style.display === 'block';
    
    if (isVisible) {
      this._hideDropdown();
    } else {
      this._showDropdown();
    }
  }
  
  _showDropdown() {
    const rect = this.element.getBoundingClientRect();
    this.dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    this.dropdown.style.left = `${rect.left + window.scrollX}px`;
    this.dropdown.style.display = 'block';
    
    // Highlight the selected item
    this.dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      if (item.dataset.period === this.selectedPeriod) {
        item.style.backgroundColor = 'var(--surface-hover)';
      } else {
        item.style.backgroundColor = '';
      }
    });
  }
  
  _hideDropdown() {
    this.dropdown.style.display = 'none';
  }
  
  _selectPeriod(periodId) {
    if (periodId === 'custom') {
      // In a real implementation, we would show a date range picker UI
      alert('Custom date range picker would appear here in a production implementation.');
      this._hideDropdown();
      return;
    }
    
    this.selectedPeriod = periodId;
    this._updateDisplayText();
    this._hideDropdown();
    
    // Call the callback if set
    if (typeof this.onPeriodChange === 'function') {
      this.onPeriodChange(periodId);
    }
  }
  
  _updateDisplayText() {
    const dateRangeText = this.element.querySelector('.date-range-text');
    if (!dateRangeText) return;
    
    switch (this.selectedPeriod) {
      case 'today':
        dateRangeText.textContent = 'Today';
        break;
      case 'yesterday':
        dateRangeText.textContent = 'Yesterday';
        break;
      case 'last7days':
        dateRangeText.textContent = 'Last 7 Days';
        break;
      case 'last30days':
        dateRangeText.textContent = 'Last 30 Days';
        break;
      case 'thisMonth':
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        dateRangeText.textContent = `${currentMonth}`;
        break;
      case 'lastMonth':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthName = lastMonth.toLocaleString('default', { month: 'long' });
        dateRangeText.textContent = `${lastMonthName}`;
        break;
      case 'custom':
        dateRangeText.textContent = 'Custom Range';
        break;
    }
  }
  
  setPeriod(periodId) {
    this.selectedPeriod = periodId;
    this._updateDisplayText();
  }
  
  getPeriod() {
    return this.selectedPeriod;
  }
}