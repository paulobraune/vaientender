// products-core.js

document.addEventListener('DOMContentLoaded', function () {
  // Estado global do módulo
  window.products = [];
  window.totalProducts = 0;
  window.currentPage = 1;
  window.itemsPerPage = 20;
  window.searchTerm = '';
  window.currentEditingProduct = null;
  window.selectedProducts = new Set();
  window.userLanguage = document.documentElement.lang || 'en';

  window.selectedVideoFile = null;
  window.currentVideoUrl = null;
  window.videoUploading = false;
  
  // Filters state
  window.productFilters = {
    videolinkurl: '',
    exclude: '',
    age: '',
    gender: '',
    google: {
      productCategoryID: ''
    }
  };
  window.activeFiltersCount = 0;

  // Elementos globais
  window.productsTableBody = document.getElementById('productsTableBody');
  window.loadingRow = document.getElementById('loading-row');
  window.emptyRow = document.getElementById('empty-row');
  window.totalItemsSpan = document.getElementById('totalItems');
  window.pagination = document.getElementById('pagination');
  window.searchInput = document.getElementById('searchInput');
  window.searchButton = document.getElementById('searchButton');
  window.refreshButton = document.getElementById('refreshButton');
  window.saveProductChangesButton = document.getElementById('saveProductChanges');
  window.selectAllCheckbox = document.getElementById('selectAllCheckbox');
  window.bulkEditButton = document.getElementById('bulkEditButton');
  window.selectedCountSpan = document.getElementById('selectedCount');
  window.saveBulkChangesButton = document.getElementById('saveBulkChanges');
  window.filterApplyButton = document.getElementById('filterApply');
  window.filterClearButton = document.getElementById('filterClear');
  window.filterBadge = document.getElementById('filterBadge');
  window.activeFiltersContainer = document.getElementById('activeFilters');
  window.selectAllLoadingModal = document.getElementById('selectAllLoadingModal');
  window.selectAllProgressBar = document.getElementById('selectAllProgressBar');
  window.selectAllProgressText = document.getElementById('selectAllProgressText');

  window.formatCurrency = function(amount) {
    if (amount == null) return '-';
    const currency = (window.activeBusinessData && window.activeBusinessData.currency) ? window.activeBusinessData.currency : 'BRL';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Busca principal de produtos
  window.fetchProducts = async function(page = 1, search = '') {
    window.showLoading(true);
    try {
      const productGetListUrl = '/api/products';
      const businessId = window.activeBusinessData ? window.activeBusinessData.id : '';
      if (!businessId) throw new Error('No active business found');
      
      // Create a filters object that only includes filters with values
      const filters = {};
      if (window.productFilters.videolinkurl) filters.videolinkurl = window.productFilters.videolinkurl;
      if (window.productFilters.exclude) filters.exclude = window.productFilters.exclude;
      if (window.productFilters.age) filters.age = window.productFilters.age;
      if (window.productFilters.gender) filters.gender = window.productFilters.gender;
      
      if (window.productFilters.google && window.productFilters.google.productCategoryID) {
        filters.google = { productCategoryID: window.productFilters.google.productCategoryID };
      }
      
      const response = await fetch(productGetListUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          page,
          limit: window.itemsPerPage,
          search,
          filters: Object.keys(filters).length > 0 ? filters : undefined
        })
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      if (data.success) {
        window.products = data.products || [];
        window.totalProducts = data.totalProducts || window.products.length;
        window.renderProducts();
        window.renderPagination();
        window.updateTotalItems();
        window.updateBulkEditButton();
        window.updateActiveFilters();
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      showGlobalAlert(error.message, 'error');
    } finally {
      window.showLoading(false);
    }
  };

  // Busca produtos com search usando a API de pesquisa
  window.searchProducts = async function(searchTerm) {
    window.showLoading(true);
    try {
      const searchUrl = '/api/products/search';
      const businessId = window.activeBusinessData ? window.activeBusinessData.id : '';
      if (!businessId) throw new Error('No active business found');
      
      // Create a filters object that only includes filters with values
      const filters = {};
      if (window.productFilters.videolinkurl) filters.videolinkurl = window.productFilters.videolinkurl;
      if (window.productFilters.exclude) filters.exclude = window.productFilters.exclude;
      if (window.productFilters.age) filters.age = window.productFilters.age;
      if (window.productFilters.gender) filters.gender = window.productFilters.gender;
      
      if (window.productFilters.google && window.productFilters.google.productCategoryID) {
        filters.google = { productCategoryID: window.productFilters.google.productCategoryID };
      }
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          search_term: searchTerm,
          filters: Object.keys(filters).length > 0 ? filters : undefined
        })
      });
      
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        window.products = data.products || [];
        window.totalProducts = data.totalProducts || window.products.length;
        window.currentPage = 1; // Reset to first page on search
        window.renderProducts();
        window.renderPagination();
        window.updateTotalItems();
        window.updateBulkEditButton();
        window.updateActiveFilters();
      } else {
        throw new Error(data.message || 'Failed to search products');
      }
    } catch (error) {
      showGlobalAlert(error.message, 'error');
    } finally {
      window.showLoading(false);
    }
  };

  window.showLoading = function(isLoading) {
    if (window.loadingRow) window.loadingRow.style.display = isLoading ? '' : 'none';
    if (isLoading && window.emptyRow) window.emptyRow.style.display = 'none';
  };

  window.updateTotalItems = function() {
    if (window.totalItemsSpan) window.totalItemsSpan.textContent = window.totalProducts.toString();
  };

  window.syncProducts = async function() {
    try {
      const syncUrl = '/api/products/sync';
      const businessId = window.activeBusinessData?.id;
      if (!businessId) throw new Error('No active business found');
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });
      if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);
      const data = await resp.json();
      if (data.success) showGlobalAlert('Products synchronized successfully', 'success');
      else throw new Error(data.message || 'Failed to synchronize');
    } catch (err) {
      showGlobalAlert(`Failed to synchronize: ${err.message}`, 'error');
    }
  };
  
  // Filter functions
  window.applyFilters = function() {
    window.productFilters = {
      videolinkurl: document.getElementById('filterVideo').value,
      exclude: document.getElementById('filterStatus').value,
      age: document.getElementById('filterAge').value,
      gender: document.getElementById('filterGender').value,
      google: {
        productCategoryID: document.getElementById('filterTaxonomy').value
      }
    };
    
    // Count active filters
    window.activeFiltersCount = 0;
    if (window.productFilters.videolinkurl) window.activeFiltersCount++;
    if (window.productFilters.exclude) window.activeFiltersCount++;
    if (window.productFilters.age) window.activeFiltersCount++;
    if (window.productFilters.gender) window.activeFiltersCount++;
    if (window.productFilters.google.productCategoryID) window.activeFiltersCount++;
    
    // Update filter badge
    if (window.filterBadge) {
      window.filterBadge.textContent = window.activeFiltersCount;
      window.filterBadge.style.display = window.activeFiltersCount > 0 ? 'inline-flex' : 'none';
    }
    
    // Reload products with filters
    window.currentPage = 1; // Reset to first page
    if (window.searchTerm) {
      window.searchProducts(window.searchTerm);
    } else {
      window.fetchProducts(window.currentPage, '');
    }
  };
  
  window.clearFilters = function() {
    document.getElementById('filterVideo').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterAge').value = '';
    document.getElementById('filterGender').value = '';
    document.getElementById('filterTaxonomy').value = '';
    
    window.productFilters = {
      videolinkurl: '',
      exclude: '',
      age: '',
      gender: '',
      google: {
        productCategoryID: ''
      }
    };
    
    window.activeFiltersCount = 0;
    
    if (window.filterBadge) {
      window.filterBadge.textContent = '0';
      window.filterBadge.style.display = 'none';
    }
    
    window.currentPage = 1; // Reset to first page
    if (window.searchTerm) {
      window.searchProducts(window.searchTerm);
    } else {
      window.fetchProducts(window.currentPage, '');
    }
  };
  
  window.updateActiveFilters = function() {
    if (!window.activeFiltersContainer) return;
    
    window.activeFiltersContainer.innerHTML = '';
    
    const filterLabels = {
      videolinkurl: { true: 'With Video', false: 'Without Video' },
      exclude: { true: 'Inactive', false: 'Active' },
      age: { true: 'Age Group Defined', false: 'Age Group Not Defined' },
      gender: { true: 'Gender Defined', false: 'Gender Not Defined' },
      'google.productCategoryID': { true: 'Taxonomy Defined', false: 'Taxonomy Not Defined' }
    };
    
    // Add video filter tag
    if (window.productFilters.videolinkurl) {
      addFilterTag('Video', filterLabels.videolinkurl[window.productFilters.videolinkurl], () => {
        document.getElementById('filterVideo').value = '';
        window.productFilters.videolinkurl = '';
        window.applyFilters();
      });
    }
    
    // Add status filter tag
    if (window.productFilters.exclude) {
      addFilterTag('Status', filterLabels.exclude[window.productFilters.exclude], () => {
        document.getElementById('filterStatus').value = '';
        window.productFilters.exclude = '';
        window.applyFilters();
      });
    }
    
    // Add age filter tag
    if (window.productFilters.age) {
      addFilterTag('Age', filterLabels.age[window.productFilters.age], () => {
        document.getElementById('filterAge').value = '';
        window.productFilters.age = '';
        window.applyFilters();
      });
    }
    
    // Add gender filter tag
    if (window.productFilters.gender) {
      addFilterTag('Gender', filterLabels.gender[window.productFilters.gender], () => {
        document.getElementById('filterGender').value = '';
        window.productFilters.gender = '';
        window.applyFilters();
      });
    }
    
    // Add taxonomy filter tag
    if (window.productFilters.google && window.productFilters.google.productCategoryID) {
      addFilterTag('Taxonomy', filterLabels['google.productCategoryID'][window.productFilters.google.productCategoryID], () => {
        document.getElementById('filterTaxonomy').value = '';
        window.productFilters.google.productCategoryID = '';
        window.applyFilters();
      });
    }
    
    // Show clear all if there are active filters
    if (window.activeFiltersCount > 0) {
      const clearAllTag = document.createElement('button');
      clearAllTag.className = 'active-filter-tag';
      clearAllTag.innerHTML = '<i class="fas fa-times-circle"></i> Clear all filters';
      clearAllTag.addEventListener('click', window.clearFilters);
      window.activeFiltersContainer.appendChild(clearAllTag);
    }
  };
  
  function addFilterTag(name, value, removeCallback) {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag';
    tag.innerHTML = `
      <span>${name}: ${value}</span>
      <button class="remove-tag" title="Remove filter">
        <i class="fas fa-times"></i>
      </button>
    `;
    tag.querySelector('.remove-tag').addEventListener('click', removeCallback);
    window.activeFiltersContainer.appendChild(tag);
  }
  
  // Toggle filter section
  window.toggleFilterSection = function() {
    const filterSection = document.getElementById('filterOptions');
    const toggleButton = document.getElementById('filterToggle');
    
    if (filterSection.style.display === 'none' || !filterSection.style.display) {
      filterSection.style.display = 'block';
      toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Filters';
    } else {
      filterSection.style.display = 'none';
      toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i> Show Filters';
    }
  };

  if (window.searchButton) {
    window.searchButton.addEventListener('click', () => {
      window.searchTerm = window.searchInput.value.trim();
      if (window.searchTerm) {
        window.searchProducts(window.searchTerm);
      } else {
        window.currentPage = 1;
        window.fetchProducts(window.currentPage, '');
      }
    });
  }

  if (window.searchInput) {
    window.searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        window.searchTerm = window.searchInput.value.trim();
        if (window.searchTerm) {
          window.searchProducts(window.searchTerm);
        } else {
          window.currentPage = 1;
          window.fetchProducts(window.currentPage, '');
        }
      }
    });
  }

  if (window.refreshButton) {
    window.refreshButton.addEventListener('click', () => {
      window.refreshButton.disabled = true;
      window.refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      window.syncProducts()
        .then(() => {
          window.searchTerm = window.searchInput.value.trim();
          window.currentPage = 1;
          return window.fetchProducts(window.currentPage, window.searchTerm);
        })
        .finally(() => {
          window.refreshButton.disabled = false;
          window.refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Sync';
        });
    });
  }
  
  // Set up filter event listeners
  if (window.filterApplyButton) {
    window.filterApplyButton.addEventListener('click', window.applyFilters);
  }
  
  if (window.filterClearButton) {
    window.filterClearButton.addEventListener('click', window.clearFilters);
  }
  
  // Initialize filters
  if (document.getElementById('filterToggle')) {
    document.getElementById('filterToggle').addEventListener('click', window.toggleFilterSection);
  }

  // Select All Products functionality
  window.selectAllProducts = async function() {
    showSelectAllLoadingModal(true);
    window.selectedProducts.clear();

    const businessId = window.activeBusinessData?.id;
    if (!businessId) {
      showGlobalAlert('No active business found', 'error');
      showSelectAllLoadingModal(false);
      return;
    }

    try {
      let page = 1;
      let allProductsLoaded = false;
      let totalProductsLoaded = 0;
      const limit = 100; // Larger page size to minimize requests
      
      const filters = {};
      if (window.productFilters.videolinkurl) filters.videolinkurl = window.productFilters.videolinkurl;
      if (window.productFilters.exclude) filters.exclude = window.productFilters.exclude;
      if (window.productFilters.age) filters.age = window.productFilters.age;
      if (window.productFilters.gender) filters.gender = window.productFilters.gender;
      if (window.productFilters.google && window.productFilters.google.productCategoryID) {
        filters.google = { productCategoryID: window.productFilters.google.productCategoryID };
      }

      // If search term exists, use search endpoint
      if (window.searchTerm) {
        const searchResponse = await fetch('/api/products/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            search_term: window.searchTerm,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          })
        });

        if (!searchResponse.ok) throw new Error(`Server responded with ${searchResponse.status}`);
        const searchData = await searchResponse.json();

        if (searchData.success && searchData.products) {
          searchData.products.forEach(product => {
            window.selectedProducts.add(product.productId);
          });
          
          updateProgressBar(searchData.products.length, searchData.totalProducts || searchData.products.length);
          allProductsLoaded = true;
        }
      } else {
        // Fetch products page by page
        while (!allProductsLoaded) {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId,
              page,
              limit,
              search: '',
              filters: Object.keys(filters).length > 0 ? filters : undefined
            })
          });

          if (!response.ok) throw new Error(`Server responded with ${response.status}`);
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.message || 'Failed to fetch products');
          }

          const products = data.products || [];
          const totalProductsCount = data.totalProducts || 0;
          
          // Add product IDs to the selected set
          products.forEach(product => {
            window.selectedProducts.add(product.productId);
          });
          
          totalProductsLoaded += products.length;
          updateProgressBar(totalProductsLoaded, totalProductsCount);
          
          // Check if all products have been loaded
          if (products.length < limit || totalProductsLoaded >= totalProductsCount) {
            allProductsLoaded = true;
          } else {
            page++;
          }
        }
      }
      
      window.updateSelectedCount();
      window.updateBulkEditButton();
      window.selectAllCheckbox.checked = true;
      window.selectAllCheckbox.indeterminate = false;

      // Update checkboxes on the current page
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
      });

    } catch (error) {
      showGlobalAlert(`Error selecting all products: ${error.message}`, 'error');
    } finally {
      showSelectAllLoadingModal(false);
    }
  };
  
  // Select all on current page only
  window.selectCurrentPage = function() {
    const checkboxes = document.querySelectorAll('.product-select-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
      const productId = checkbox.getAttribute('data-product-id');
      if (productId) {
        window.selectedProducts.add(productId);
      }
    });
    window.selectAllCheckbox.checked = true;
    window.selectAllCheckbox.indeterminate = false;
    window.updateSelectedCount();
    window.updateBulkEditButton();
  };
  
  // Deselect all products
  window.deselectAll = function() {
    window.selectedProducts.clear();
    window.selectAllCheckbox.checked = false;
    window.selectAllCheckbox.indeterminate = false;
    const checkboxes = document.querySelectorAll('.product-select-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    window.updateSelectedCount();
    window.updateBulkEditButton();
  };
  
  // Show/hide the loading modal for select all
  function showSelectAllLoadingModal(show) {
    if (window.selectAllLoadingModal) {
      if (show) {
        window.selectAllLoadingModal.classList.add('pixel-modal--show');
        document.body.style.overflow = 'hidden';
      } else {
        window.selectAllLoadingModal.classList.remove('pixel-modal--show');
        document.body.style.overflow = '';
      }
    }
  }
  
  // Update progress bar in the loading modal
  function updateProgressBar(loaded, total) {
    if (window.selectAllProgressBar && window.selectAllProgressText) {
      const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
      window.selectAllProgressBar.style.width = `${percentage}%`;
      window.selectAllProgressText.textContent = loaded;
    }
  }
  
  // Set up select dropdown event listeners
  document.getElementById('selectCurrentPage')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.selectCurrentPage();
  });
  
  document.getElementById('selectAllProducts')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.selectAllProducts();
  });
  
  document.getElementById('deselectAll')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.deselectAll();
  });

  window.fetchProducts(window.currentPage, window.searchTerm);
});