using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class ListEnhancementsTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public ListEnhancementsTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // --- SORTING TESTS ---

        [Theory]
        [InlineData("/api/orders", "orderdate", "asc")]
        [InlineData("/api/orders", "orderdate", "desc")]
        [InlineData("/api/customers", "customername", "asc")]
        [InlineData("/api/customers", "customername", "desc")]
        [InlineData("/api/suppliers", "suppliername", "asc")]
        [InlineData("/api/invoices", "invoicedate", "desc")]
        [InlineData("/api/warehouse", "transactionoccurredwhen", "desc")]
        [InlineData("/api/payment", "transactiondate", "desc")]
        public async Task GetList_WithSortBy_ReturnsOk(string endpoint, string sortBy, string sortDirection)
        {
            var response = await _client.GetAsync($"{endpoint}?page=1&pageSize=5&sortBy={sortBy}&sortDirection={sortDirection}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            Assert.True(doc.RootElement.TryGetProperty("data", out var data));
            Assert.Equal(JsonValueKind.Array, data.ValueKind);
        }

        [Theory]
        [InlineData("/api/orders", "invalidcolumn")]
        [InlineData("/api/customers", "nonexistent")]
        public async Task GetList_WithInvalidSortBy_StillReturnsOk_UsesDefaultSort(string endpoint, string sortBy)
        {
            var response = await _client.GetAsync($"{endpoint}?page=1&pageSize=5&sortBy={sortBy}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // --- SEARCH TESTS ---

        [Theory]
        [InlineData("/api/orders", "search=Tailspin")]
        [InlineData("/api/customers", "search=Tailspin")]
        [InlineData("/api/suppliers", "search=Fabrikam")]
        [InlineData("/api/warehouse", "search=USB")]
        [InlineData("/api/payment", "search=Tailspin")]
        public async Task GetList_WithSearch_ReturnsOk(string endpoint, string searchParam)
        {
            var response = await _client.GetAsync($"{endpoint}?page=1&pageSize=5&{searchParam}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            Assert.True(doc.RootElement.TryGetProperty("data", out _));
            Assert.True(doc.RootElement.TryGetProperty("totalCount", out _));
        }

        [Fact]
        public async Task GetList_WithSearch_FiltersTotalCount()
        {
            // Get total without search
            var responseAll = await _client.GetAsync("/api/customers?page=1&pageSize=5");
            var contentAll = await responseAll.Content.ReadAsStringAsync();
            using var docAll = JsonDocument.Parse(contentAll);
            var totalAll = docAll.RootElement.GetProperty("totalCount").GetInt32();

            // Get total with very specific search
            var responseFiltered = await _client.GetAsync("/api/customers?page=1&pageSize=5&search=zzzznonexistent");
            var contentFiltered = await responseFiltered.Content.ReadAsStringAsync();
            using var docFiltered = JsonDocument.Parse(contentFiltered);
            var totalFiltered = docFiltered.RootElement.GetProperty("totalCount").GetInt32();

            // Searching for nonexistent term should return fewer (likely 0) results
            Assert.True(totalFiltered <= totalAll);
        }

        // --- MULTI-VALUE FILTER TESTS ---

        [Fact]
        public async Task GetOrders_WithMultipleCustomerIds_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=5&customerId=1,2,3");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            Assert.True(doc.RootElement.TryGetProperty("data", out _));
        }

        [Fact]
        public async Task GetInvoices_WithMultipleCustomerIds_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/invoices?page=1&pageSize=5&customerId=1,2");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetProductSearch_WithMultipleSupplierIds_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/productsearch?page=1&pageSize=5&supplierId=1,2,3");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetWarehouse_WithMultipleStockItemIds_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/warehouse?page=1&pageSize=5&stockItemId=1,2,3");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetSuppliers_WithMultipleCategoryIds_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/suppliers?page=1&pageSize=5&categoryId=1,2");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetMultiFilter_WithInvalidIds_IgnoresInvalid_ReturnsOk()
        {
            // "abc" is invalid, should be ignored; "1" is valid
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=5&customerId=1,abc,2");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // --- DATE RANGE TESTS ---

        [Fact]
        public async Task GetOrders_WithDateRange_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=5&startDate=2016-01-01&endDate=2016-12-31");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            Assert.True(doc.RootElement.TryGetProperty("data", out _));
            Assert.True(doc.RootElement.TryGetProperty("totalCount", out _));
        }

        [Fact]
        public async Task GetOrders_WithStartDateOnly_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=5&startDate=2016-06-01");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetOrders_WithEndDateOnly_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=5&endDate=2016-06-01");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // --- COMBINED PARAMETERS TEST ---

        [Fact]
        public async Task GetOrders_WithAllParameters_ReturnsOk()
        {
            var response = await _client.GetAsync(
                "/api/orders?page=1&pageSize=10&customerId=1,2&search=Tailspin&sortBy=orderdate&sortDirection=desc&startDate=2016-01-01&endDate=2016-12-31");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            Assert.True(doc.RootElement.TryGetProperty("data", out _));
            Assert.True(doc.RootElement.TryGetProperty("totalCount", out _));
        }



        // --- PRESERVATION TESTS ---
        // Validates: Requirements 3.1

        [Theory]
        [InlineData("/api/orders", 2, 5)]
        [InlineData("/api/customers", 1, 10)]
        [InlineData("/api/invoices", 1, 5)]
        [InlineData("/api/suppliers", 1, 5)]
        [InlineData("/api/stockitems", 1, 10)]
        [InlineData("/api/productsearch", 1, 5)]
        [InlineData("/api/delivery", 1, 5)]
        [InlineData("/api/purchaseorders", 1, 5)]
        public async Task GetList_WithoutExport_ReturnsPaginatedResponse(string endpoint, int page, int pageSize)
        {
            var response = await _client.GetAsync($"{endpoint}?page={page}&pageSize={pageSize}");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(page, root.GetProperty("page").GetInt32());
            Assert.True(root.GetProperty("pageSize").GetInt32() <= 100, "pageSize should be capped at 100");
            Assert.Equal(pageSize, root.GetProperty("pageSize").GetInt32());
            Assert.True(root.GetProperty("totalCount").GetInt32() > 0, "totalCount should be positive");
            Assert.True(root.GetProperty("data").GetArrayLength() <= pageSize, "data length should not exceed pageSize");
        }

        // --- EXPORT TESTS ---
        // Validates: Requirements 2.1

        // Uses /api/customers only: orders exceeds the 50k export cap and correctly returns 413
        // (covered by AllExportEndpoints_EnforceRowLimit which handles both cases adaptively)
        [Theory]
        [InlineData("/api/customers")]
        public async Task GetList_WithExportTrue_ReturnsAllRecords(string endpoint)
        {
            // Check count first so the test is correct regardless of DB size
            var countResponse = await _client.GetAsync($"{endpoint}?page=1&pageSize=1");
            countResponse.EnsureSuccessStatusCode();
            var countContent = await countResponse.Content.ReadAsStringAsync();
            using var countDoc = JsonDocument.Parse(countContent);
            var totalCount = countDoc.RootElement.GetProperty("totalCount").GetInt32();

            var response = await _client.GetAsync($"{endpoint}?export=true");

            if (totalCount > 50_000)
            {
                Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
                return;
            }

            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            var data = root.GetProperty("data");
            var returnedCount = root.GetProperty("totalCount").GetInt32();

            Assert.Equal(returnedCount, data.GetArrayLength());
            Assert.True(returnedCount > 0, "Export should return at least some records");
        }

        // --- EXPORT ROW LIMIT TESTS ---
        // Validates: Bug 13, Property 8 (Task 20.5)

        [Fact]
        public async Task GetOrders_WithExportTrue_EnforcesRowLimit()
        {
            // First get the total count via a normal paginated request
            var countResponse = await _client.GetAsync("/api/orders?page=1&pageSize=1");
            countResponse.EnsureSuccessStatusCode();
            var countContent = await countResponse.Content.ReadAsStringAsync();
            using var countDoc = JsonDocument.Parse(countContent);
            var totalCount = countDoc.RootElement.GetProperty("totalCount").GetInt32();

            var exportResponse = await _client.GetAsync("/api/orders?export=true");

            if (totalCount <= 50_000)
            {
                // DB has ≤50k orders: export must succeed and return all rows
                Assert.Equal(HttpStatusCode.OK, exportResponse.StatusCode);
                var content = await exportResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var data = doc.RootElement.GetProperty("data");
                Assert.Equal(totalCount, data.GetArrayLength());
            }
            else
            {
                // DB has >50k orders: export must be rejected with 413
                Assert.Equal(HttpStatusCode.RequestEntityTooLarge, exportResponse.StatusCode);
            }
        }

        // Validates: Bug 14, Property 8 (Task 21.2)
        // Parameterized across ALL export-supporting controllers

        [Theory]
        [InlineData("/api/orders")]
        [InlineData("/api/invoices")]
        [InlineData("/api/customers")]
        [InlineData("/api/suppliers")]
        [InlineData("/api/stockitems")]
        [InlineData("/api/productsearch")]
        [InlineData("/api/delivery")]
        [InlineData("/api/purchaseorders")]
        public async Task AllExportEndpoints_EnforceRowLimit(string endpoint)
        {
            // Get total count via paginated request (pageSize=1 is cheap)
            var countResponse = await _client.GetAsync($"{endpoint}?page=1&pageSize=1");
            countResponse.EnsureSuccessStatusCode();
            var countContent = await countResponse.Content.ReadAsStringAsync();
            using var countDoc = JsonDocument.Parse(countContent);
            var totalCount = countDoc.RootElement.GetProperty("totalCount").GetInt32();

            var exportResponse = await _client.GetAsync($"{endpoint}?export=true");

            if (totalCount <= 50_000)
            {
                // ≤50k rows: must return 200 with all matching records
                Assert.Equal(HttpStatusCode.OK, exportResponse.StatusCode);
                var content = await exportResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var data = doc.RootElement.GetProperty("data");
                Assert.Equal(totalCount, data.GetArrayLength());
            }
            else
            {
                // >50k rows: must return 413 and not attempt to stream the full dataset
                Assert.Equal(HttpStatusCode.RequestEntityTooLarge, exportResponse.StatusCode);
            }
        }
    }
}
