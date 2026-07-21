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

        [Fact]
        public async Task GetSalesReport_WithAllParameters_ReturnsOk()
        {
            var response = await _client.GetAsync(
                "/api/salesreport?page=1&pageSize=10&customerId=1&search=widget&sortBy=invoicedate&sortDirection=desc&startDate=2016-01-01&endDate=2016-12-31");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
