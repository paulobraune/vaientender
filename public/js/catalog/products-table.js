// products-table.js

document.addEventListener('DOMContentLoaded', function () {
  window.renderProducts = function() {
    if (window.loadingRow) window.loadingRow.style.display = 'none';

    const startIndex = (window.currentPage - 1) * window.itemsPerPage;
    const endIndex = startIndex + window.itemsPerPage;
    const paginated = window.products.slice(startIndex, endIndex);

    if (paginated.length === 0) {
      if (window.emptyRow) window.emptyRow.style.display = '';
      window.productsTableBody.querySelectorAll('tr:not(#loading-row):not(#empty-row)').forEach(r => r.remove());
      return;
    }

    if (window.emptyRow) window.emptyRow.style.display = 'none';
    window.productsTableBody.querySelectorAll('tr:not(#loading-row):not(#empty-row)').forEach(r => r.remove());

    paginated.forEach(product => {
      const row = document.createElement('tr');
      row.setAttribute('data-product-id', product.productId);

      const status = product.exclude ? 'inactive' : 'active';

      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'product-checkbox-cell';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'product-select-checkbox';
      checkbox.setAttribute('data-product-id', product.productId);
      checkbox.checked = window.selectedProducts.has(product.productId);
      checkbox.addEventListener('change', window.handleProductSelection);
      checkboxCell.appendChild(checkbox);
      row.appendChild(checkboxCell);

      const imageHtml = product.imageUrl
        ? `<div class="product-thumb-container">
             <img src="${product.imageUrl}" alt="${product.title}" class="product-thumb">
           </div>`
        : `<div class="product-thumb-container">
             <div class="d-flex align-items-center justify-content-center h-100 bg-light">
               <i class="fas fa-image text-muted"></i>
             </div>
           </div>`;

      const regularPrice = product.regularPrice || product.price || 0;
      const compareAtPrice = product.compareAtPrice || 0;
      const hasDiscount = compareAtPrice > 0 && compareAtPrice < regularPrice;

      const priceHtml = hasDiscount
        ? `<div class="regular-price has-sale">${window.formatCurrency(regularPrice)}</div>
           <div class="sale-price">${window.formatCurrency(compareAtPrice)}</div>`
        : `<div class="regular-price">${window.formatCurrency(regularPrice)}</div>`;

      const imageCell = document.createElement('td');
      imageCell.innerHTML = imageHtml;
      row.appendChild(imageCell);

      const titleCell = document.createElement('td');
      titleCell.innerHTML = `
        <div class="product-name">${product.title}</div>
        <div class="product-meta">ID: ${product.productId}</div>
        ${product.videolinkurl ? '<div class="product-meta"><i class="fas fa-video text-primary"></i> Has video</div>' : ''}
      `;
      row.appendChild(titleCell);

      const priceCell = document.createElement('td');
      priceCell.innerHTML = `<div class="product-price">${priceHtml}</div>`;
      row.appendChild(priceCell);

      const statusCell = document.createElement('td');
      statusCell.innerHTML = `
        <div class="catalog-status">
          <span class="catalog-badge catalog-badge-${status}"></span>
          <span class="catalog-status-text">${status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
      `;
      row.appendChild(statusCell);

      const genderCell = document.createElement('td');
      genderCell.textContent = window.formatGender(product.gender);
      row.appendChild(genderCell);

      const ageCell = document.createElement('td');
      ageCell.textContent = window.formatAgeGroup(product.age);
      row.appendChild(ageCell);

      const categoryCell = document.createElement('td');
      categoryCell.textContent = window.formatGoogleCategory(
        product.google?.productCategoryID,
        product.google?.productCategoryName
      );
      row.appendChild(categoryCell);

      const actionsCell = document.createElement('td');
      actionsCell.innerHTML = `
        <div class="d-flex gap-2">
          <button class="action-btn edit-product-btn" data-product-id="${product.productId}" title="Edit Product Details">
            <i class="fas fa-edit"></i>
          </button>
          ${product.link ? `
          <a href="${product.link}" target="_blank" class="action-btn" title="Open Product Page">
            <i class="fas fa-external-link-alt"></i>
          </a>` : ''}
        </div>
      `;
      row.appendChild(actionsCell);

      window.productsTableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-product-btn').forEach(button =>
      button.addEventListener('click', function() {
        window.openProductModal(this.getAttribute('data-product-id'));
      })
    );
  };

  window.renderPagination = function() {
    if (!window.pagination) return;
    window.pagination.innerHTML = '';
    if (window.totalProducts === 0) return;

    const totalPages = Math.ceil(window.totalProducts / window.itemsPerPage);

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${window.currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.addEventListener('click', e => {
      e.preventDefault();
      if (window.currentPage > 1) window.goToPage(window.currentPage - 1);
    });
    prevLi.appendChild(prevLink);
    window.pagination.appendChild(prevLi);

    let startPage = Math.max(1, window.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage === totalPages) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      const pageLi = document.createElement('li');
      pageLi.className = `page-item ${i === window.currentPage ? 'active' : ''}`;
      const pageLink = document.createElement('a');
      pageLink.className = 'page-link';
      pageLink.href = '#';
      pageLink.textContent = i;
      pageLink.addEventListener('click', e => {
        e.preventDefault();
        window.goToPage(i);
      });
      pageLi.appendChild(pageLink);
      window.pagination.appendChild(pageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${window.currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.addEventListener('click', e => {
      e.preventDefault();
      if (window.currentPage < totalPages) window.goToPage(window.currentPage + 1);
    });
    nextLi.appendChild(nextLink);
    window.pagination.appendChild(nextLi);
  };

  window.goToPage = function(page) {
    window.currentPage = page;
    window.renderProducts();
    window.renderPagination();
  };

  window.formatAgeGroup = function(age) {
    if (!age) return 'Not specified';
    const ageMap = {
      adult: 'Adult',
      'all ages': 'All ages',
      teen: 'Teen',
      kids: 'Kids',
      toddler: 'Toddler',
      infant: 'Infant',
      newborn: 'Newborn'
    };
    return ageMap[(age || '').toLowerCase()] || age;
  };

  window.formatGoogleCategory = function(id, name) {
    if (!id && !name) return 'Not specified';
    if (id && name) return `${id} - ${name}`;
    return name || id;
  };

  window.formatGender = function(gender) {
    if (!gender) return 'Not specified';
    const genderMap = {
      male: 'Male',
      female: 'Female',
      unisex: 'Unisex'
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  window.handleProductSelection = function(e) {
    const pid = e.target.getAttribute('data-product-id');
    if (e.target.checked) window.selectedProducts.add(pid);
    else { window.selectedProducts.delete(pid); window.selectAllCheckbox.checked = false; }
    window.updateSelectedCount();
    window.updateBulkEditButton();
    
    // Check if all products on the current page are selected
    const allChecked = Array.from(document.querySelectorAll('.product-select-checkbox'))
                            .every(cb => cb.checked);
    
    // If we have some selected but not all, show indeterminate state
    const someChecked = Array.from(document.querySelectorAll('.product-select-checkbox'))
                             .some(cb => cb.checked);
    
    if (allChecked) {
      window.selectAllCheckbox.checked = true;
      window.selectAllCheckbox.indeterminate = false;
    } else if (someChecked) {
      window.selectAllCheckbox.checked = false;
      window.selectAllCheckbox.indeterminate = true;
    } else {
      window.selectAllCheckbox.checked = false;
      window.selectAllCheckbox.indeterminate = false;
    }
  };

  window.handleSelectAllChange = function(e) {
    const checked = e.target.checked;
    document.querySelectorAll('.product-select-checkbox').forEach(cb => {
      cb.checked = checked;
      const pid = cb.getAttribute('data-product-id');
      if (checked) window.selectedProducts.add(pid);
      else window.selectedProducts.delete(pid);
    });
    window.updateSelectedCount();
    window.updateBulkEditButton();
  };

  window.updateSelectedCount = function() {
    if (window.selectedCountSpan) window.selectedCountSpan.textContent = window.selectedProducts.size.toString();
  };

  window.updateBulkEditButton = function() {
    if (window.bulkEditButton) window.bulkEditButton.disabled = window.selectedProducts.size === 0;
  };

  // Checkbox eventos
  if (window.selectAllCheckbox) window.selectAllCheckbox.addEventListener('change', window.handleSelectAllChange);
});