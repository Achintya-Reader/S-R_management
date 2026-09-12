// Global site JS - includes sales page handlers when table exists
$(function() {
    // Helper: update total
    function updateTotal() {
        var quantity = $('#qty').val() || 0;
        var price = $('#price_each').val() || 0;
        var total = parseFloat(quantity) * parseFloat(price);
        if (isNaN(total)) total = 0;
        $('#total').val('BDT ' + total.toFixed(2));
    }

    // If sales table present, initialize handlers
    if ($('#salesTable').length) {
        // Initialize DataTable if available
        if ($.fn.DataTable) {
            $('#salesTable').DataTable({ "order": [[0, "desc"]] });
        }

        // Reset form function
        function resetForm() {
            var form = $('#saleModal form');
            if (!form.length) return;
            form[0].reset();
            form.find('input[name="id"]').val('');
            $('#saleModal .modal-title').text('Add Sale');
            $('#available_stock').text('0');
            updateTotal();
        }

        // Handle edit button click
        $(document).on('click', '.edit-sale', function(e) {
            e.preventDefault();
            var btn = $(this);
            var id = btn.data('id');
            var customerId = btn.data('customer-id');
            var productId = btn.data('product-id');
            var qty = btn.data('qty');
            var price = btn.data('price');

            var form = $('#saleModal form');
            if (!form.length) return;

            form.find('input[name="id"]').val(id);
            form.find('select[name="customer_id"]').val(customerId);
            form.find('select[name="product_id"]').val(productId);
            form.find('input[name="qty"]').val(qty);
            form.find('input[name="price_each"]').val(price);

            // Trigger product select change to update stock/price display
            $('#product_select').trigger('change');
            updateTotal();

            $('#saleModal .modal-title').text('Edit Sale');
            var modal = new bootstrap.Modal(document.getElementById('saleModal'));
            modal.show();
        });

        // Show modal if server requested edit (server may echo JS variable)
        if (typeof window.showSaleModalOnLoad !== 'undefined' && window.showSaleModalOnLoad) {
            var modal = new bootstrap.Modal(document.getElementById('saleModal'));
            modal.show();
        }

        // Product change handler
        $(document).on('change', '#product_select', function() {
            var selected = $(this).find(':selected');
            var price = selected.data('price');
            var stock = selected.data('stock');

            // Only set price if id (hidden) is empty (new sale) - otherwise keep existing price
            if (!$('#saleModal input[name="id"]').val()) {
                $('#price_each').val(price || '');
            }
            $('#available_stock').text(stock || '0');
            updateTotal();
        });

        // Update total on input
        $(document).on('input', '#qty, #price_each', updateTotal);

        // Reset when modal hidden
        $('#saleModal').on('hidden.bs.modal', function () {
            resetForm();
        });

        // Reset on Add Sale button
        $('[data-bs-target="#saleModal"]').on('click', function() { resetForm(); });

        // Form submit validation
        $('#saleModal form').on('submit', function(e) {
            var stock = $('#product_select').find(':selected').data('stock') || 0;
            var quantity = parseInt($('#qty').val()) || 0;
            if (quantity > stock) {
                alert('Quantity cannot exceed available stock!');
                e.preventDefault();
            }
        });
    }

    // Global search handlers (if present)
    if ($('#globalSearchInput').length) {
        var searchTimeout;
        function performGlobalSearch(term) {
            if (!term || term.length < 2) return;
            console.debug('Global search term:', term);
            var resultsList = $('#searchResults');
            resultsList.empty();

            // Firestore client search (simple) - no server POST
            // If pages API exists, try it, otherwise use client cache if available
            if(window.doClientSearch){
                try{ window.doClientSearch(term, resultsList); return; }catch(e){ console.warn(e); }
            }
            $.ajax({
                url: '/api/search',
                method: 'POST',
                contentType:'application/json',
                data: JSON.stringify({q: term}),
                dataType: 'json',
                timeout: 5000,
                success: function(response) {
                    if(response && response.useClient && window.doClientSearch){ window.doClientSearch(term, resultsList); return; }
                    if (!response || response.length === 0) {
                        resultsList.append('<div class="list-group-item">No results found (client search fallback active on index/products pages)</div>');
                        return;
                    }
                    response.forEach(function(r) {
                        var item = $('<a>', { 'class': 'list-group-item list-group-item-action', href: r.link });
                        item.append('<div class="d-flex justify-content-between align-items-center"><div><h6 class="mb-1">'+r.title+'</h6><small class="text-muted">'+r.type+'</small></div><small class="text-muted">'+(r.date||'')+'</small></div>');
                        item.append('<p class="mb-1">'+r.description+'</p>');
                        resultsList.append(item);
                    });
                },
                error: function(xhr, status, err) {
                    if(window.doClientSearch){ window.doClientSearch(term, resultsList); }
                    else resultsList.html('<div class="list-group-item">Search requires Firestore - open index.html first to preload cache</div>');
                }
            });
        }

        $('#globalSearchInput').on('input', function() {
            var term = $(this).val().trim();
            clearTimeout(searchTimeout);
            if (term.length >= 2) {
                searchTimeout = setTimeout(function() {
                    $('#globalSearchModal').modal('show');
                    performGlobalSearch(term);
                }, 300);
            }
        });

        $('#globalSearchForm').on('submit', function(e) {
            e.preventDefault();
            var term = $('#globalSearchInput').val().trim();
            if (term.length >= 2) {
                $('#globalSearchModal').modal('show');
                performGlobalSearch(term);
            }
        });
    }
});
